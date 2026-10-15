import {test,expect} from '@playwright/test';
import {run,languages,setup,openPage,capture,saveRecords,beforeURL,afterURL,loginFixture} from './helpers.mjs';

for(const descriptor of run.scope.pages)for(const language of languages(descriptor))for(const width of run.scope.widths) {
  test.describe(`${descriptor.id} ${language} ${width}px`,()=>{
    test.use({viewport:{width,height:900},hasTouch:width<=768,locale:language==='zh'?'zh-CN':language});
    test('current commit has comparable before and after evidence',async({page},testInfo)=>{
      const audit=await setup(page,language),records=[];
      for(const [phase,base] of [['before',beforeURL],['after',afterURL]]) {
        await page.context().clearCookies();
        if(descriptor.id==='admin')await loginFixture(page,base,phase);
        await openPage(page,descriptor,language,base);
        for(const region of descriptor.regions)records.push(await capture(page,testInfo,descriptor,language,width,phase,region,audit));
      }
      saveRecords(`${descriptor.id}-${language}-${width}`,records);
      expect(records).toHaveLength(descriptor.regions.length*2);
    });
  });
}
