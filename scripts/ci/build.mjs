import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {wrangler} from './serve.mjs';
import {caseConfiguration,configurationProfiles,configuredFiles} from './config.mjs';

export function checkConfigurations(root,scope) {
  const configurations=new Map((scope.configurationFiles||[]).map(file=>[file,configuredFiles.get(file)||{file,kind:'worker'}]));
  for(const [dependency,profiles] of Object.entries(configurationProfiles))if(scope[dependency])for(const profile of profiles)configurations.set(profile.file,profile);
  const temporary=mkdtempSync(join(tmpdir(),'rminte-worker-build-'));
  try {
    for(const [index,[config,profile]] of [...configurations].sort(([a],[b])=>a.localeCompare(b)).entries()) {
      const outdir=join(temporary,String(index));
      let args=['deploy','--dry-run','--config',join(root,config),'--outdir',outdir];
      if(profile.kind==='d1') {
        args=['d1','migrations','apply',profile.binding,'--local','--config',join(root,config),'--persist-to',outdir];
      } else if(profile.kind==='pages') {
        const pages=caseConfiguration(root,config);
        // --build-output-directory selects the advanced-mode _worker.js without a functions/ directory.
        args=['pages','functions','build','--project-directory',root,'--build-output-directory',pages.assets,'--outdir',outdir,'--compatibility-date',pages.compatibility_date];
        for(const flag of pages.compatibility_flags||[])args.push('--compatibility-flags',flag);
      }
      const result=spawnSync(process.execPath,[wrangler,...args],{
        cwd:root,encoding:'utf8',timeout:120_000,maxBuffer:10_000_000,
        env:{...process.env,XDG_CONFIG_HOME:join(temporary,'config'),WRANGLER_LOG_PATH:join(temporary,'logs'),WRANGLER_SEND_METRICS:'false'}
      });
      const log=join(root,'output/ci',`build-${config.replace(/[^a-z0-9]+/gi,'-')}.log`);mkdirSync(dirname(log),{recursive:true});
      writeFileSync(log,(result.stdout||'')+(result.stderr||''));
      if(result.error)throw result.error;
      if(result.status!==0)throw new Error(`${config}: deployment configuration/build failed; see ${log.slice(root.length+1)}`);
    }
    return {validatedConfigurations:[...configurations.values()],deployed:false,databaseLocation:'local'};
  } finally {rmSync(temporary,{recursive:true,force:true});}
}
