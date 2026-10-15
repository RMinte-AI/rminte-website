// Pages + a fresh local D1 fixture. No production credentials or remote database operations.
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,writeFileSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
import {caseConfiguration} from './config.mjs';

const toolsRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
export const wrangler=join(toolsRoot,'node_modules/wrangler/bin/wrangler.js');

export async function startServer(root,port,logFile) {
  await new Promise((done,reject)=>{
    const probe=createServer();probe.once('error',()=>reject(new Error(`CI port ${port} is occupied; stop the existing local preview first.`)));
    probe.listen(port,'127.0.0.1',()=>probe.close(done));
  });
  const runtime=mkdtempSync(join(toolsRoot,'output/ci/runtime-'));
  const fixtures=join(runtime,'services/case-access');
  mkdirSync(join(fixtures,'.local'),{recursive:true,mode:0o700});
  mkdirSync(join(fixtures,'tests'),{recursive:true});
  const secret=randomBytes(32).toString('base64'),password='Ci-'+randomBytes(16).toString('hex');
  const {hashAdminPassword}=await import(pathToFileURL(join(root,'services/case-access/crypto.mjs')));
  const source=caseConfiguration(root);
  const config={name:'rminte-ci-local',pages_build_output_dir:source.assets,compatibility_date:source.compatibility_date,compatibility_flags:source.compatibility_flags||[],d1_databases:[{binding:'CASE_DB',database_name:'rminte-ci-local',database_id:randomUUID(),migrations_dir:source.migrations}]};
  for(const destination of [join(runtime,'wrangler.jsonc'),join(fixtures,'wrangler.jsonc')])writeFileSync(destination,JSON.stringify(config));
  for(const destination of [join(runtime,'.dev.vars'),join(fixtures,'.dev.vars')])writeFileSync(destination,`CASE_SECRET="${secret}"\n`,{mode:0o600});
  writeFileSync(join(fixtures,'.local/admin-login.txt'),`本地 CI 临时数据（未部署）\n用户名：admin\n密码：${password}\n`,{mode:0o600});
  const mac=await hashAdminPassword(secret,'admin',password);
  const sql=join(runtime,'seed.sql');
  writeFileSync(sql,`INSERT INTO users(id,username,role,password_mac,password_cipher,can_demo,can_download,created_at) VALUES('${randomUUID()}','admin','admin','${mac}',NULL,1,1,${Math.floor(Date.now()/1000)});`,{mode:0o600});
  copyFileSync(join(root,'services/case-access/crypto.mjs'),join(fixtures,'crypto.mjs'));
  for(const name of ['integration.mjs','admin-password.mjs'])if(existsSync(join(root,'services/case-access/tests',name)))copyFileSync(join(root,'services/case-access/tests',name),join(fixtures,'tests',name));
  const env={...process.env,XDG_CONFIG_HOME:join(runtime,'config'),WRANGLER_LOG_PATH:join(runtime,'logs'),WRANGLER_SEND_METRICS:'false',CHOKIDAR_USEPOLLING:'true'};
  function command(args) {execFileSync(process.execPath,[wrangler,...args],{cwd:runtime,env,encoding:'utf8',stdio:'pipe',timeout:90_000});}
  command(['d1','migrations','apply','CASE_DB','--local','--config',join(fixtures,'wrangler.jsonc')]);
  command(['d1','execute','CASE_DB','--local','--config',join(fixtures,'wrangler.jsonc'),'--file',sql]);
  const child=spawn(process.execPath,[wrangler,'pages','dev','--port',String(port),'--ip','127.0.0.1','--persist-to',join(fixtures,'.wrangler/state'),'--d1',`CASE_DB=${config.d1_databases[0].database_id}`,'--binding',`CASE_SECRET=${secret}`,'--log-level','error','--show-interactive-dev-session=false'],{cwd:runtime,env,stdio:['ignore','pipe','pipe']});
  let output='';
  child.stdout.on('data',value=>{output+=value;});child.stderr.on('data',value=>{output+=value;});
  const stop=async()=>{
    child.kill('SIGTERM');
    await Promise.race([new Promise(done=>child.once('exit',done)),delay(5000)]);
    if(child.exitCode===null)child.kill('SIGKILL');
    if(logFile)writeFileSync(logFile,output.replaceAll(secret,'[temporary fixture secret]'));
    rmSync(runtime,{recursive:true,force:true});
  };
  const url=`http://127.0.0.1:${port}`;
  for(let attempt=0;attempt<120;attempt++) {
    if(child.exitCode!==null){await stop();throw new Error(`Pages test server exited: ${output.replaceAll(secret,'[temporary fixture secret]')}`);}
    let ready=false;
    try{ready=(await fetch(url,{signal:AbortSignal.timeout(800)})).ok;}catch{/* Local socket not ready yet. */}
    if(ready) {
      const api=await fetch(url+'/api/admin/users');
      if(api.status!==401){await stop();throw new Error(`Local Pages account bindings failed readiness: HTTP ${api.status}`);}
      const login=await fetch(url+'/api/login',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password})});
      if(login.status!==200){await stop();throw new Error(`Local Pages fixture database failed readiness: HTTP ${login.status}`);}
      const cookie=login.headers.get('set-cookie').split(';')[0];
      await fetch(url+'/api/logout',{method:'POST',headers:{Origin:url,Cookie:cookie}});
      return {url,runtime,env,child,command,stop};
    }
    await delay(250);
  }
  await stop();throw new Error(`Pages test server did not start: ${output.replaceAll(secret,'[temporary fixture secret]')}`);
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  mkdirSync(join(toolsRoot,'output/ci'),{recursive:true});
  const root=resolve(process.argv.find(a=>a.startsWith('--root='))?.slice(7)||toolsRoot);
  const port=Number(process.argv.find(a=>a.startsWith('--port='))?.slice(7)||8788);
  const server=await startServer(root,port);
  console.log(`CI Pages preview: ${server.url} (temporary local test data)`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.stop();process.exit();});
}
