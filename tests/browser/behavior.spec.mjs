import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {operationName,operationLanguages,navigationPath,checkNavigation} from '../../scripts/ci/routes.mjs';
import {run,setup,openPage,inspectRoute,layout,afterURL,loginFixture,createBrowserAccount} from './helpers.mjs';

for(const descriptor of run.scope.pages)for(const language of operationLanguages(descriptor,run.scope.languages))for(const width of [1440,390]) {
  test.describe(operationName(descriptor,language,width),()=>{
    test.use({viewport:{width,height:900},hasTouch:width===390,locale:language==='zh'?'zh-CN':'en'});
    test('navigation, language and page operation remain usable',async({page,context},testInfo)=>{
      const audit=await setup(page,language);
      const route=await inspectRoute(page,descriptor,language,afterURL,'after');
      if(route.kind!=='page') {
        await testInfo.attach('HTTP route transition',{body:Buffer.from(JSON.stringify(route)),contentType:'application/json'});
        return;
      }
      await openPage(page,descriptor,language);
      await layout(page);
      if(descriptor.generic) {
        const links=(await page.locator('a[href],area[href]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')))).map(link=>navigationPath(link,page.url())).filter(Boolean);
        await checkNavigation(afterURL,links,run.scope.pagePaths);
        expect(audit.problems).toEqual([]);return;
      }
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
        const account=await createBrowserAccount();
        try {
          await account.setPermissions({can_demo:true,can_download:false});
          await page.locator('#access [data-action="login"]').click();
          await page.locator('#account').fill(account.username);await page.locator('#password').fill('intentionally-wrong-test-password');
          const denied=page.waitForResponse(r=>r.url()===afterURL+'/api/login'&&r.request().method()==='POST',{timeout:10000});
          await page.locator('#login-form [type=submit]').click();expect((await denied).status()).toBe(401);
          await expect(page.locator('#login-form [role=status]')).toContainText(language==='zh'?'用户名或密码不正确':'incorrect');
          await page.locator('#password').fill(account.password);
          const accepted=page.waitForResponse(r=>r.url()===afterURL+'/api/login'&&r.request().method()==='POST',{timeout:10000});
          await page.locator('#login-form [type=submit]').click();expect((await accepted).status()).toBe(200);
          await expect(page.locator('#access .who')).toHaveText(account.username);
          await expect(page.locator('#access li').first()).toHaveAttribute('data-state','ok');
          const resource=page.waitForResponse(r=>r.url()===afterURL+'/api/resources/digital-toll/demo',{timeout:10000});
          await demo.click();expect((await resource).status()).toBe(503);
          await expect(page.locator('#dialog-body [role=status]')).toContainText(language==='zh'?'演示或资料尚未接入':'not connected yet');
          await expect(page.locator('#dialog-body [role=status] b')).toHaveText(language==='zh'?'尚未接入':'NOT YET CONNECTED');
          await page.keyboard.press('Escape');await expect(demo).toBeFocused();
          if(run.scope.caseDemos) {
            const trigger=page.locator('[data-action="demo"][data-selected="8"]'),modal=page.locator('#case-demo-modal'),frame=page.frameLocator('#case-demo-frame');
            await trigger.click();await expect(modal).toBeVisible();await expect(frame.locator('#start')).toBeVisible();
            await expect(frame.locator('#viewer-error')).toBeHidden();
            await testInfo.attach('demo initial state',{body:await modal.screenshot(),contentType:'image/png'});
            await frame.locator('#start').click();await frame.locator('[data-answer="18"]').click();await frame.locator('[data-answer="1"]').click();
            await expect(frame.locator('#status')).toHaveText('半成品已生成');await expect(frame.locator('#progress-count')).toHaveText('3 / 4 步');
            await frame.locator('#prompt').fill('方槽改为16毫米');await frame.locator('#send').click();
            await expect(frame.locator('#versions')).toContainText('版本 04');
            await frame.locator('#checks').click();await expect(frame.locator('#dialog-body')).toContainText('16 × 16 mm');await frame.locator('#dialog-close').click();
            const canvas=frame.locator('#model-canvas');await canvas.scrollIntoViewIfNeeded();const before=await canvas.screenshot(),box=await canvas.boundingBox();
            await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6,{steps:8});await page.mouse.up();
            await expect.poll(async()=>Buffer.compare(before,await canvas.screenshot())).not.toBe(0);
            await testInfo.attach('demo completed state',{body:await modal.screenshot(),contentType:'image/png'});
            expect(await frame.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
            await frame.locator('#versions').click();await frame.locator('[data-version="1"]').click();await expect(frame.locator('#versions')).toContainText('版本 01');
            await frame.locator('#about').click();await frame.locator('#dialog').press('Escape');await expect(frame.locator('#dialog')).not.toBeVisible();await expect(modal).toBeVisible();
            await frame.locator('#start').press('Escape');await expect(modal).not.toBeVisible();await expect(page.locator('#case-demo-frame')).toHaveAttribute('src','about:blank');
            await expect(page.locator('body')).not.toHaveClass(/case-demo-open/);await expect(trigger).toBeFocused();
            await trigger.click();await expect(frame.locator('#status')).toHaveText('等待开始');await expect(frame.locator('#versions')).toContainText('示例半成品');
            await page.locator('[data-case-demo-close]').click();await expect(modal).not.toBeVisible();
          }
          expect((await page.request.get(afterURL+'/api/resources/digital-toll/download')).status()).toBe(403);
          await account.setPermissions({can_demo:false,can_download:true});
          await demo.click();await expect(page.locator('#dialog-body [role=status]')).toContainText(language==='zh'?'尚未获得查看演示权限':'not yet authorised');
          await expect(page.locator('#access li').first()).not.toHaveAttribute('data-state','ok');
          expect((await page.request.get(afterURL+'/api/resources/digital-toll/demo')).status()).toBe(403);
          expect((await page.request.get(afterURL+'/api/resources/digital-toll/download')).status()).toBe(503);
          await page.keyboard.press('Escape');await page.locator('#access button.txt').click();
          await expect(page.locator('#access [data-action="login"]')).toBeVisible();
          expect((await page.request.get(afterURL+'/api/resources/digital-toll/demo')).status()).toBe(401);
        } finally {await account.remove();}
      }
      expect(audit.problems).toEqual([]);
      await testInfo.attach('operation environment',{body:Buffer.from(JSON.stringify({data:'Temporary local D1 and OTA test response',externalFontIssues:audit.external})),contentType:'application/json'});
    });
  });
}
