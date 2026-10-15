import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {run,languages,setup,openPage,layout,afterURL,loginFixture} from './helpers.mjs';

for(const descriptor of run.scope.pages)for(const language of languages(descriptor).filter(lang=>['zh','en'].includes(lang)))for(const width of [1440,390]) {
  test.describe(`operations ${descriptor.id} ${language} ${width}px`,()=>{
    test.use({viewport:{width,height:900},hasTouch:width===390,locale:language==='zh'?'zh-CN':'en'});
    test('navigation, language and page operation remain usable',async({page,context},testInfo)=>{
      const audit=await setup(page,language);
      await openPage(page,descriptor,language);
      await layout(page);
      if(descriptor.id==='admin') {
        await expect(page.locator('#admin-login')).toBeVisible();
        const credentials=readFileSync(join(process.env.RMINTE_AFTER_FIXTURE,'services/case-access/.local/admin-login.txt'),'utf8');
        await page.locator('#admin-login input[name=username]').fill('admin');
        await page.locator('#admin-login input[name=password]').fill(credentials.match(/密码：(.*)/)[1]);
        await page.locator('#admin-login button').click();
        await expect(page.locator('#create-user')).toBeVisible();
        await page.locator('#change-password').click();await expect(page.locator('#password-dialog')).toBeVisible();
        await page.keyboard.press('Escape');await expect(page.locator('#password-dialog')).not.toBeVisible();
        await page.locator('#tab-inbox').click();await expect(page.locator('#inbox-panel')).toBeVisible();
        await page.locator('#logout').click();await expect(page.locator('#admin-login')).toBeVisible();
      } else if(descriptor.id==='lamp') {
        if(width===390) {
          await page.locator('#brandMenu').click();await expect(page.locator('#brandMenu')).toHaveAttribute('aria-expanded','true');
          await page.keyboard.press('Escape');await expect(page.locator('#brandMenu')).toHaveAttribute('aria-expanded','false');
        }
        const other=language==='zh'?'en-US':'zh-CN';await page.locator('#langSelect').selectOption(other);await expect(page.locator('#langSelect')).toHaveValue(other);
        await page.locator('#boardSettingsBtn').click();await expect(page.locator('#boardDialog')).toBeVisible();
        await page.keyboard.press('Escape');await expect(page.locator('#boardDialog')).not.toBeVisible();
      } else {
        if(width===390) {
          const menu=page.locator(descriptor.id==='models'?'#menuToggle':'[data-menu-toggle]');await expect(menu).toBeVisible();await menu.click();
          const overlay=page.locator('#'+await menu.getAttribute('aria-controls'));
          if(descriptor.id==='models')await expect(overlay).toHaveAttribute('open','');else await expect(overlay).toHaveAttribute('aria-hidden','false');
          await page.keyboard.press('Escape');
          if(descriptor.id==='models')await expect(overlay).not.toHaveAttribute('open','');else await expect(overlay).toHaveAttribute('aria-hidden','true');
          await expect(menu).toBeFocused();
          const focus=await menu.evaluate(el=>{const s=getComputedStyle(el);return s.outlineStyle!=='none'||s.boxShadow!=='none';});expect(focus).toBe(true);
        }
        const contact=page.locator('[data-contact-toggle]');
        await contact.scrollIntoViewIfNeeded();await contact.click();await expect(page.locator('[data-contact-popover]')).toHaveAttribute('aria-hidden','false');
        await expect(page.locator('[data-contact-popover] a[href^="mailto:"]').first()).toBeVisible();
        await page.keyboard.press('Escape');await expect(page.locator('[data-contact-popover]')).toHaveAttribute('aria-hidden','true');await expect(contact).toBeFocused();
        await page.evaluate(()=>scrollTo(0,0));
        const other=language==='zh'?'en':'zh';
        await page.locator('.language-toggle').first().click();await page.locator(`[data-language="${other}"]`).first().click();
        await expect(page.locator('html')).toHaveAttribute('lang',other==='zh'?'zh-CN':'en');
        await page.locator('.language-toggle').first().click();await page.locator(`[data-language="${language}"]`).first().click();
        await expect(page.locator('html')).toHaveAttribute('lang',language==='zh'?'zh-CN':'en');
      }
      if(descriptor.id==='gallery') {
        const stage=page.locator('.visual-stage');
        const settled=async()=>{
          await page.locator('.product-image').evaluate(image=>image.decode());
          await expect(stage).not.toHaveClass(/is-changing/);
          // The gallery releases its input lock 420ms after the decoded image is shown.
          await page.waitForTimeout(450);
        };
        const count=page.locator('.gallery-count strong');await expect(count).toHaveText('01');
        await page.locator('[data-gallery-next]').click();await expect(count).toHaveText('02');
        await settled();await page.keyboard.press('ArrowLeft');await expect(count).toHaveText('01');
        await settled();
        const total=(await page.locator('.gallery-count span').last().textContent()).trim();
        await page.locator('[data-gallery-previous]').click();await expect(count).toHaveText(total);
        await settled();await layout(page);
        await page.locator('[data-gallery-next]').click();await expect(count).toHaveText('01');
        await settled();
        if(width===390) {
          await stage.scrollIntoViewIfNeeded();const box=await stage.boundingBox();
          const cdp=await context.newCDPSession(page),y=box.y+box.height/2;
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y}]});
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.3,y}]});
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(count).toHaveText('02');
        }
        expect(await page.locator('.product-image').evaluate(e=>getComputedStyle(e).objectFit)).toBe('contain');
      }
      if(descriptor.id==='guides') {
        const input=page.locator('[data-guide-search-input]').first();await input.fill('OTA');
        const result=page.locator('[data-guide-search-result-list] a').first();await expect(result).toBeVisible();await result.click();
        await expect(page).toHaveURL(/\/guides\/(?:admin|root|network|security).*#/);
        await expect(page.locator(page.url().slice(page.url().indexOf('#')))).toBeVisible();
      }
      if(descriptor.id.startsWith('guide-')) {
        let toc=page.locator(`aside [data-lang-pane="${language}"] [data-toc-target]`).first();
        if(width===390) {await page.locator('.guide-mobile-toc summary').click();toc=page.locator('.guide-mobile-toc [data-lang-pane="'+language+'"] [data-toc-target]').first();}
        const target=await toc.getAttribute('href');await toc.click();await expect(page).toHaveURL(new RegExp(target+'$'));
        const copy=page.locator(`[data-lang-pane="${language}"] [data-copy-code]`).first();
        // Some articles have no code blocks; the source determines whether copying is applicable.
        if(await copy.count()) {
          await context.grantPermissions(['clipboard-read','clipboard-write']);await copy.click();await expect(copy).toHaveText(language==='zh'?'已复制':'Copied');
          const expected=await copy.locator('..').locator('code').textContent();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(expected);
        }
      }
      if(descriptor.id==='downloads') {
        const section=page.locator('.download-overview-item').last();const hash=await section.getAttribute('href');await section.click();await expect(page).toHaveURL(new RegExp(hash+'$'));
        const file=page.locator('a[download][href*=".pdf"]').first();const downloaded=page.waitForEvent('download');await file.click();const download=await downloaded;
        expect(readFileSync(await download.path()).subarray(0,5).toString()).toBe('%PDF-');
        expect(await page.locator('[data-tianshan-file="firmware"]').getAttribute('href')).toContain('?release=ci-fixture');
      }
      if(descriptor.id==='models') {
        await page.locator('#tabVllm').click();await expect(page.locator('#tabVllm')).toHaveAttribute('aria-selected','true');
        await page.locator('#tabCpp').click();await expect(page.locator('#tabCpp')).toHaveAttribute('aria-selected','true');
        await expect(page.locator('[data-model]').first()).toBeDisabled();
      }
      if(descriptor.id==='cases') {
        const card=page.locator('.cs-card').first();const more=card.locator('.cs-more');await more.click();await expect(more).toHaveAttribute('aria-expanded','true');
        const demo=page.locator('[data-action="demo"]').first();await demo.click();await expect(page.locator('dialog[open]')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('dialog[open]')).toHaveCount(0);
      }
      expect(audit.problems).toEqual([]);
      await testInfo.attach('operation environment',{body:Buffer.from(JSON.stringify({data:'Temporary local D1 and OTA test response',externalFontIssues:audit.external})),contentType:'application/json'});
    });
  });
}
