import {readFileSync,existsSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {parse,printParseErrorCode} from 'jsonc-parser';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// These are the actual consumers documented by each service: Pages, D1 operations and Worker deployment.
export const configurationProfiles={
  caseService:[
    {file:'services/case-access/wrangler.jsonc',kind:'pages'}
  ],
  caseMigrations:[{file:'services/case-access/production.jsonc',kind:'d1',binding:'CASE_DB'}],
  ota:[{file:'services/tianshanos-ota/wrangler.jsonc',kind:'worker'}],
  caseDemos:[{file:'services/case-demos/wrangler.jsonc',kind:'worker'}]
};
export const configuredFiles=new Map(Object.values(configurationProfiles).flat().map(profile=>[profile.file,profile]));

export function caseResources(root) {
  const file=pathToFileURL(join(root,'services/case-access/resources.mjs')).href;
  return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e','const {resources}=await import(process.argv[1]); process.stdout.write(JSON.stringify(resources));',file],{cwd:root,encoding:'utf8'}));
}

export function readJsonc(root,relative) {
  const file=join(root,relative),errors=[];
  const config=parse(readFileSync(file,'utf8'),errors,{allowTrailingComma:true});
  if(errors.length)throw new Error(`${file}: invalid JSONC (${errors.map(error=>printParseErrorCode(error.error)).join(', ')})`);
  return config;
}

export function caseConfiguration(root,relative=configurationProfiles.caseService.find(profile=>profile.kind==='pages').file) {
  const file=join(root,relative);
  const config=readJsonc(root,relative);
  if(typeof config?.main!=='string'||typeof config?.assets?.directory!=='string')throw new Error(`${file}: expected the Pages main entry and assets.directory`);
  const entry=resolve(dirname(file),config.main),assets=resolve(dirname(file),config.assets.directory);
  if(entry!==join(root,'website/_worker.js')||assets!==join(root,'website'))throw new Error('Case-access configuration must reference the actual Pages _worker.js entry and website assets.');
  if(!existsSync(entry)||!existsSync(assets))throw new Error('Case-access deployment entry/assets do not exist.');
  const database=config.d1_databases?.find(database=>database.binding==='CASE_DB');
  if(!database)throw new Error('Case-access configuration is missing CASE_DB.');
  const demoFile='services/case-demos/wrangler.jsonc',binding=config.services?.find(service=>service.binding==='CASE_DEMOS');
  let demo;
  if(existsSync(join(root,demoFile))||binding) {
    demo=readJsonc(root,demoFile);
    if(binding?.service!==demo.name)throw new Error('CASE_DEMOS must bind to the case-demos Worker declared in its configuration.');
    if(demo.workers_dev!==false||demo.preview_urls!==false||!Array.isArray(demo.routes)||demo.routes.length)throw new Error('Case demos must remain private: disable workers.dev, preview URLs and public routes.');
    demo={...demo,main:resolve(root,'services/case-demos',demo.main),assets:{...demo.assets,directory:resolve(root,'services/case-demos',demo.assets.directory)}};
  }
  return {...config,entry,assets,database,demo,migrations:resolve(dirname(file),database.migrations_dir||'migrations')};
}
