// Run the actual verifier against disposable Git commits; no fixture is published.
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {git} from './scope.mjs';
import {writeReport} from './report.mjs';
import {workerPageManifest} from './pages.mjs';

const root=process.cwd(),output=join(root,'output/ci'),directory=join(output,'counterexamples');mkdirSync(directory,{recursive:true});
const report=JSON.parse(readFileSync(join(output,'report.json'),'utf8'));
const startedAt=new Date().toISOString(),results=[];
const source=mkdtempSync(join(tmpdir(),'rminte-counterexample-source-'));
const controls=['package.json','package-lock.json','playwright.config.mjs','scripts/ci','tests/browser'];
const sourceHead=git(root,'rev-parse','HEAD').trim();
const sourceFiles=git(root,'ls-files','-z').split('\0').filter(Boolean);
const read=file=>readFileSync(join(root,file),'utf8');
function write(fixture,file,content){const target=join(fixture,file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,content);}
function replace(source,from,to){if(!source.includes(from))throw new Error('Update the counterexample for its changed application contract: '+from);return source.replace(from,to);}
const html=fault=>`<!doctype html><html lang="zh-CN"><head><title>CI route</title></head><body><main><h1>CI route</h1></main><script>document.documentElement.lang=localStorage.getItem('rm-soft-lang')==='en'?'en':'zh-CN';${fault?'throw new Error("Counterexample: page runtime is broken");':''}</script></body></html>`;
try {
  execFileSync('git',['clone','--shared','--no-hardlinks',root,source],{stdio:'pipe'});
  git(source,'checkout','--detach',sourceHead);git(source,'config','user.name','CI Counterexample');git(source,'config','user.email','ci-counterexample@example.invalid');
  for(const name of controls)cpSync(join(root,name),join(source,name),{recursive:true});
  git(source,'add',...controls);git(source,'commit','--allow-empty','-m','current verification controls');
  const scenarios=[
    {id:'case-journey',check:'browser operations and evidence',variants:['login','granted-demo'],files:['website/cases/cases.js'],apply:(fixture,fault)=>{
      let content=read('website/cases/cases.js');
      if(fault==='login')content=replace(content,'await CASE_AUTH.login(form.username.value, form.password.value);',"throw new Error('Counterexample: login submission is broken');");
      else if(fault==='granted-demo')content=replace(content,"if (!(resource.kind === 'demo' ? user.can_demo : user.can_download))","if (resource.kind === 'demo' || !(resource.kind === 'demo' ? user.can_demo : user.can_download))");
      else content+='\n// Same-scope positive control.\n';
      write(fixture,'website/cases/cases.js',content);
    }},
    {id:'new-route',check:'browser operations and evidence',variants:['static-runtime','worker-runtime',{id:'undeclared-worker',check:'internal navigation HTTP'}],files:['website/ci-new-route/index.html','services/case-access/ci-generated.mjs',workerPageManifest],setup:fixture=>{
      write(fixture,'services/case-access/ci-generated.mjs','export function ciGenerated(){return null;}');
      write(fixture,'website/_worker.js',"import {ciGenerated} from '../services/case-access/ci-generated.mjs';\n"+replace(read('website/_worker.js'),'fetch(request, env) {','fetch(request, env) {\n    const generated=ciGenerated(request,env);if(generated)return generated;'));
      const routes=JSON.parse(read('website/_routes.json'));routes.include.push('/ci-generated/*');write(fixture,'website/_routes.json',JSON.stringify(routes));
      return ['services/case-access/ci-generated.mjs','website/_worker.js','website/_routes.json'];
    },apply:(fixture,fault)=>{
      write(fixture,'website/ci-new-route/index.html',replace(html(fault==='static-runtime'),'</main>','<a href="/ci-generated/">Worker page</a></main>'));
      write(fixture,'services/case-access/ci-generated.mjs',`export function ciGenerated(request){return new URL(request.url).pathname==="/ci-generated/"?new Response(${JSON.stringify(html(fault==='worker-runtime'))},{headers:{'Content-Type':'text/html; charset=utf-8'}}):null;}`);
      const entries=JSON.parse(read(workerPageManifest));
      if(fault!=='undeclared-worker')entries.push({path:'/ci-generated/',dependencies:['services/case-access/ci-generated.mjs']});
      write(fixture,workerPageManifest,JSON.stringify(entries));
    }},
    {id:'route-lifecycle',check:'browser operations and evidence',variants:[{id:'external-redirect',positive:true},{id:'runtime'},{id:'dangling-link',check:'internal navigation HTTP'}],files:['website/ci-route/index.html','services/case-access/ci-route.mjs',workerPageManifest],setup:fixture=>{
      write(fixture,'website/ci-route/index.html',html(false));
      write(fixture,'services/case-access/ci-route.mjs','export function ciRoute(request,env){return new URL(request.url).pathname==="/ci-route/"?env.ASSETS.fetch(request):null;}');
      write(fixture,'website/_worker.js',"import {ciRoute} from '../services/case-access/ci-route.mjs';\n"+replace(read('website/_worker.js'),'fetch(request, env) {','fetch(request, env) {\n    const route=ciRoute(request,env);if(route)return route;'));
      const routes=JSON.parse(read('website/_routes.json'));routes.include.push('/ci-route/*');
      write(fixture,'website/_routes.json',JSON.stringify(routes));
      write(fixture,'website/cases/index.html',replace(read('website/cases/index.html'),'</main>','<a href="/ci-route/">CI route</a></main>'));
      return ['website/ci-route/index.html','services/case-access/ci-route.mjs','website/_worker.js','website/_routes.json','website/cases/index.html'];
    },apply:(fixture,fault)=>{
      rmSync(join(fixture,'website/ci-route/index.html'));
      const response=fault==='dangling-link'?'null':fault==='external-redirect'?'Response.redirect("https://ci-external.invalid/needs-login",302)':`new Response(${JSON.stringify(html(fault==='runtime'))},{headers:{'Content-Type':'text/html; charset=utf-8'}})`;
      write(fixture,'services/case-access/ci-route.mjs',`export function ciRoute(request,env){return new URL(request.url).pathname==="/ci-route/"?${response}:null;}`);
      const entries=JSON.parse(read(workerPageManifest));
      if(!['dangling-link','external-redirect'].includes(fault))entries.push({path:'/ci-route/',dependencies:['services/case-access/ci-route.mjs']});
      write(fixture,workerPageManifest,JSON.stringify(entries));
    }},
    {id:'worker-entry',check:'deployment and operational configurations',files:['services/tianshanos-ota/wrangler.jsonc'],apply:(fixture,fault)=>{
      const original=read('services/tianshanos-ota/wrangler.jsonc');
      write(fixture,'services/tianshanos-ota/wrangler.jsonc',fault?replace(original,'"main": "src/index.js"','"main": "src/ci-missing-entry.js"'):original+'\n// Same-scope positive control.\n');
    }},
    {id:'production-config',check:'deployment and operational configurations',files:['services/case-access/production.jsonc'],apply:(fixture,fault)=>{
      const original=read('services/case-access/production.jsonc');
      write(fixture,'services/case-access/production.jsonc',fault?replace(original,'"binding": "CASE_DB"','"binding": "CI_MISSING_DB"'):original+'\n// Same-scope positive control.\n');
    }},
    {id:'secret-in-docs',check:'secret protection',files:['docs/ci-secret-fixture.md'],apply:(fixture,fault)=>{
      const alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const value=fault?['gh','p_'].join('')+Array.from(randomBytes(36),byte=>alphabet[byte%alphabet.length]).join(''):'synthetic-non-credential';
      write(fixture,'docs/ci-secret-fixture.md','# Nonfunctional synthetic credential fixture\n\ncredential = "'+value+'"\n');
    }}
  ];
  for(const scenario of scenarios) {
    const outcomes=[];
    const variants=[null,...(scenario.variants||['fault']).map(variant=>typeof variant==='string'?{id:variant}:variant)];
    for(const variant of variants) {
      const fixture=mkdtempSync(join(tmpdir(),`rminte-${scenario.id}-`));
      try {
        execFileSync('git',['clone','--shared','--no-hardlinks',source,fixture],{stdio:'pipe'});
        git(fixture,'config','user.name','CI Counterexample');git(fixture,'config','user.email','ci-counterexample@example.invalid');
        symlinkSync(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
        if(scenario.setup){git(fixture,'add',...scenario.setup(fixture));git(fixture,'commit','-m','scenario baseline');}
        const baseline=git(fixture,'rev-parse','HEAD').trim();
        const negative=Boolean(variant&&!variant.positive);
        scenario.apply(fixture,variant?.id);git(fixture,'add',...scenario.files);git(fixture,'commit','-m',negative?'negative fixture':'same-scope positive control');
        const head=git(fixture,'rev-parse','HEAD').trim(),event=join(fixture,'.git/ci-event.json');
        const body=['问题与原因','影响范围','验证结果','依据与限制'].map(label=>`## ${label}\nDisposable counterexample; not published.\n`).join('\n');
        writeFileSync(event,JSON.stringify({pull_request:{number:1,user:{login:'ci-fixture-contributor'},body,base:{sha:baseline},head:{sha:head}}}));
        const result=spawnSync(process.execPath,['scripts/ci/verify.mjs'],{cwd:fixture,encoding:'utf8',timeout:180_000,maxBuffer:10_000_000,env:{...process.env,CI:'true',GITHUB_EVENT_PATH:event,GITHUB_STEP_SUMMARY:'',GITHUB_OUTPUT:''}});
        writeFileSync(join(directory,`${scenario.id}-${variant?.id||'positive'}.log`),(result.stdout||'')+(result.stderr||''));
        if(result.error)throw result.error;
        const actual=JSON.parse(readFileSync(join(fixture,'output/ci/report.json'),'utf8'));
        const expectedCheck=variant?.check||scenario.check,required=actual.checks.find(check=>check.name===expectedCheck);
        const failedChecks=actual.checks.filter(check=>check.required&&check.status!=='passed').map(check=>check.name);
        outcomes.push({negative,variant:variant?.id||'positive',exit:result.status,head,status:actual.status,check:expectedCheck,checkStatus:required?.status,failedChecks,error:required?.error});
        if(negative?(result.status!==1||actual.status!=='failed'||required?.status!=='failed'||failedChecks.length!==1||failedChecks[0]!==expectedCheck):(result.status!==0||actual.status!=='passed'||required?.status!=='passed'))throw new Error(`${scenario.id}/${variant?.id||'positive'}: verifier did not ${negative?'reject only the intended fault':'pass the same-scope normal control'}`);
      } finally {rmSync(fixture,{recursive:true,force:true});}
    }
    results.push({scenario:scenario.id,status:'passed',outcomes});
    console.log(`PASS counterexample ${scenario.id}: ${outcomes.filter(outcome=>!outcome.negative).length} normal variant(s) passed; ${outcomes.filter(outcome=>outcome.negative).length} actual fault(s) rejected at their required checks`);
  }
} catch(error) {
  results.push({status:'failed',error:error.message});process.exitCode=1;console.error(error.message);
} finally {
  rmSync(source,{recursive:true,force:true});
  const status=results.some(result=>result.status==='failed')?'failed':'passed';
  writeFileSync(join(output,'counterexamples.json'),JSON.stringify({status,sourceHead,sourceFiles:sourceFiles.length,published:false,productionAccess:false,results},null,2)+'\n');
  writeReport(root,report,[...report.checks.filter(check=>check.name!=='actual counterexamples'),{name:'actual counterexamples',required:true,status,startedAt,completedAt:new Date().toISOString(),note:'Same-scope normal controls and actual login/resource, route lifecycle, configuration and credential faults. See counterexamples.json.'}]);
}
