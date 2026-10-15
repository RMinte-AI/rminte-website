// Run the actual verifier against disposable Git commits; no fixture is published.
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {git} from './scope.mjs';
import {writeReport} from './report.mjs';

const root=process.cwd(),output=join(root,'output/ci'),directory=join(output,'counterexamples');mkdirSync(directory,{recursive:true});
const report=JSON.parse(readFileSync(join(output,'report.json'),'utf8'));
const startedAt=new Date().toISOString(),results=[];
const source=mkdtempSync(join(tmpdir(),'rminte-counterexample-source-'));
const controls=['package.json','package-lock.json','playwright.config.mjs','scripts/ci','tests/browser'];
const sourceHead=git(root,'rev-parse','HEAD').trim();
const sourceFiles=git(root,'ls-files','-z').split('\0').filter(Boolean);
try {
  // Use the current tested controls, including local edits; commits below contain only each scenario's application difference.
  execFileSync('git',['clone','--shared','--no-hardlinks',root,source],{stdio:'pipe'});
  git(source,'checkout','--detach',sourceHead);git(source,'config','user.name','CI Counterexample');git(source,'config','user.email','ci-counterexample@example.invalid');
  for(const name of controls)cpSync(join(root,name),join(source,name),{recursive:true});
  git(source,'add',...controls);git(source,'commit','--allow-empty','-m','current verification controls');
  const baseline=git(source,'rev-parse','HEAD').trim();
  const scenarios=[
    {id:'case-login',check:'browser operations and evidence',file:'website/cases/cases.js',content:broken=>{
      const original=readFileSync(join(root,'website/cases/cases.js'),'utf8');
      const call='await CASE_AUTH.login(form.username.value, form.password.value);';
      if(!original.includes(call))throw new Error('The case-login counterexample must be updated for the current login implementation.');
      return broken?original.replace(call,"throw new Error('Counterexample: login submission is broken');"):original+'\n// Counterexample positive control.\n';
    }},
    {id:'new-route',check:'browser operations and evidence',file:'website/ci-new-route/index.html',content:broken=>`<!doctype html><html lang="zh-CN"><head><title>CI new route</title></head><body><main><h1>CI new route</h1></main><script>document.documentElement.lang=localStorage.getItem('rm-soft-lang')==='en'?'en':'zh-CN';${broken?'throw new Error("Counterexample: newly added page is broken");':''}</script></body></html>`},
    {id:'worker-entry',check:'Worker deployment builds',file:'services/tianshanos-ota/wrangler.jsonc',content:broken=>{
      const original=readFileSync(join(root,'services/tianshanos-ota/wrangler.jsonc'),'utf8');
      if(!original.includes('"main": "src/index.js"'))throw new Error('Update the Worker entry counterexample for the current configuration.');
      return broken?original.replace('"main": "src/index.js"','"main": "src/ci-missing-entry.js"'):original+'\n// Counterexample positive control.\n';
    }},
    {id:'secret-in-docs',check:'secret protection',file:'docs/ci-secret-fixture.md',content:broken=>{
      const alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const value=broken?['gh','p_'].join('')+Array.from(randomBytes(36),byte=>alphabet[byte%alphabet.length]).join(''):'synthetic-non-credential';
      return '# Nonfunctional synthetic credential fixture\n\ncredential = "'+value+'"\n';
    }}
  ];
  for(const scenario of scenarios) {
    const outcomes=[];
    for(const broken of [false,true]) {
      const fixture=mkdtempSync(join(tmpdir(),`rminte-${scenario.id}-`));
      try {
        execFileSync('git',['clone','--shared','--no-hardlinks',source,fixture],{stdio:'pipe'});
        git(fixture,'config','user.name','CI Counterexample');git(fixture,'config','user.email','ci-counterexample@example.invalid');
        symlinkSync(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
        const file=join(fixture,scenario.file);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,scenario.content(broken));
        git(fixture,'add',scenario.file);git(fixture,'commit','-m',broken?'negative fixture':'same-scope positive control');
        const head=git(fixture,'rev-parse','HEAD').trim(),event=join(fixture,'.git/ci-event.json');
        const body=['问题与原因','影响范围','验证结果','依据与限制'].map(label=>`## ${label}\nDisposable counterexample; not published.\n`).join('\n');
        writeFileSync(event,JSON.stringify({pull_request:{number:1,user:{login:'ci-fixture-contributor'},body,base:{sha:baseline},head:{sha:head}}}));
        const result=spawnSync(process.execPath,['scripts/ci/verify.mjs'],{cwd:fixture,encoding:'utf8',timeout:180_000,maxBuffer:10_000_000,env:{...process.env,CI:'true',GITHUB_EVENT_PATH:event,GITHUB_STEP_SUMMARY:'',GITHUB_OUTPUT:''}});
        writeFileSync(join(directory,`${scenario.id}-${broken?'negative':'positive'}.log`),(result.stdout||'')+(result.stderr||''));
        if(result.error)throw result.error;
        const actual=JSON.parse(readFileSync(join(fixture,'output/ci/report.json'),'utf8'));
        const required=actual.checks.find(check=>check.name===scenario.check);
        const failedChecks=actual.checks.filter(check=>check.required&&check.status!=='passed').map(check=>check.name);
        const outcome={negative:broken,exit:result.status,head,status:actual.status,check:scenario.check,checkStatus:required?.status,failedChecks,error:required?.error};
        outcomes.push(outcome);
        if(broken?(result.status!==1||actual.status!=='failed'||required?.status!=='failed'||failedChecks.length!==1||failedChecks[0]!==scenario.check):(result.status!==0||actual.status!=='passed'||required?.status!=='passed'))throw new Error(`${scenario.id}: ${broken?'negative did not fail only at the intended check':'same-scope positive did not pass'}`);
      } finally {rmSync(fixture,{recursive:true,force:true});}
    }
    results.push({scenario:scenario.id,status:'passed',outcomes});
    console.log(`PASS counterexample ${scenario.id}: normal passed; actual fault rejected by ${scenario.check}`);
  }
} catch(error) {
  results.push({status:'failed',error:error.message});process.exitCode=1;console.error(error.message);
} finally {
  rmSync(source,{recursive:true,force:true});
  const status=results.some(result=>result.status==='failed')?'failed':'passed';
  writeFileSync(join(output,'counterexamples.json'),JSON.stringify({status,sourceHead,sourceFiles:sourceFiles.length,published:false,productionAccess:false,results},null,2)+'\n');
  writeReport(root,report,[...report.checks.filter(check=>check.name!=='actual counterexamples'),{name:'actual counterexamples',required:true,status,startedAt,completedAt:new Date().toISOString(),note:'Same-scope normal controls pass; deliberate login, new-route, Worker-entry and synthetic-secret faults must fail their actual required checks. See counterexamples.json.'}]);
}
