import {expect} from '@playwright/test';

export default async function({page,frame,caseName,reopen=false,testInfo,language,width}) {
  expect(caseName).toMatch(/AI 数字收费员|AI Digital Toll Operator/);
  await expect(page.locator('#case-demo-modal')).toHaveCSS('background-color','rgb(20, 23, 27)');
  await expect(page.locator('#case-demo-modal')).toHaveCSS('box-shadow','none');
  await expect(frame.locator('body')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(frame.locator('html')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(frame.locator('#welcome')).toBeVisible();
  await expect(frame.locator('.demo-label')).toHaveText('交互演示 · 全部为模拟数据');
  await expect(frame.locator('#question')).toHaveAttribute('readonly','');
  await expect(frame.locator('#send')).toBeDisabled();
  await frame.locator('#scenario').selectOption('daily');
  await expect(frame.locator('#question')).toHaveValue('查询 2026 年 9 月 18 日的出口流水');
  await frame.locator('#send').click();
  await expect(frame.locator('.message.assistant')).toContainText('4,820 辆');
  await expect(frame.locator('.message.assistant')).toContainText('236,480.00 元');
  if(reopen)return;
  const user=frame.locator('.message.user'),assistant=frame.locator('.message.assistant');
  const userAvatar=await user.locator('.avatar').boundingBox(),userBody=await user.locator('.message-content').boundingBox();
  const assistantAvatar=await assistant.locator('.avatar').boundingBox(),assistantBody=await assistant.locator('.message-content').boundingBox();
  expect(userAvatar.x).toBeGreaterThan(userBody.x);expect(assistantAvatar.x).toBeLessThan(assistantBody.x);
  const screenshot=async name=>testInfo.attach(`digital-toll ${name}`,{body:await page.locator('#case-demo-modal').screenshot(),contentType:'image/png'});
  await screenshot('daily answer');
  await frame.locator('#scenario').selectOption('payments');await frame.locator('#question').press('Enter');
  await expect(frame.locator('.message.assistant').last()).toContainText('236,480.00');
  await expect(frame.locator('.message.assistant').last().locator('tbody tr')).toHaveCount(5);
  await frame.locator('#scenario').selectOption('exception');await frame.locator('#send').click();
  await expect(frame.locator('.message.assistant').last()).toContainText('2 项待核对');
  await frame.locator('#scenario').selectOption('policy');await frame.locator('#send').click();
  await expect(frame.locator('.message.assistant').last()).toContainText('DEMO-KB-001');
  async function nav(selector) {
    if(!await frame.locator(selector).isVisible())await frame.locator('#toggle-sidebar').click();
    await frame.locator(selector).click();
  }
  await nav('#open-plaza');
  await expect(frame.locator('#chat-view')).toBeHidden();
  await expect(frame.locator('.catalog-group')).toHaveCount(3);
  await expect(frame.locator('.function-card')).toHaveCount(11);
  await screenshot('plaza');
  const checks={statistics:'236,480.00',automation:'数据缺失',squad:'4,820',report:'236,480.00',knowledge:'绿通查验工作记录',exemption:'DEMO-A001',payment:'DEMO-P018',inspection:'心跳异常',archive:'DEMO-20260918-001',video:'不作逃费或违法判断',ocr:'待人工确认'};
  for(const [id,expected] of Object.entries(checks)) {
    await nav('#open-plaza');await frame.locator(`#catalog [data-feature="${id}"]`).click();
    await expect(frame.locator('#plaza-view')).toBeHidden();
    await expect(frame.locator('#chat-view')).toBeHidden();
    await frame.locator('#feature-form [type=submit]').focus();
    await frame.locator('#feature-form [type=submit]').press('Enter');
    await expect(frame.locator('#feature-result')).toContainText(expected);
    await expect(frame.locator('#feature-result')).toBeFocused();
    await expect(frame.locator('#feature-result')).toHaveCSS('outline-style','solid');
    await expect(frame.locator('#feature-result')).toHaveCSS('outline-width','2px');
    await expect(frame.locator('#feature-result')).toHaveCSS('outline-color','rgb(52, 114, 84)');
    if(language==='zh'&&width===1440&&id!=='statistics')await screenshot(`module ${id}`);
    if(id==='statistics') {
      await screenshot('statistics');
      await frame.locator('[name=day]').selectOption('2026-09-17');await frame.locator('#feature-form [type=submit]').click();
      await expect(frame.locator('#feature-result')).toContainText('229,860.00');
      await expect(frame.locator('#feature-result')).toContainText('2026-09-17');
    }
    if(id==='squad') {
      await frame.locator('[name=shift]').selectOption('early');await frame.locator('#feature-form [type=submit]').click();
      await expect(frame.locator('#feature-result')).toContainText('2,130');
      await expect(frame.locator('#feature-result tbody tr')).toHaveCount(1);
    }
    if(id==='knowledge') {
      await frame.locator('#show-source').click();await expect(frame.locator('#source-excerpt')).toContainText('DEMO-KB-001');
      await frame.locator('[name=article]').selectOption('handover');await frame.locator('#feature-form [type=submit]').click();
      await frame.locator('#show-source').click();await expect(frame.locator('#source-excerpt')).toContainText('DEMO-KB-002');
    }
    if(id==='exemption') {
      await frame.locator('[name=plate]').fill('DEMO-A002');await frame.locator('#feature-form [type=submit]').click();
      await expect(frame.locator('#feature-result tbody tr')).toHaveCount(1);
      await expect(frame.locator('#feature-result')).toContainText('待补查验照片');
      await frame.locator('[name=plate]').fill('NO-MATCH');await frame.locator('#feature-form [type=submit]').click();
      await expect(frame.locator('#feature-result')).toContainText('没有匹配的示例车辆记录');
    }
    if(id==='payment') {
      await expect(frame.locator('#feature-result tbody tr')).toHaveCount(2);
      await frame.locator('[name=scope]').selectOption('all');await frame.locator('#feature-form [type=submit]').click();
      await expect(frame.locator('#feature-result tbody tr')).toHaveCount(3);
    }
  }
  for(const id of ['squad','statistics','exemption']) {
    await nav(`#frequent [data-feature="${id}"]`);
    await expect(frame.locator('#feature-form')).toBeVisible();
  }
  await nav('#new-chat');await expect(frame.locator('#welcome')).toBeVisible();
  await nav('#recent button');await expect(frame.locator('.message.assistant')).toHaveCount(4);
  await nav('#clear-history');await frame.locator('#cancel-clear').click();
  await expect(frame.locator('.message.assistant')).toHaveCount(4);
  await nav('#clear-history');await frame.locator('#confirm-clear-button').click();
  await expect(frame.locator('#welcome')).toBeVisible();await expect(frame.locator('#messages')).toBeEmpty();
  await nav('#open-plaza');
  expect(await frame.locator('body').innerText()).not.toMatch(/\u5c71\u4e1c/);
}
