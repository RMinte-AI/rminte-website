import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,existsSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {git} from './scope.mjs';

const version='8.30.1';
const distributions={
  'linux-x64':['linux_x64','551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'],
  'linux-arm64':['linux_arm64','e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080'],
  'darwin-arm64':['darwin_arm64','b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5'],
  'darwin-x64':['darwin_x64','dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709']
};
let installation;
export function gitleaks() {
  return installation||=install();
}
async function install() {
  const distribution=distributions[`${process.platform}-${process.arch}`];
  if(!distribution)throw new Error('Secret checks require Linux or macOS; on Windows use WSL.');
  const [name,expected]=distribution,cache=join(tmpdir(),'rminte-ci-tools');mkdirSync(cache,{recursive:true});
  const archive=join(cache,`gitleaks_${version}_${name}.tar.gz`);
  const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
  if(!existsSync(archive)||digest(readFileSync(archive))!==expected) {
    const response=await fetch(`https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_${name}.tar.gz`);
    if(!response.ok)throw new Error(`Cannot download pinned Gitleaks ${version}: HTTP ${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(digest(bytes)!==expected)throw new Error('Pinned Gitleaks archive checksum mismatch');
    writeFileSync(archive,bytes);
  }
  const directory=mkdtempSync(join(tmpdir(),'rminte-gitleaks-bin-'));
  execFileSync('tar',['-xzf',archive,'-C',directory,'gitleaks'],{stdio:'pipe'});
  return join(directory,'gitleaks');
}

export async function scanSecrets(root,run) {
  const binary=await gitleaks(),temporary=mkdtempSync(join(tmpdir(),'rminte-secret-check-'));
  try {
    const config=join(temporary,'rules.toml'),ignore=join(temporary,'.gitleaksignore');
    writeFileSync(config,'[extend]\nuseDefault = true\n');writeFileSync(ignore,'');
    const results=[];
    function scan(label,args) {
      const report=join(temporary,label+'.json');
      const result=spawnSync(binary,[...args,'--config',config,'--gitleaks-ignore-path',ignore,'--ignore-gitleaks-allow','--redact=100','--no-banner','--log-level=error','--report-format=json','--report-path',report],{cwd:root,encoding:'utf8',timeout:120_000});
      if(result.error)throw result.error;
      if(![0,1].includes(result.status))throw new Error(`Gitleaks ${label} could not complete (exit ${result.status})`);
      const findings=existsSync(report)?JSON.parse(readFileSync(report,'utf8')):[];
      if(result.status===1&&!findings.length)throw new Error(`Gitleaks ${label} failed without a findings report`);
      results.push(...findings.map(item=>({scan:label,rule:item.RuleID,file:item.File,line:item.StartLine,commit:item.Commit||null})));
    }
    const mergeBase=git(root,'merge-base',run.baseSha,run.headSha).trim();
    scan('commits',['git',root,`--log-opts=${mergeBase}..${run.headSha}`]);
    const current=join(temporary,'current');mkdirSync(current);
    for(const file of run.scope.files)if(existsSync(join(root,file))) {
      const destination=join(current,file);mkdirSync(dirname(destination),{recursive:true});copyFileSync(join(root,file),destination);
    }
    scan('current',['dir',current]);
    const output=join(root,'output/ci');mkdirSync(output,{recursive:true});
    writeFileSync(join(output,'secrets.json'),JSON.stringify({tool:`gitleaks ${version}`,status:results.length?'failed':'passed',findings:results},null,2)+'\n');
    if(results.length)throw new Error('Secrets detected: '+results.map(item=>`${item.rule} ${item.file}:${item.line}`).join('; ')+'; values are redacted.');
    return `Pinned Gitleaks ${version}: PR commits and current changed files contain no detected secrets.`;
  } finally {rmSync(temporary,{recursive:true,force:true});}
}
