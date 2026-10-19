import {expect} from '@playwright/test';

export default async function({page,frame,caseName,reopen=false,language,width}) {
  expect(caseName).toMatch(/汽车研发与工业建模|Automotive R&D and Industrial Modelling/);
  await expect(frame.locator('#viewer-error')).toBeHidden();
  await expect(frame.locator('#status')).toHaveText('等待开始');
  await expect(frame.locator('#steps')).toBeDisabled();
  await expect(frame.locator('textarea')).toHaveCount(0);
  await frame.locator('#start').click();
  await expect(frame.locator('#question')).toContainText('四方通槽采用哪个尺寸');
  if (reopen) return;
  await frame.locator('#reset').click();await expect(frame.locator('#status')).toHaveText('等待开始');
  await frame.locator('#start').click();await expect(frame.locator('#question')).toBeVisible();

  // The four locale/viewport runs exercise all four supported choice pairs.
  const slot = width === 390 ? 18 : 16, chamfer = language === 'zh' ? 1 : 2;
  await frame.locator(`[data-answer="${slot}"]`).click();
  await expect(frame.locator('#question')).toContainText('上下端部采用多大的倒角');
  await frame.locator(`[data-answer="${chamfer}"]`).click();
  await expect(frame.locator('#status')).toHaveText('半成品已就绪');
  await expect(frame.locator('#progress-count')).toHaveText('3 / 3 步');
  await expect(frame.locator('#conversation')).toContainText(`方槽 ${slot} × ${slot} mm，两端倒角 ${chamfer} × 45°`);
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
  await expect(page.locator('#case-demo-modal')).toBeVisible();
  await expect(frame.locator('#brand-home')).toHaveAttribute('href','./?embed=1');
  await frame.locator('#brand-home').click();await expect(frame.locator('html')).toHaveClass(/embedded/);
  await expect(frame.locator('#status')).toHaveText('等待开始');
  await canvas.focus();
}
