import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {applyUpgrade,upgradeStatements} from '../upgrade.mjs';

test('local D1 migration batch succeeds, refuses rerun and rolls back an injected late failure',async()=>{
 const root=mkdtempSync(join(tmpdir(),'case-migration-d1-'));
 writeFileSync(join(root,'wrangler.jsonc'),JSON.stringify({name:'migration-fixture',compatibility_date:'2026-09-26',d1_databases:[{binding:'DB',database_name:'migration-fixture',database_id:'00000000-0000-0000-0000-000000000001'}]}));
 process.env.XDG_CONFIG_HOME=join(root,'config');process.env.WRANGLER_LOG_PATH=join(root,'logs');process.env.WRANGLER_SEND_METRICS='false';
 const {getPlatformProxy}=await import('wrangler');
 const proxy=await getPlatformProxy({configPath:join(root,'wrangler.jsonc'),persist:false,remoteBindings:false,envFiles:[]});
 try{
  const db=proxy.env.DB;
  for(const file of ['0001.sql','0002_account_permissions.sql'])await db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').replaceAll('\n',' '));
  await db.exec("INSERT INTO users(id,username,role,password_mac,created_at,can_demo,can_download) VALUES('o','admin','admin','hash',1,1,1),('u','user','user','hash',1,1,0)");
  const inventory=(await db.prepare('SELECT id,username,role,can_demo,can_download FROM users').all()).results;
  const statements=upgradeStatements(inventory,'o',{u:['digital-toll']});
  await assert.rejects(()=>db.batch([...statements.map(sql=>db.prepare(sql)),db.prepare('INSERT INTO access_settings(id,ready) VALUES(2,1)')]));
  assert.equal((await db.prepare('SELECT is_owner FROM users WHERE id=?').bind('o').first()).is_owner,0);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM case_grants').first()).n,0);
  assert.equal((await db.prepare('SELECT ready FROM access_settings').first()).ready,0);
  await applyUpgrade(db,inventory,'o',{u:['digital-toll']});
  assert.equal((await db.prepare('SELECT ready FROM access_settings').first()).ready,1);
  assert.equal((await db.prepare('SELECT case_id FROM case_grants').first()).case_id,'digital-toll');
  await assert.rejects(()=>applyUpgrade(db,inventory,'o',{u:[]}));
  assert.equal((await db.prepare('SELECT case_id FROM case_grants').first()).case_id,'digital-toll');
 }finally{await proxy.dispose();rmSync(root,{recursive:true,force:true});}
});
