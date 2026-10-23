import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {expect} from '@playwright/test';
import {routeEvidence,observeRoute} from '../../scripts/ci/routes.mjs';

export const run=JSON.parse(readFileSync(resolve(process.env.RMINTE_TEST_CONTEXT||'output/ci/context.json'),'utf8'));
export const afterURL=process.env.RMINTE_AFTER_URL||'http://127.0.0.1:8788';
export const beforeURL=process.env.RMINTE_BEFORE_URL||'http://127.0.0.1:8789';
export const languages=page=>run.scope.languages.filter(lang=>!page.languages||page.languages.includes(lang));
export const active=id=>run.scope.pages.some(page=>page.id===id);

const release={tag:'v0.0.0-ci',snapshot:'ci-fixture',release_url:'https://example.invalid/ci-release',firmware:{size:123456},www:{size:234567}};
export async function setup(page,language) {
  await page.context().addInitScript(lang=>{localStorage.setItem('rm-soft-lang',lang);localStorage.setItem('emoji2pixel_lang',lang==='zh'?'zh-CN':'en-US');},language);
  await page.route('https://static.cloudflareinsights.com/**',route=>route.fulfill({contentType:'application/javascript',body:'/* analytics excluded from local CI */'}));
  // The lamp ships a local emoji fallback; screenshots must not depend on an
  // optional Unicode mirror accepting the CI runner's network address.
  await page.route('https://r.jina.ai/http://unicode.org/Public/emoji/**',route=>route.fulfill({contentType:'text/plain',body:''}));
  await page.route('https://ota.rminte.com/release',route=>route.fulfill({json:release}));
  const problems=[],external=[];
  page.on('pageerror',e=>problems.push(e.message));
  page.on('response',response=>{
    const url=new URL(response.url());
    const asset=['document','script','stylesheet','image','font','media'].includes(response.request().resourceType())||/\/demo\//.test(url.pathname);
    if(url.hostname==='127.0.0.1'&&response.status()>=400&&(!url.pathname.startsWith('/api/')||asset))problems.push(`${response.status()}: ${url.pathname}`);
  });
  page.on('console',message=>{
    if(message.type()!=='error')return;
    const url=message.location().url||'';
    if(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url))external.push(message.text());
    else if(!url.includes('/api/')||/\/demo\//.test(url))problems.push(message.text());
  });
  return {problems,external};
}

export async function loginFixture(page,base,phase) {
  const runtime=process.env[phase==='before'?'RMINTE_BEFORE_FIXTURE':'RMINTE_AFTER_FIXTURE'];
  if(!runtime)throw new Error('Run npm run verify to create the local account fixture.');
  const cookie=readFileSync(join(runtime,'services/case-access/.local/admin-session.txt'),'utf8');
  const split=cookie.indexOf('=');await page.context().addCookies([{name:cookie.slice(0,split),value:cookie.slice(split+1),url:base,httpOnly:true,sameSite:'Strict'}]);
}

export async function createBrowserAccount(base=afterURL) {
  const runtime=process.env.RMINTE_AFTER_FIXTURE;
  const cookie=readFileSync(join(runtime,'services/case-access/.local/admin-session.txt'),'utf8');
  const call=async(path,method,data)=>{
    const response=await fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
    expect(response.ok).toBe(true);return response.json();
  };
  const account=await call('/api/admin/users','POST',{});
  let version=0;
  return {...account,setPermissions:async case_ids=>{const result=await call('/api/admin/users/'+account.id+'/cases','PUT',{case_ids,version});version=result.version;return result;},remove:()=>call('/api/admin/users/'+account.id,'DELETE')};
}

export async function openPage(page,descriptor,language,base=afterURL) {
  const response=await page.goto(`${base}${descriptor.path}?lang=${language}`,{waitUntil:'domcontentloaded'});
  expect(response.status()).toBe(200);
  await expect(page.locator(descriptor.contentRoot||'main').first()).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  if(descriptor.id!=='lamp')await expect(page.locator('html')).toHaveAttribute('lang',{zh:'zh-CN',en:'en',ja:'ja',ko:'ko',es:'es-ES',fr:'fr-FR'}[language]);
  else await expect(page.locator('#langSelect')).toHaveValue(language==='zh'?'zh-CN':'en-US');
}

export async function inspectRoute(page,descriptor,language,base,phase) {
  const url=`${base}${descriptor.path}?lang=${language}`;
  const response=await observeRoute(url,async target=>{
    const response=await page.request.get(target,{maxRedirects:0,timeout:10000}),status=response.status(),location=response.headers().location;
    await response.dispose();return {status,location};
  });
  return routeEvidence(descriptor.expected?.[phase],response,phase);
}

export async function layout(page) {
  const result=await page.evaluate(()=>{
    const errors=[];
    if(document.documentElement.scrollWidth>innerWidth+2)errors.push(`document width ${document.documentElement.scrollWidth} > ${innerWidth}`);
    for(const el of document.querySelectorAll('main h1,main h2,main h3,.gallery-lead,.download-copy > p,.contact-popover h2')) {
      if(el.closest('[hidden],[aria-hidden="true"],[inert],pre,code'))continue;
      const box=el.getBoundingClientRect(),style=getComputedStyle(el);
      if(!box.width||!box.height||style.visibility==='hidden'||Number(style.opacity)===0)continue;
      if(el.scrollWidth>el.clientWidth+3)errors.push(`text overflow: ${el.textContent.trim().slice(0,70)}`);
      const range=document.createRange();range.selectNodeContents(el);
      for(const r of range.getClientRects()) {
        if(r.left<-2||r.right>innerWidth+2)errors.push(`text clipped at viewport: ${el.textContent.trim().slice(0,70)}`);
        for(let parent=el.parentElement;parent&&parent!==document.body;parent=parent.parentElement) {
          const s=getComputedStyle(parent),clip=parent.getBoundingClientRect();
          if(['hidden','clip'].includes(s.overflowX)&&(r.left<clip.left-2||r.right>clip.right+2))errors.push(`text clipped by ${parent.className||parent.tagName}: ${el.textContent.trim().slice(0,70)}`);
          if(['hidden','clip'].includes(s.overflowY)&&(r.top<clip.top-2||r.bottom>clip.bottom+2))errors.push(`text clipped by ${parent.className||parent.tagName}: ${el.textContent.trim().slice(0,70)}`);
        }
      }
    }
    for(const image of document.querySelectorAll('.visual-stage .product-image')) {
      const r=image.getBoundingClientRect();
      if(!r.width||!r.height)continue;
      for(let parent=image.parentElement;parent&&parent!==document.body;parent=parent.parentElement) {
        const s=getComputedStyle(parent),clip=parent.getBoundingClientRect();
        if(['hidden','clip'].includes(s.overflowX)&&(r.left<clip.left-2||r.right>clip.right+2))errors.push('gallery image clipped horizontally');
        if(['hidden','clip'].includes(s.overflowY)&&(r.top<clip.top-2||r.bottom>clip.bottom+2))errors.push('gallery image clipped vertically');
      }
    }
    return errors;
  });
  expect(result).toEqual([]);
}

export async function screenshotRegion(page,region,file) {
  const target=page.locator(region).first();await expect(target).toBeVisible();
  if(region==='body')await page.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));
  else await target.scrollIntoViewIfNeeded();
  await target.locator('img[src]:not([src=""])').evaluateAll(async images=>{
    for(const image of images){image.loading='eager';await image.decode();}
  });
  await page.evaluate(async()=>{
    await document.fonts.ready;
    for(const video of document.querySelectorAll('video')){video.pause();if(video.readyState>0)video.currentTime=0;}
  });
  await layout(page);
  if(region==='body')await page.screenshot({path:file,fullPage:true,animations:'disabled'});
  else await target.screenshot({path:file,animations:'disabled'});
}

export async function capture(page,testInfo,descriptor,language,width,phase,region,audit) {
  const id=[descriptor.id,language,width,region.replace(/[^a-z0-9]+/gi,'-')].join('-');
  const directory=resolve('output/ci/evidence'),relative=`screens/${phase}/${id}.png`,file=join(directory,relative);
  mkdirSync(join(directory,'screens',phase),{recursive:true});
  await screenshotRegion(page,region,file);
  expect(audit.problems).toEqual([]);
  await testInfo.attach(`${phase}: ${descriptor.path} ${language} ${width}px ${region}`,{path:file,contentType:'image/png'});
  return {phase,page:descriptor.id,path:descriptor.path,language,width,height:900,region,state:'reduced-motion; media at first frame',file:relative,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),externalFontIssues:audit.external};
}

export function saveRecords(id,records) {
  const directory=resolve('output/ci/evidence/records');mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,id+'.json'),JSON.stringify(records,null,2)+'\n');
}
