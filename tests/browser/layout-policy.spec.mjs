import {test,expect} from '@playwright/test';
import {layout} from './helpers.mjs';

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
