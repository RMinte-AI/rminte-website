import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {expect} from '@playwright/test';

export const run=JSON.parse(readFileSync(resolve('output/ci/context.json'),'utf8'));
export const afterURL=process.env.RMINTE_AFTER_URL||'http://127.0.0.1:8788';
export const beforeURL=process.env.RMINTE_BEFORE_URL||'http://127.0.0.1:8789';
export const languages=page=>run.scope.languages.filter(lang=>!page.languages||page.languages.includes(lang));
export const active=id=>run.scope.pages.some(page=>page.id===id);

const release={tag:'v0.0.0-ci',snapshot:'ci-fixture',release_url:'https://example.invalid/ci-release',firmware:{size:123456},www:{size:234567}};
export async function setup(page,language) {
  await page.context().addInitScript(lang=>{localStorage.setItem('rm-soft-lang',lang);localStorage.setItem('emoji2pixel_lang',lang==='zh'?'zh-CN':'en-US');},language);
  await page.route('https://static.cloudflareinsights.com/**',route=>route.fulfill({contentType:'application/javascript',body:'/* analytics excluded from local CI */'}));
  await page.route('https://ota.rminte.com/release',route=>route.fulfill({json:release}));
  const problems=[],external=[];
  page.on('pageerror',e=>problems.push(e.message));
  page.on('response',response=>{
    const url=new URL(response.url());
    if(url.hostname==='127.0.0.1'&&response.status()>=400&&!url.pathname.startsWith('/api/'))problems.push(`${response.status()}: ${url.pathname}`);
  });
  page.on('console',message=>{
    if(message.type()!=='error')return;
    const url=message.location().url||'';
    if(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url))external.push(message.text());
    else if(!url.includes('/api/'))problems.push(message.text());
  });
  return {problems,external};
}

export async function loginFixture(page,base,phase) {
  const runtime=process.env[phase==='before'?'RMINTE_BEFORE_FIXTURE':'RMINTE_AFTER_FIXTURE'];
  if(!runtime)throw new Error('Run npm run verify to create the local account fixture.');
  const text=readFileSync(join(runtime,'services/case-access/.local/admin-login.txt'),'utf8');
  const response=await page.request.post(base+'/api/login',{headers:{Origin:base},data:{username:'admin',password:text.match(/密码：(.*)/)[1]}});
  expect(response.status()).toBe(200);
}

export async function openPage(page,descriptor,language,base=afterURL) {
  const response=await page.goto(`${base}${descriptor.path}?lang=${language}`,{waitUntil:'domcontentloaded'});
  expect(response.status()).toBe(200);
  await expect(page.locator('main').first()).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  if(descriptor.id!=='lamp')await expect(page.locator('html')).toHaveAttribute('lang',{zh:'zh-CN',en:'en',ja:'ja',ko:'ko',es:'es-ES',fr:'fr-FR'}[language]);
  else await expect(page.locator('#langSelect')).toHaveValue(language==='zh'?'zh-CN':'en-US');
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
  await target.scrollIntoViewIfNeeded();
  await target.locator('img[src]:not([src=""])').evaluateAll(async images=>{
    for(const image of images){image.loading='eager';await image.decode();}
  });
  await page.evaluate(async()=>{
    await document.fonts.ready;
    for(const video of document.querySelectorAll('video')){video.pause();if(video.readyState>0)video.currentTime=0;}
  });
  await layout(page);
  await target.screenshot({path:file,animations:'disabled'});
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
