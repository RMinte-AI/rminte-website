import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {wrangler} from './serve.mjs';
import {caseConfiguration} from './config.mjs';

export function buildWorkers(root,scope) {
  const configurations=new Set(scope.workerConfigs||[]);
  if(scope.caseService)configurations.add('services/case-access/wrangler.jsonc');
  if(scope.ota)configurations.add('services/tianshanos-ota/wrangler.jsonc');
  const temporary=mkdtempSync(join(tmpdir(),'rminte-worker-build-'));
  try {
    for(const [index,config] of [...configurations].sort().entries()) {
      const outdir=join(temporary,String(index));
      let args=['deploy','--dry-run','--config',join(root,config),'--outdir',outdir];
      if(config==='services/case-access/wrangler.jsonc') {
        const pages=caseConfiguration(root);
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
    return {compiledConfigurations:[...configurations],deployed:false};
  } finally {rmSync(temporary,{recursive:true,force:true});}
}
