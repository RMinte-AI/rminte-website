import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleApi} from '../api.mjs';
import {resources} from '../resources.mjs';
import {digest} from '../crypto.mjs';
import {dealerMaterials,MAX_DEALER_PDF_BYTES} from '../dealer-materials.mjs';
test('resource proxy enforces grants on GET, HEAD and assets; revocation blocks further reads',async()=>{
 const db=new DatabaseSync(':memory:');for(const file of ['0001.sql','0002_account_permissions.sql','0003_dealer_download_permission.sql'])db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 db.exec("UPDATE access_settings SET ready=1; INSERT INTO users(id,username,role,password_mac,created_at) VALUES('u','u','user','test',0); INSERT INTO case_grants VALUES('u','digital-toll');");
 const token='a'.repeat(48);db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await digest(token),'u',Math.floor(Date.now()/1000)+60);
 const statement=(sql,args=[])=>({bind(...values){return statement(sql,values);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};}});
 const CASE_DB={prepare:sql=>statement(sql)};
 let upstreamCalls=0,fileCalls=0;
 const env={CASE_DB,CASE_SECRET:'x'.repeat(43),CASE_DEMOS:{async fetch(request){upstreamCalls++;assert.equal(request.headers.get('X-RMinte-User'),'u');return new Response(request.method==='HEAD'?null:'isolated demo fixture');}},CASE_FILES:{async get(){fileCalls++;return {body:'isolated file fixture',httpMetadata:{contentType:'text/plain'}};}}};
 resources['digital-toll']={demoPath:'/fixture/',fileKey:'fixture.txt',fileName:'fixture.txt'};
 const request=(path,method='GET')=>handleApi(new Request('https://test.invalid/api/resources/'+path,{method,headers:{cookie:'__Host-rminte_session='+token}}),env);
 try{
  for(const path of ['digital-toll/demo','digital-toll/demo/asset.js','digital-toll/download']){
   const response=await request(path);assert.equal(response.status,200);assert.match(await response.text(),/isolated/);assert.equal(response.headers.get('cache-control'),'private, no-store');
   const head=await request(path,'HEAD');assert.equal(head.status,200);assert.equal(await head.text(),'');
  }
  const download=await request('digital-toll/download');assert.match(download.headers.get('content-disposition'),/attachment/);
  const before=[upstreamCalls,fileCalls];db.exec('DELETE FROM case_grants');
  for(const path of ['digital-toll/demo','digital-toll/demo/asset.js','digital-toll/download'])for(const method of ['GET','HEAD'])assert.equal((await request(path,method)).status,403);
  assert.deepEqual([upstreamCalls,fileCalls],before);
 }finally{delete resources['digital-toll'];db.close();}
});

const origin='https://test.invalid';
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const file of ['0001.sql','0002_account_permissions.sql','0003_dealer_download_permission.sql'])db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const ids={reader:crypto.randomUUID(),admin:crypto.randomUUID(),first:crypto.randomUUID()};
 db.exec("UPDATE access_settings SET ready=1");
 for(const [name,id] of Object.entries(ids))db.prepare('INSERT INTO users(id,username,role,password_mac,created_at,must_change_password) VALUES(?,?,?,?,0,?)').run(id,name,name==='reader'?'user':'admin','test',name==='first'?1:0);
 const statement=(sql,args=[])=>({bind(...values){return statement(sql,values);},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}});
 const CASE_DB={prepare:sql=>statement(sql),async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const objects=new Map(),calls=[];
 const env={CASE_SECRET:'test-only',CASE_DB,CASE_FILES:{
  async put(key,body,options){calls.push(['put',key]);objects.set(key,{bytes:new Uint8Array(body),size:body.byteLength,httpMetadata:options.httpMetadata});},
  async head(key){calls.push(['head',key]);return objects.get(key)||null;},
  async get(key){calls.push(['get',key]);const object=objects.get(key);return object?{...object,body:object.bytes}:null;}
 }};
 async function cookie(name){const token=(name==='reader'?'r':name==='admin'?'a':'f').repeat(48);db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(await digest(token),ids[name],Math.floor(Date.now()/1000)+3600);return '__Host-rminte_session='+token;}
 const request=(path,{method='GET',cookie,body,headers={}}={})=>handleApi(new Request(origin+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...headers},body}),env);
 return {db,env,objects,calls,cookie,request,ids};
}
const item=dealerMaterials[0],download='/api/dealer-materials/'+item.id+'/download',upload='/api/admin/dealer-materials/'+item.id;
const pdf=new TextEncoder().encode('%PDF-1.7\nlocal PDF fixture\n%%EOF');
test('dealer downloads require an explicit grant, apply revocation to an existing session, and keep case access independent',async()=>{
 const f=fixture();try{
  const reader=await f.cookie('reader'),admin=await f.cookie('admin'),first=await f.cookie('first');
  for(const method of ['GET','HEAD'])assert.equal((await f.request(download,{method})).status,401);
  assert.equal(f.calls.length,0);
  for(const cookie of [reader,first])assert.equal((await f.request(upload,{method:'PUT',cookie,body:pdf,headers:{'Content-Type':'application/pdf'}})).status,403);
  const initial=await f.request(download,{cookie:first});assert.equal(initial.status,403);assert.equal((await initial.json()).code,'password_change_required');
  assert.equal((await f.request(upload,{method:'PUT',cookie:admin,body:pdf,headers:{'Content-Type':'application/pdf'}})).status,200);
  assert.equal((await (await f.request('/api/admin/dealer-materials',{cookie:admin})).json()).files[0].size,pdf.length);
  for(const method of ['GET','HEAD']){const denied=await f.request(download,{cookie:reader,method});assert.equal(denied.status,403);assert.equal((await denied.json()).code,'dealer_download_forbidden');}
  f.db.prepare('INSERT INTO case_grants VALUES(?,?)').run(f.ids.reader,'digital-toll');
  assert.equal((await f.request(download,{cookie:reader})).status,403,'A case grant cannot enable dealer downloads');
  f.db.prepare('DELETE FROM case_grants WHERE user_id=?').run(f.ids.reader);
  f.db.prepare('UPDATE users SET can_download_dealer=1 WHERE id=?').run(f.ids.reader);
  const response=await f.request(download,{cookie:reader});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('content-type'),'application/pdf');assert.match(response.headers.get('content-disposition'),/attachment/);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),pdf);
  assert.equal((await f.request('/api/resources/digital-toll/download',{cookie:reader})).status,403,'Dealer permission cannot enable case downloads');
  const head=await f.request(download,{cookie:reader,method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),String(pdf.length));
  f.db.prepare('UPDATE users SET can_download_dealer=0 WHERE id=?').run(f.ids.reader);
  const before=f.calls.length;for(const method of ['GET','HEAD'])assert.equal((await f.request(download,{cookie:reader,method})).status,403);assert.equal(f.calls.length,before);
  f.db.prepare('UPDATE sessions SET expires_at=0 WHERE user_id=?').run(f.ids.reader);assert.equal((await f.request(download,{cookie:reader})).status,401);
  f.db.prepare('DELETE FROM sessions WHERE user_id=?').run(f.ids.reader);assert.equal((await f.request(download,{cookie:reader})).status,401);
  f.db.prepare('UPDATE users SET disabled_at=1 WHERE id=?').run(f.ids.admin);assert.equal((await f.request(upload,{method:'PUT',cookie:admin,body:pdf,headers:{'Content-Type':'application/pdf'}})).status,401);
 }finally{f.db.close();}
});
test('case and dealer grants share an atomic version, stale writers cannot change either, and a late failure rolls everything back',async()=>{
 const f=fixture();try{
  const admin=await f.cookie('admin'),reader=await f.cookie('reader'),path='/api/admin/users/'+f.ids.reader+'/cases';
  const put=(data,cookie=admin)=>f.request(path,{method:'PUT',cookie,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const get=async()=> (await f.request(path,{cookie:admin})).json();
  assert.deepEqual(await get(),{case_ids:[],dealer_download:false,version:0});
  assert.equal((await put({case_ids:[],dealer_download:true,version:0},reader)).status,403);
  assert.equal((await put({case_ids:[],version:0})).status,400);
  assert.equal((await put({case_ids:['digital-toll'],dealer_download:true,version:0})).status,200);
  assert.equal((await put({case_ids:[],dealer_download:false,version:0})).status,409);
  assert.deepEqual(await get(),{case_ids:['digital-toll'],dealer_download:true,version:1});
  assert.equal((await put({case_ids:[],dealer_download:true,version:1})).status,200);
  assert.deepEqual(await get(),{case_ids:[],dealer_download:true,version:2});
  assert.equal((await put({case_ids:['digital-toll'],dealer_download:false,version:2})).status,200);
  assert.deepEqual(await get(),{case_ids:['digital-toll'],dealer_download:false,version:3});
  assert.equal((await f.request(download,{cookie:reader})).status,403);
  const events=f.db.prepare('SELECT details FROM permission_events ORDER BY rowid').all();assert.equal(events.length,3);assert.equal(JSON.parse(events[0].details).dealer_download,true);
  f.db.exec("CREATE TRIGGER reject_dealer_grant BEFORE UPDATE OF can_download_dealer ON users WHEN NEW.can_download_dealer=1 BEGIN SELECT RAISE(ABORT,'injected fixture failure'); END");
  assert.equal((await put({case_ids:[],dealer_download:true,version:3})).status,500);
  assert.deepEqual(await get(),{case_ids:['digital-toll'],dealer_download:false,version:3});assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM permission_events').get().n,3);
 }finally{f.db.close();}
});
test('upload rejects cross-origin, invalid type, invalid PDF and excessive bodies without replacing a stored PDF',async()=>{
 const f=fixture();try{
  const admin=await f.cookie('admin');
  assert.equal((await f.request(upload,{method:'PUT',cookie:admin,headers:{'Content-Type':'application/pdf'},body:pdf})).status,200);
  for(const [headers,body,status] of [[{'Origin':'https://other.invalid','Content-Type':'application/pdf'},'%PDF-1.7',403],[{'Content-Type':'text/plain'},'%PDF-1.7',415],[{'Content-Type':'application/pdf'},'not a PDF',400],[{'Content-Type':'application/pdf'},new Uint8Array(MAX_DEALER_PDF_BYTES+1),413]])assert.equal((await f.request(upload,{method:'PUT',cookie:admin,headers,body})).status,status);
  assert.equal(f.objects.size,1);assert.deepEqual(f.objects.get(item.fileKey).bytes,pdf);
  assert.equal((await f.request('/api/admin/dealer-materials/unknown',{method:'PUT',cookie:admin,body:pdf,headers:{'Content-Type':'application/pdf'}})).status,404);
  assert.equal((await f.request(download+'/extra',{cookie:admin})).status,404);
  const next=new TextEncoder().encode('%PDF-1.7\nreplacement fixture');assert.equal((await f.request(upload,{method:'PUT',cookie:admin,headers:{'Content-Type':'application/pdf'},body:next})).status,200);assert.deepEqual(new Uint8Array(await (await f.request(download,{cookie:admin})).arrayBuffer()),next);
  delete f.env.CASE_FILES;assert.equal((await f.request(download,{cookie:admin})).status,503);
 }finally{f.db.close();}
});
