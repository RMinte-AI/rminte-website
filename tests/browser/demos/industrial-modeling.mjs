import {expect} from '@playwright/test';

export default async function({page,frame,caseName,reopen=false,language,width,testInfo}) {
  expect(caseName).toMatch(/汽车研发与工业建模|Automotive R&D and Industrial Modelling/);
  await expect(frame.locator('#viewer-error')).toBeHidden();
  await expect(frame.locator('#status')).toHaveText('等待开始');
  await expect(frame.locator('#steps')).toBeDisabled();
  await expect(frame.locator('textarea')).toHaveCount(0);
  await expect(frame.locator('#start')).toBeEnabled();
  await frame.locator('#start').click();
  await expect(frame.locator('#question')).toContainText('四方通槽采用哪个尺寸');
  if (reopen) return;
  await frame.locator('#reset').click();await expect(frame.locator('#status')).toHaveText('等待开始');
  await frame.locator('#start').click();await frame.locator('#reset').click();
  await frame.locator('#start').click();await expect(frame.locator('#question')).toBeVisible();
  await testInfo.attach('industrial-modeling question',{body:await page.locator('#case-demo-modal').screenshot(),contentType:'image/png'});

  // The four locale/viewport runs exercise all four supported choice pairs.
  const slot = width === 390 ? 18 : 16, chamfer = language === 'zh' ? 1 : 2;
  await frame.locator(`[data-answer="${slot}"]`).click();
  await expect(frame.locator('#question')).toContainText('上下端部采用多大的倒角');
  await frame.locator(`[data-answer="${chamfer}"]`).click();
  await expect(frame.locator('#status')).toHaveText('半成品已就绪');
  await expect(frame.locator('#progress-count')).toHaveText('3 / 3 步');
  await expect(frame.locator('#conversation')).toContainText(`方槽 ${slot} × ${slot} mm，两端倒角 ${chamfer} × 45°`);
  const geometry = await page.frames().find(candidate => candidate.url().includes('/api/resources/industrial-modeling/demo/')).evaluate(async ({slot,chamfer}) => {
    const {createPartGeometry} = await import('./part-geometry.mjs');
    const part = createPartGeometry({stage:3,slot,height:30,chamfer});
    const positions = part.attributes.position;
    let holeBoundary = false;
    for (let index=0;index<positions.count;index++) {
      if (Math.abs(positions.getY(index)-15)<1e-5 && Math.abs(Math.abs(positions.getX(index))-slot/2)<1e-5 && Math.abs(Math.abs(positions.getZ(index))-slot/2)<1e-5) holeBoundary = true;
    }
    const result = {height:part.boundingBox.max.y-part.boundingBox.min.y,holeBoundary};
    part.dispose();return result;
  },{slot,chamfer});
  expect(geometry).toEqual({height:30,holeBoundary:true});

  await frame.locator('#model-tab').focus();await frame.locator('#model-tab').press('Enter');
  await expect(frame.locator('#drawing-pane')).toBeHidden();await expect(frame.locator('#model-tab')).toHaveAttribute('aria-pressed','true');
  await frame.locator('#model-tab').press('Tab');await expect(frame.locator('#compare-tab')).toBeFocused();
  await frame.locator('#compare-tab').press('Space');await expect(frame.locator('#drawing-pane')).toBeVisible();
  await expect(frame.locator('#compare-tab')).toHaveAttribute('aria-pressed','true');
  await frame.locator('[data-view="front"]').click();
  await frame.locator('#fit').click();
  await expect(frame.locator('[data-view="front"]')).toHaveAttribute('aria-pressed','true');
  const canvas=frame.locator('#model-canvas');await canvas.focus();await canvas.press('ArrowRight');await canvas.press('+');
  await expect(frame.locator('#viewer-status')).toContainText('已放大');
  await frame.locator('#section').click();await expect(frame.locator('#section-caption')).toBeVisible();await frame.locator('#section').click();
  await frame.locator('#steps').click();await expect(frame.locator('[data-stage]')).toHaveCount(3);
  await frame.locator('[data-stage="1"]').click();await expect(frame.locator('#preview-label')).toHaveText('六角主体');
  await frame.locator('#steps').click();await frame.locator('[data-stage="3"]').click();await expect(frame.locator('#preview-label')).toHaveText('四方通槽');
  await frame.locator('#enlarge').click();await expect(frame.locator('#dialog-body img')).toBeVisible();await frame.locator('#dialog').press('Escape');
  await canvas.focus();
}
