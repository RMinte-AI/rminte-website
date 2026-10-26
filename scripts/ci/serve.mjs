// Actual Pages + private demo Worker, backed by disposable local D1 data.
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,writeFileSync,copyFileSync,readdirSync,rmSync,existsSync,cpSync,readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
import {caseConfiguration,caseResources} from './config.mjs';

const toolsRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const wrangler=join(toolsRoot,'node_modules/wrangler/bin/wrangler.js');

export async function startServer(root,port,logFile,{withoutDemoBinding=false,withBindings=false}={}) {
  const runtime=mkdtempSync(join(toolsRoot,'output/ci/runtime-')),children=[];
  const fixtures=join(runtime,'services/case-access'),secret=randomBytes(32).toString('base64'),password='Ci-'+randomBytes(16).toString('hex');
  const env={...process.env,XDG_CONFIG_HOME:join(runtime,'config'),WRANGLER_REGISTRY_PATH:join(runtime,'registry'),WRANGLER_LOG_PATH:join(runtime,'logs'),WRANGLER_SEND_METRICS:'false',CHOKIDAR_USEPOLLING:'true'};
  let output='',worker,bindings;
  const command=args=>execFileSync(process.execPath,[wrangler,...args],{cwd:runtime,env,encoding:'utf8',stdio:'pipe',timeout:90_000});
  const stop=async()=>{
    await worker?.dispose();
    for(const child of children.reverse())if(child.exitCode===null&&child.signalCode===null) {
      const exited=new Promise(done=>child.once('exit',done));child.kill('SIGTERM');
      await Promise.race([exited,delay(3000,undefined,{ref:false})]);
      if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}
    }
    if(logFile)writeFileSync(logFile,output.replaceAll(secret,'[temporary fixture secret]'));
    rmSync(runtime,{recursive:true,force:true});
  };
  async function start(args,url) {
    const child=spawn(process.execPath,[wrangler,...args,'--ip','127.0.0.1','--log-level','error','--show-interactive-dev-session=false'],{cwd:runtime,env,stdio:['ignore','pipe','pipe']});
    children.push(child);
    child.stdout.on('data',value=>{output+=value;});child.stderr.on('data',value=>{output+=value;});
    for(let attempt=0;attempt<120;attempt++) {
      if(child.exitCode!==null)break;
      try {
        const response=await fetch(url,{signal:AbortSignal.timeout(800)}),ready=response.status<500;
        await response.body?.cancel();if(ready)return;
      }catch{/* Wait for the local socket. */}
      await delay(250);
    }
    throw new Error(`Local runtime did not start at ${url}: ${output.replaceAll(secret,'[temporary fixture secret]')}`);
  }
  try {
    const source=caseConfiguration(root),url=`http://127.0.0.1:${port}`;
    // Bundle Pages and its API from the same disposable tree. The registry below
    // is therefore read by the actual Worker, not just by the test script.
    const assets=join(runtime,'website');cpSync(source.assets,assets,{recursive:true});
    mkdirSync(fixtures,{recursive:true});
    for(const name of ['api.mjs','crypto.mjs']){copyFileSync(join(root,'services/case-access',name),join(fixtures,name));}
    if(existsSync(join(root,'services/sample-loan')))cpSync(join(root,'services/sample-loan'),join(runtime,'services/sample-loan'),{recursive:true});
    const dealerCatalog=join(root,'services/case-access/dealer-materials.mjs');
    if(existsSync(dealerCatalog))copyFileSync(dealerCatalog,join(fixtures,'dealer-materials.mjs')); // Base snapshots can predate dealer resources.
    const registry=join(root,'services/case-access/tests/resources.json');
    const registered=caseResources(root),testResources=existsSync(registry)?JSON.parse(readFileSync(registry,'utf8')):{};
    if(Object.keys(testResources).some(id=>id in registered))throw new Error('Local fixtures must not override registered cases.');
    const hasBucket=source.r2_buckets?.some(binding=>binding.binding==='CASE_FILES');
    if(Object.values(registered).some(resource=>resource.fileKey)&&!hasBucket)throw new Error('Registered case downloads require the CASE_FILES R2 binding in the Pages configuration.');
    const resources={...registered,...testResources},files=Object.entries(resources).filter(([,resource])=>resource.fileKey);
    const bucket=hasBucket||Object.values(testResources).some(resource=>resource.fileKey)?'rminte-ci-files':null;
    const services=withoutDemoBinding?[]:source.services||[];
    for(const requiredPort of [port,port+300,...(source.demo?[port+100,port+200]:[])])await new Promise((done,reject)=>{
      const probe=createServer();probe.once('error',()=>reject(new Error(`CI port ${requiredPort} is occupied.`)));probe.listen(requiredPort,'127.0.0.1',()=>probe.close(done));
    });
    mkdirSync(join(fixtures,'.local'),{recursive:true,mode:0o700});mkdirSync(join(fixtures,'tests'));
    const sampleBucket=source.r2_buckets?.some(b=>b.binding==='SAMPLE_FILES')?'rminte-ci-sample-files':null;
    const config={name:'rminte-ci-local',pages_build_output_dir:assets,compatibility_date:source.compatibility_date,compatibility_flags:source.compatibility_flags||[],services,r2_buckets:[...(bucket?[{binding:'CASE_FILES',bucket_name:bucket}]:[]),...(sampleBucket?[{binding:'SAMPLE_FILES',bucket_name:sampleBucket}]:[])],d1_databases:[{binding:'CASE_DB',database_name:'rminte-ci-local',database_id:randomUUID(),migrations_dir:source.migrations}]};
    for(const destination of [join(runtime,'wrangler.jsonc'),join(fixtures,'wrangler.jsonc')])writeFileSync(destination,JSON.stringify(config));
    for(const destination of [join(runtime,'.dev.vars'),join(fixtures,'.dev.vars')])writeFileSync(destination,`CASE_SECRET="${secret}"\nSAMPLE_SECRET="${secret}"\n`,{mode:0o600});
    writeFileSync(join(fixtures,'.local/admin-login.txt'),`本地 CI 临时数据（未部署）\n用户名：admin\n密码：${password}\n`,{mode:0o600});
    const {hashAdminPassword}=await import(pathToFileURL(join(root,'services/case-access/crypto.mjs'))),mac=await hashAdminPassword(secret,'admin',password),sql=join(runtime,'seed.sql');
    const modern=existsSync(join(root,'services/case-access/migrations/0002_account_permissions.sql'));
    writeFileSync(sql,`INSERT INTO users(id,username,role,password_mac,password_cipher,can_demo,can_download,created_at${modern?',is_owner':''}) VALUES('${randomUUID()}','admin','admin','${mac}',NULL,1,1,${Math.floor(Date.now()/1000)}${modern?',1':''});${modern?'UPDATE access_settings SET ready=1 WHERE id=1;':''}`,{mode:0o600});
    writeFileSync(join(fixtures,'resources.mjs'),'export const resources = '+JSON.stringify(resources)+';\n');
    for(const name of readdirSync(join(root,'services/case-access/tests')))if(name.endsWith('.mjs'))copyFileSync(join(root,'services/case-access/tests',name),join(fixtures,'tests',name));
    command(['d1','migrations','apply','CASE_DB','--local','--config',join(fixtures,'wrangler.jsonc')]);
    command(['d1','execute','CASE_DB','--local','--config',join(fixtures,'wrangler.jsonc'),'--file',sql]);
    for(const [id,resource] of files) {
      const directory=join(root,'services/case-access/tests/files'),file=resolve(directory,resource.fileKey);
      if(!file.startsWith(directory+'/')||!existsSync(file))throw new Error(`Download ${id}: add the synthetic local R2 fixture at services/case-access/tests/files/${resource.fileKey}.`);
      const expected=resolve(fixtures,'tests/files',resource.fileKey);mkdirSync(dirname(expected),{recursive:true});copyFileSync(file,expected);
      command(['r2','object','put',`${bucket}/${resource.fileKey}`,'--local','--config',join(fixtures,'wrangler.jsonc'),'--persist-to',join(fixtures,'.wrangler/state'),'--file',file,'--content-type','application/octet-stream']);
    }
    if(source.demo) {
      const demoConfig=join(runtime,'demo.jsonc');writeFileSync(demoConfig,JSON.stringify(source.demo));
      await start(['dev','--config',demoConfig,'--port',String(port+100),'--inspector-port',String(port+200)],`http://127.0.0.1:${port+100}`);
    }
    if(withBindings) {
      // The interactive PDF preview must use this worker's own D1/R2 proxies.
      // A second getPlatformProxy process would open the same SQLite files twice.
      const workerConfig=join(runtime,'preview-worker.json');
      const {pages_build_output_dir,...workerBindings}=config;
      writeFileSync(workerConfig,JSON.stringify({...workerBindings,main:join(assets,'_worker.js'),assets:{directory:assets,binding:'ASSETS',run_worker_first:['/api/*','/visitor-language.js']}}));
      for(const name of ['XDG_CONFIG_HOME','WRANGLER_LOG_PATH','WRANGLER_REGISTRY_PATH','WRANGLER_SEND_METRICS','CHOKIDAR_USEPOLLING'])process.env[name]=env[name];
      const {unstable_startWorker}=await import('wrangler');
      worker=await unstable_startWorker({config:workerConfig,dev:{server:{hostname:'127.0.0.1',port},inspector:false,persist:join(fixtures,'.wrangler/state'),registry:env.WRANGLER_REGISTRY_PATH,watch:false,logLevel:'error'}});
      await worker.ready;
      bindings=await worker.raw.runtimes[0].mf.getBindings(config.name);
    } else {
      await start(['pages','dev','--port',String(port),'--inspector-port',String(port+300),'--persist-to',join(fixtures,'.wrangler/state'),'--d1',`CASE_DB=${config.d1_databases[0].database_id}`,...(bucket?['--r2',`CASE_FILES=${bucket}`]:[]),...(sampleBucket?['--r2',`SAMPLE_FILES=${sampleBucket}`]:[]),'--binding',`CASE_SECRET=${secret}`,'--binding',`SAMPLE_SECRET=${secret}`,...services.flatMap(service=>['--service',`${service.binding}=${service.service}`])],url);
    }
    const probe=await fetch(url+'/api/admin/users');await probe.body?.cancel();
    if(probe.status!==401)throw new Error(`Local Pages account bindings failed readiness: HTTP ${probe.status}`);
    const login=await fetch(url+'/api/login',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password})});await login.body?.cancel();
    if(login.status!==200)throw new Error(`Local Pages fixture database failed readiness: HTTP ${login.status}`);
    const cookie=login.headers.get('set-cookie').split(';')[0];
    writeFileSync(join(fixtures,'.local/admin-session.txt'),cookie,{mode:0o600});
    return {url,runtime,env,bindings,command,stop};
  }catch(error){await stop();throw error;}
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  mkdirSync(join(toolsRoot,'output/ci'),{recursive:true});
  const root=resolve(process.argv.find(a=>a.startsWith('--root='))?.slice(7)||toolsRoot),port=Number(process.argv.find(a=>a.startsWith('--port='))?.slice(7)||8788);
  const server=await startServer(root,port);
  console.log(`CI Pages preview: ${server.url} (temporary local test data)`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.stop();process.exit();});
}
