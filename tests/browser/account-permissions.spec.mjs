import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {run,afterURL,layout,setup} from './helpers.mjs';

// This spec uses only the ephemeral Pages/D1 fixture provisioned by the existing CI runner.
if(run.scope.pages.some(p=>p.id==='admin'))for(const width of [1440,768,390,320]){
 test.describe(`account permissions ${width}px`,()=>{
  test.use({viewport:{width,height:900}});
  test('owner delegation, forced password change, cross-admin user access and case grants',async({page,browser},testInfo)=>{
   const audit=await setup(page,'zh');
   const password=readFileSync(join(process.env.RMINTE_AFTER_FIXTURE,'services/case-access/.local/admin-login.txt'),'utf8').match(/密码：(.*)/)[1];
   await page.goto(afterURL+'/admin/');await page.getByLabel('用户名',{exact:true}).fill('admin');await page.getByLabel('密码',{exact:true}).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();
   await expect(page.locator('#tab-admins')).toBeVisible();await page.locator('#create-user button').click();await expect(page.locator('#new-account')).toBeVisible();
   const userName=await page.locator('#new-account dd').nth(0).textContent(),userPassword=await page.locator('#new-account dd').nth(1).textContent();
   const userRow=page.locator('#users tr').filter({hasText:userName});await userRow.locator('[data-cases]').click();await expect(page.locator('#selected')).toHaveText('已选 0 / 12 个案例');
   await page.getByRole('searchbox',{name:'搜索案例'}).fill('汽车');await expect(page.locator('#case-list input')).toHaveCount(2);await page.getByRole('searchbox').fill('');
   await page.getByRole('checkbox',{name:'AI 数字收费员',exact:true}).check();
   await page.route('**/api/admin/users/*/cases',route=>route.request().method()==='PUT'?route.fulfill({status:500,json:{error:'本地测试：保存失败'}}):route.continue(),{times:1});
   await page.locator('#save').click();await expect(page.locator('#changes')).toContainText('保存失败');await expect(page.getByRole('checkbox',{name:'AI 数字收费员',exact:true})).toBeChecked();await page.locator('#save').click();await expect(userRow).toContainText('1 / 12 个案例');
   await userRow.locator('[data-cases]').click();await page.locator('#clear-all').click();
   await page.route('**/api/admin/users/*/cases',route=>route.request().method()==='PUT'?route.fulfill({status:409,json:{error:'案例权限已更新，请重新载入后再保存'}}):route.continue(),{times:1});
   await page.locator('#save').click();await expect(page.locator('#changes')).toContainText('重新载入');await page.getByRole('button',{name:'重新载入',exact:true}).click();await expect(page.locator('#selected')).toHaveText('已选 1 / 12 个案例');await page.keyboard.press('Escape');await expect(userRow).toContainText('1 / 12 个案例');
   await page.locator('#tab-admins').click();await page.locator('#new-admin').click();await page.getByLabel('账号备注（选填）').fill('本地验收 '+width);await page.getByRole('button',{name:'生成管理员账号',exact:true}).click();await expect(page.locator('#admin-credentials')).toBeVisible();
   const credentialText=await page.locator('#admin-credentials .credential-values').innerText();
   const adminName=credentialText.match(/用户名\s*(\S+)/)[1],initial=credentialText.match(/初始密码\s*(\S+)/)[1];
   await page.locator('#dismiss-credentials').click();await layout(page);
   await testInfo.attach('Owner administrator management',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
   const delegatedContext=await browser.newContext({viewport:{width,height:900}}),delegate=await delegatedContext.newPage();
   await setup(delegate,'zh');await delegate.goto(afterURL+'/admin/');await delegate.getByLabel('用户名',{exact:true}).fill(adminName);await delegate.getByLabel('密码',{exact:true}).fill(initial);await delegate.getByRole('button',{name:'登录',exact:true}).click();await expect(delegate.locator('#password-required-panel')).toBeVisible();await expect(delegate.locator('#admin-panel')).not.toBeVisible();
   await delegate.locator('#required-password').click();const next='Local-only-'+crypto.randomUUID();await delegate.getByLabel('当前密码',{exact:true}).fill(initial);await delegate.getByLabel('新密码',{exact:true}).fill(next);await delegate.getByLabel('确认新密码',{exact:true}).fill(next);await delegate.getByRole('button',{name:'保存新密码',exact:true}).click();await expect(delegate.locator('#admin-login')).toBeVisible();
   await delegate.getByLabel('用户名',{exact:true}).fill(adminName);await delegate.getByLabel('密码',{exact:true}).fill(next);await delegate.getByRole('button',{name:'登录',exact:true}).click();await expect(delegate.locator('#users-panel')).toBeVisible();await expect(delegate.locator('#tab-admins')).not.toBeVisible();
   const delegatedRow=delegate.locator('#users tr').filter({hasText:userName});await delegatedRow.locator('[data-cases]').click();await delegate.getByRole('checkbox',{name:'AI 信息资产审计',exact:true}).check();await delegate.locator('#save').click();await expect(delegatedRow).toContainText('2 / 12 个案例');
   const adminRow=page.locator('#admin-accounts tr').filter({hasText:adminName});await adminRow.getByRole('button',{name:'停用账号'}).click();await page.locator('#confirm-status').click();await expect(adminRow).toContainText('已停用');await delegate.reload();await expect(delegate.locator('#admin-login')).toBeVisible();
   const visitorContext=await browser.newContext({viewport:{width,height:900}}),visitor=await visitorContext.newPage();await setup(visitor,'zh');await visitor.goto(afterURL+'/cases/');await visitor.locator('[data-action="demo"]').first().click();await visitor.getByLabel('用户名',{exact:true}).fill(userName);await visitor.getByLabel('密码',{exact:true}).fill(userPassword);await visitor.getByRole('button',{name:'登录',exact:true}).click();await expect(visitor.locator('#case-demo-modal')).toHaveAttribute('data-state','ready');await visitor.keyboard.press('Escape');await expect(visitor.locator('.cs-status').first()).toContainText('已授权');
   await visitorContext.close();await delegatedContext.close();expect(audit.problems).toEqual([]);
  });
 });
}

if(run.scope.pages.some(p=>p.id==='admin'))test.describe('account editor lifecycle regressions',()=>{
 async function ownerLogin(page){
  const password=readFileSync(join(process.env.RMINTE_AFTER_FIXTURE,'services/case-access/.local/admin-login.txt'),'utf8').match(/密码：(.*)/)[1];
  await page.goto(afterURL+'/admin/');await page.getByLabel('用户名',{exact:true}).fill('admin');await page.getByLabel('密码',{exact:true}).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.locator('#users-panel')).toBeVisible();return password;
 }
 async function write(page,path,data,method='post'){
  const response=await page.request[method](afterURL+path,{headers:{Origin:afterURL},data});expect(response.ok()).toBe(true);return response.json();
 }
 test('a delayed conflict reload cannot replace another account draft or saved grants',async({page})=>{
  await ownerLogin(page);
  const a=await write(page,'/api/admin/users',{}),b=await write(page,'/api/admin/users',{});
  await write(page,`/api/admin/users/${a.id}/cases`,{case_ids:['digital-toll'],version:0},'put');
  await write(page,`/api/admin/users/${b.id}/cases`,{case_ids:[],version:0},'put');
  await write(page,`/api/admin/users/${b.id}/cases`,{case_ids:['functional-safety'],version:1},'put');
  await page.locator('#refresh-users').click();
  await page.locator(`tr[data-id="${a.id}"] [data-cases]`).click();await page.locator('#clear-all').click();
  await write(page,`/api/admin/users/${a.id}/cases`,{case_ids:['asset-audit'],version:1},'put');
  await page.locator('#save').click();await expect(page.getByRole('button',{name:'重新载入',exact:true})).toBeVisible();
  let release,started;const gate=new Promise(resolve=>{release=resolve;}),waiting=new Promise(resolve=>{started=resolve;});
  await page.route(`**/api/admin/users/${a.id}/cases`,async route=>{const response=await route.fetch();started();await gate;await route.fulfill({response});},{times:1});
  try{
   await page.getByRole('button',{name:'重新载入',exact:true}).click();await waiting;
   await page.locator('#cancel').click();await page.locator(`tr[data-id="${b.id}"] [data-cases]`).click();
   await expect(page.locator('#editor-title')).toHaveText(b.username);await expect(page.locator('[data-case-id="functional-safety"]')).toBeChecked();
   const finished=page.waitForEvent('requestfinished',{predicate:r=>r.url().endsWith(`/api/admin/users/${a.id}/cases`)});
   release();await finished;await page.evaluate(()=>new Promise(requestAnimationFrame));
   await expect(page.locator('#editor-title')).toHaveText(b.username);
   await expect(page.locator('[data-case-id="functional-safety"]')).toBeChecked();await expect(page.locator('[data-case-id="asset-audit"]')).not.toBeChecked();
   await page.locator('[data-case-id="digital-toll"]').check();await page.locator('#save').click();await expect(page.locator('#editor')).not.toBeVisible();
   const saved=await (await page.request.get(afterURL+`/api/admin/users/${b.id}/cases`)).json();expect(saved.case_ids.sort()).toEqual(['digital-toll','functional-safety']);expect(saved.version).toBe(3);
  }finally{release();}
 });
 test('logging back in restores a loaded default tab, then loads administrator data on selection',async({page})=>{
  const password=await ownerLogin(page),admin=await write(page,'/api/admin/admins',{label:'Relogin fixture'});
  await page.locator('#tab-admins').click();await expect(page.locator('#admin-accounts')).toContainText(admin.username);
  await page.locator('#logout').click();await expect(page.locator('#admin-login')).toBeVisible();
  await page.getByLabel('用户名',{exact:true}).fill('admin');await page.getByLabel('密码',{exact:true}).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();
  await expect(page.locator('#tab-users')).toHaveAttribute('aria-selected','true');await expect(page.locator('#users-panel')).toBeVisible();await expect(page.locator('#users tr').first()).toBeVisible();await expect(page.locator('#admins-panel')).not.toBeVisible();
  await page.locator('#tab-admins').click();await expect(page.locator('#admin-accounts')).toContainText(admin.username);
 });
});
