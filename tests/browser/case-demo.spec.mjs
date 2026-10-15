import {test as base,expect} from '@playwright/test';
import {active,afterURL,loginFixture,setup} from './helpers.mjs';

// Reuse one real local session per worker instead of repeatedly logging in
// for every locale and viewport (which would test the login rate limit).
const test=base.extend({
  demoSession:[async({playwright},use)=>{
    const request=await playwright.request.newContext();
    await loginFixture({request},afterURL,'after');
    await use(await request.storageState());
    await request.dispose();
  },{scope:'worker'}],
  storageState:async({demoSession},use)=>use(demoSession)
});

const titles={zh:'CAD 互动演示',en:'CAD interactive demo',ja:'CAD インタラクティブデモ',ko:'CAD 인터랙티브 데모',es:'Demostración interactiva de CAD',fr:'Démonstration interactive de CAO'};

// This fixture isolates the website's modal contract. The actual CAD resource
// gateway is exercised separately by the case's real HTTP integration test.
for(const [language,title] of Object.entries(titles))for(const width of [1440,390]) {
  test(`CAD modal locale and pointer focus ${language} ${width}px`,async({page})=>{
    test.skip(!active('cases'),'Cases page is outside this change');
    await page.setViewportSize({width,height:900});
    const audit=await setup(page,language);
    await page.route('**/api/resources/industrial-modeling/demo',route=>route.fulfill({status:200,contentType:'text/html',body:''}));
    await page.route('**/api/resources/industrial-modeling/demo/index.html?embed=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Modal test fixture<script>parent.postMessage({type:"case-demo-height",height:600},location.origin)</script></body></html>'}));
    await page.goto(`${afterURL}/cases/?lang=${language}`,{waitUntil:'domcontentloaded'});
    const opener=page.locator('[data-action="demo"][data-selected="8"]');
    // Safari pointer clicks do not necessarily focus buttons. Suppress that
    // browser default so the test requires the delegated click target itself.
    await opener.evaluate(button=>button.addEventListener('mousedown',event=>event.preventDefault()));
    await opener.click();
    const modal=page.locator('#case-demo-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#case-demo-frame')).toHaveAttribute('title',title);
    await expect(page.locator('#case-demo-frame')).toHaveAttribute('src',/industrial-modeling\/demo\/index\.html\?embed=1$/);
    await page.locator('[data-case-demo-close]').click();
    await expect(modal).not.toBeVisible();
    await expect(opener).toBeFocused();
    await expect(page.locator('#case-demo-frame')).toHaveAttribute('src','about:blank');
    await opener.press('Enter');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(opener).toBeFocused();
    expect(audit.problems).toEqual([]);
  });
}
