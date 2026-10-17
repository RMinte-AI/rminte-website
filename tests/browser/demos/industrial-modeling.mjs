import {expect} from '@playwright/test';

export default async function({page,frame,caseName,reopen=false}) {
  expect(caseName).toMatch(/汽车研发与工业建模|Automotive R&D and Industrial Modelling/);
  await expect(frame.locator('#start')).toBeVisible();await expect(frame.locator('#viewer-error')).toBeHidden();
  await expect(frame.locator('#status')).toHaveText('等待开始');await expect(frame.locator('#versions')).toContainText('示例半成品');
  if(reopen){await frame.locator('#welcome-start').click();await expect(frame.locator('#progress-title')).toBeFocused();await expect(frame.locator('#question')).toContainText('四方通槽的边长');await expect(frame.locator('[data-answer="16"]')).toBeFocused();return;}
  await frame.locator('#start').click();await expect(frame.locator('#progress-title')).toBeFocused();await expect(frame.locator('#question')).toContainText('四方通槽的边长');await expect(frame.locator('[data-answer="16"]')).toBeFocused();await frame.locator('#reset').click();
  await frame.locator('#prompt').fill('方槽改为18毫米');await frame.locator('#send').click();
  await expect(frame.locator('#question')).toContainText('上下端部的外棱');
  await frame.locator('#prompt').fill('方槽改为17毫米');await frame.locator('#send').click();
  await expect(frame.locator('#conversation')).toContainText('已记录方槽边长 17 mm');await expect(frame.locator('#status')).toHaveText('需要你确认');
  await frame.locator('#prompt').fill('倒角 －1 毫米');await frame.locator('#send').click();
  await expect(frame.locator('#conversation')).toContainText('倒角 0.3～2.5 mm');await expect(frame.locator('#status')).toHaveText('需要你确认');
  await frame.locator('[data-answer="1"]').click();await expect(frame.locator('#progress-title')).toBeFocused();
  await expect(frame.locator('#status')).toHaveText('半成品已生成');await expect(frame.locator('#progress-count')).toHaveText('3 / 4 步');await expect(frame.locator('#versions')).toContainText('版本 04');
  await frame.locator('#checks').click();await expect(frame.locator('#dialog-body')).toContainText('17 × 17 mm');await frame.locator('#dialog-close').click();
  await frame.locator('#prompt').fill('方槽改为16毫米');await frame.locator('#send').click();
  await expect(frame.locator('#versions')).toContainText('版本 05');await expect(frame.locator('#status')).toHaveText('半成品已生成');
  await frame.locator('#checks').click();await expect(frame.locator('#dialog')).toHaveAttribute('aria-labelledby','dialog-title');await expect(frame.locator('#dialog-title')).toHaveText('当前预览参数');await expect(frame.locator('#dialog-body')).toContainText('16 × 16 mm');await frame.locator('#dialog-close').click();
  await frame.locator('#prompt').fill('方槽从 16 改成 18 毫米');await frame.locator('#send').click();await expect(frame.locator('#versions')).toContainText('版本 06');
  await frame.locator('#checks').click();await expect(frame.locator('#dialog-body')).toContainText('18 × 18 mm');await frame.locator('#dialog-close').click();
  const canvas=frame.locator('#model-canvas');await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:8});await page.mouse.up();
  await expect(frame.locator('#viewer-status')).toContainText('已通过鼠标或触控调整模型视角');
  await canvas.focus();await canvas.press('ArrowRight');
  await expect(frame.locator('#viewer-status')).toContainText('已向右旋转');
  await canvas.press('+');await expect(frame.locator('#viewer-status')).toContainText('已放大');
  await canvas.press('Home');await expect(frame.locator('#viewer-status')).toContainText('已切换到等轴测视图');
  await canvas.press('Tab');await expect(frame.locator('[data-view="iso"]')).toBeFocused();
  await frame.locator('#versions').click();await frame.locator('[data-version="1"]').click();await expect(frame.locator('#versions')).toContainText('版本 01');
  await frame.locator('#about').click();await frame.locator('#dialog').press('Escape');await expect(frame.locator('#dialog')).not.toBeVisible();
  await expect(frame.locator('#brand-home')).toHaveAttribute('href','./?embed=1');await frame.locator('#brand-home').click();await expect(frame.locator('body')).toHaveClass(/embedded/);await expect(frame.locator('#status')).toHaveText('等待开始');
}
