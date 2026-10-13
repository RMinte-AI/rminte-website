// Local-only regression: both fixture IDs are generated here before any database access.
// Run: node tests/admin-password.mjs /absolute/path/to/wrangler/bin/wrangler.js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {passwordMac,randomPassword} from '../crypto.mjs';
const wrangler=process.argv[2];if(!wrangler)throw new Error('Provide the installed Wrangler CLI path');
const root=new URL('../../../',import.meta.url).pathname,base='http://127.0.0.1:8788';
const secret=(await readFile(new URL('../.dev.vars',import.meta.url),'utf8')).match(/^CASE_SECRET="?([^"\n]+)/m)[1];
const id=crypto.randomUUID(),normalId=crypto.randomUUID(),username='password-test-'+id,password=randomPassword(),next='Updated-'+randomPassword();
const normalName='password-test-'+normalId,normalPassword=randomPassword();
function sql(command){execFileSync(process.execPath,[wrangler,'d1','execute','CASE_DB','--local','--config','services/case-access/wrangler.jsonc','--command',command],{cwd:root,env:{...process.env,WRANGLER_LOG_PATH:'/tmp/cases-wrangler-logs'},stdio:'pipe'});}
async function call(path,data,cookie,origin=base){const r=await fetch(base+path,{method:data?'POST':'GET',headers:{Origin:origin,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const checks=[];function check(name,condition){assert.ok(condition,name);checks.push(name);}
let seeded=false;
try{
 sql(`INSERT INTO users(id,username,role,password_mac,can_demo,can_download,created_at) VALUES('${id}','${username}','admin','${await passwordMac(secret,username,password)}',0,0,${Math.floor(Date.now()/1000)}),('${normalId}','${normalName}','user','${await passwordMac(secret,normalName,normalPassword)}',0,0,${Math.floor(Date.now()/1000)});`);seeded=true;
 const first=await call('/api/login',{username,password}),second=await call('/api/login',{username,password});check('legacy initial administrator login',first.status===200&&second.status===200);
 const u=await call('/api/login',{username:normalName,password:normalPassword});
 check('normal user cannot change password',(await call('/api/admin/password',{current_password:normalPassword,new_password:next},u.cookie)).status===403);
 check('cross-origin change rejected',(await call('/api/admin/password',{current_password:password,new_password:next},first.cookie,'https://other.example')).status===403);
 check('wrong current password rejected',(await call('/api/admin/password',{current_password:'wrong',new_password:next},first.cookie)).status===400);
 check('short password rejected',(await call('/api/admin/password',{current_password:password,new_password:'short'},first.cookie)).status===400);
 check('password changed',(await call('/api/admin/password',{current_password:password,new_password:next},first.cookie)).status===200);
 check('current session revoked',!(await call('/api/session',null,first.cookie)).body.user);
 check('other session revoked',!(await call('/api/session',null,second.cookie)).body.user);
 check('old password fails',(await call('/api/login',{username,password})).status===401);
 check('new password succeeds',(await call('/api/login',{username,password:next})).status===200);
 if(process.env.PLAYWRIGHT_MODULE){
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1000}});
   await page.goto(base+'/admin/');await page.locator('#admin-login input[name=username]').fill(username);await page.locator('#admin-login input[name=password]').fill(next);await page.locator('#admin-login button').click();
   await page.locator('#change-password').click();await page.locator('#password-dialog').waitFor({state:'visible'});
   await page.screenshot({path:root+'output/playwright/admin-password-desktop.png'});
   await page.setViewportSize({width:320,height:900});
   check('password dialog fits 320px',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth&&document.querySelector('#password-dialog').getBoundingClientRect().right<=innerWidth));
   await page.screenshot({path:root+'output/playwright/admin-password-mobile.png'});
   await page.keyboard.press('Escape');await page.locator('#change-password').click();
   const form=page.locator('#password-form'),finalPassword='Final-'+randomPassword();
   await form.locator('[name=current_password]').fill(next);await form.locator('[name=new_password]').fill(finalPassword);await form.locator('[name=confirm_password]').fill(next);
   await form.locator('button').click();check('confirmation mismatch shown',await page.locator('#password-message').textContent()==='两次输入的新密码不一致');
   await form.locator('[name=confirm_password]').fill(finalPassword);await form.locator('button').click();await page.locator('#login-panel').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelector('#login-message').textContent.includes('密码已修改'));
   check('successful change returns to login',(await page.locator('#login-message').textContent()).includes('密码已修改'));
   await page.locator('#admin-login input[name=username]').fill(username);await page.locator('#admin-login input[name=password]').fill(finalPassword);await page.locator('#admin-login button').click();await page.locator('#admin-panel').waitFor({state:'visible'});
   check('browser login with updated password',true);
  }finally{await browser.close();}
 }
 console.log(JSON.stringify({passed:checks.length,checks}));
}finally{if(seeded)sql(`DELETE FROM users WHERE id IN ('${id}','${normalId}'); DELETE FROM rate_limits WHERE key='password-change:${id}';`);}
