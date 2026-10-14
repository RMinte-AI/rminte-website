import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {layout,screenshotRegion} from './helpers.mjs';

test('a hidden ancestor cannot conceal clipped text or gallery photography',async({page})=>{
  await page.setContent('<main><div style="width:90px;height:22px;overflow:hidden"><h1 style="width:320px;margin:0">Clipped product heading</h1></div></main>');
  await expect(layout(page)).rejects.toThrow(/text clipped/);
  await page.setContent('<main><figure class="visual-stage" style="width:100px;overflow:hidden;margin:0"><img class="product-image" width="300" height="150" alt="test fixture"></figure></main>');
  await expect(layout(page)).rejects.toThrow(/gallery image clipped/);
});

test('intentional scrollable content remains accessible and is not classified as clipping',async({page})=>{
  await page.setContent('<main><div style="width:100px;overflow:auto"><h1 style="width:320px;margin:0">Scrollable product heading</h1></div></main>');
  await expect(layout(page)).resolves.toBeUndefined();
});

test('whole-page evidence includes fixed navigation and the footer outside main',async({page},testInfo)=>{
  await page.setContent('<body style="margin:0"><header style="position:fixed;top:0;height:100px">Fixed navigation</header><main style="height:1800px"><h1>Long page</h1></main><footer style="height:500px">Footer outside main</footer></body>');
  await page.evaluate(()=>scrollTo(0,1200));
  const file=testInfo.outputPath('whole-page.png');await screenshotRegion(page,'body',file);
  const bytes=readFileSync(file),height=bytes.readUInt32BE(20);
  expect(height).toBe(await page.evaluate(()=>document.documentElement.scrollHeight));
  expect(height).toBeGreaterThan(await page.locator('main').evaluate(el=>el.offsetHeight));
  expect(await page.evaluate(()=>scrollY)).toBe(0);
});
