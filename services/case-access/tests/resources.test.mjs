import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleApi} from '../api.mjs';
import {resources} from '../resources.mjs';
import {digest} from '../crypto.mjs';
test('resource proxy enforces grants on GET, HEAD and assets; revocation blocks further reads',async()=>{
 const db=new DatabaseSync(':memory:');for(const file of ['0001.sql','0002_account_permissions.sql'])db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
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
