import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync,cpSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {changedPaths,classify,checkDescription,git,context as getContext,parseChanges} from './scope.mjs';
import {checkHtml,checkCss,syntax,generatedCheck} from './static.mjs';
import {validateEvidence,gateResult} from './report.mjs';
import {scanSecrets} from './secrets.mjs';
import {buildWorkers} from './build.mjs';

test('real divergent history classifies only the PR change, including renames and deletion',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-git-'));
  try {
    git(root,'init','-b','main');git(root,'config','user.name','CI Fixture');git(root,'config','user.email','ci@example.invalid');
    writeFileSync(join(root,'README.md'),'initial\n');mkdirSync(join(root,'website/assets'),{recursive:true});writeFileSync(join(root,'website/assets/brand.css'),'a{color:white}\n');
    git(root,'add','README.md','website');git(root,'commit','-m','base');const common=git(root,'rev-parse','HEAD').trim();
    writeFileSync(join(root,'website/assets/main.js'),'console.log("main only")');git(root,'add','website');git(root,'commit','-m','main advances');const base=git(root,'rev-parse','HEAD').trim();
    git(root,'switch','-c','contributor',common);writeFileSync(join(root,'README.md'),'docs PR\n');git(root,'add','README.md');git(root,'commit','-m','docs');
    const changes=changedPaths(root,base,'HEAD');assert.deepEqual(changes,[{status:'M',paths:['README.md']}]);assert.equal(classify(changes).pages.length,0);
    git(root,'mv','website/assets/brand.css','website/assets/other.css');git(root,'commit','-m','rename');
    const renamed=changedPaths(root,base,'HEAD');assert.ok(renamed.some(c=>c.status.startsWith('R')&&c.paths.includes('website/assets/brand.css')));assert.equal(classify(renamed).brand,true);
    git(root,'rm','website/assets/other.css');git(root,'commit','-m','delete');assert.equal(classify(changedPaths(root,base,'HEAD')).brand,true);
    assert.throws(()=>changedPaths(root,'missing-ref','HEAD'));
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('production Markdown, shared dependencies and new production files cannot use the documentation exemption',()=>{
  assert.equal(classify([{status:'M',paths:['website/guides/content/admin.md']}]).guides,true);
  assert.equal(classify([{status:'M',paths:['website/assets/brand.css']}]).pages.length,12);
  const unknown=classify([{status:'A',paths:['website/new-feature/unknown.js']}]);
  assert.equal(unknown.pages.length,12);assert.equal(unknown.homeMotion,true);
  const translated=classify([{status:'M',paths:['website/assets/translations/fr.js']}]);
  assert.ok(translated.languages.includes('fr'));
  assert.deepEqual(translated.pages.find(page=>page.id==='lamp').languages,['zh','en']);
  assert.equal(classify([{status:'M',paths:['docs/example.md']}]).pages.length,0);
  assert.throws(()=>classify([{status:'A',paths:['unclassified-code.py']}]),/No CI scope/);
});

test('Owner has no mandatory review material; an empty contributor description is rejected',()=>{
  assert.doesNotThrow(()=>checkDescription({author:'massif-01',body:''}));
  assert.throws(()=>checkDescription({author:'contributor',body:'## 问题与原因\n<!-- comment only -->'}),/missing/);
  assert.doesNotThrow(()=>checkDescription({author:'contributor',body:['问题与原因','影响范围','验证结果','依据与限制'].map(s=>`## ${s}\n真实说明\n`).join('\n')}));
});

test('actual malformed JavaScript, CSS and missing referenced resources are rejected',()=>{
  assert.throws(()=>syntax('function broken(', 'bad.js'));
  const root=mkdtempSync(join(tmpdir(),'rminte-resources-'));
  try {
    mkdirSync(join(root,'website'));writeFileSync(join(root,'website/index.html'),'<script src="missing.js"></script>');assert.throws(()=>checkHtml(root,'website/index.html'),/missing local resource/);
    writeFileSync(join(root,'website/index.html'),'<script>function broken(</script>');assert.throws(()=>checkHtml(root,'website/index.html'));
    writeFileSync(join(root,'website/bad.css'),'a { color: red;');assert.throws(()=>checkCss(root,'website/bad.css'));
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('the real font checker rejects a newly introduced Chinese character',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-font-'));
  try {
    mkdirSync(join(root,'website/scripts'),{recursive:true});mkdirSync(join(root,'website/assets'),{recursive:true});
    cpSync('website/assets/fonts',join(root,'website/assets/fonts'),{recursive:true});cpSync('website/scripts/build-fonts.py',join(root,'website/scripts/build-fonts.py'));
    const have=readFileSync('website/assets/fonts/noto-sans-sc.chars.txt','utf8');let cp=0x4e00;while(have.includes(String.fromCodePoint(cp)))cp++;
    writeFileSync(join(root,'website/index.html'),`<p>${String.fromCodePoint(cp)}</p>`);
    const result=spawnSync('python3',['website/scripts/build-fonts.py','--check'],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,1);assert.match(result.stdout,/not in the subset/);assert.ok(result.stdout.includes(String.fromCodePoint(cp)));
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('generated-output check detects stale files without changing the checkout',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-derived-'));
  try {
    mkdirSync(join(root,'website'));writeFileSync(join(root,'website/generate.mjs'),'import {writeFileSync} from "node:fs";writeFileSync(new URL("output.js",import.meta.url),"fresh");');
    writeFileSync(join(root,'website/output.js'),'stale');
    assert.throws(()=>generatedCheck(root,'website/generate.mjs',['website/output.js']),/stale generated/);assert.equal(readFileSync(join(root,'website/output.js'),'utf8'),'stale');
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('evidence for another Head, missing screenshots and altered image bytes fail the gate',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-evidence-')),directory=join(root,'output/ci/evidence');
  try {
    mkdirSync(join(directory,'records'),{recursive:true});
    const context={baseSha:'base',headSha:'head',testSha:'merge',scope:{pages:[{id:'gallery',regions:['main']}],languages:['en'],widths:[390]}};
    writeFileSync(join(directory,'manifest.json'),JSON.stringify({...context,headSha:'old'}));assert.throws(()=>validateEvidence(root,context),/headSha/);
    writeFileSync(join(directory,'manifest.json'),JSON.stringify(context));assert.throws(()=>validateEvidence(root,context),/Required screenshot missing/);
    const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=','base64');
    writeFileSync(join(directory,'image.png'),bytes);
    const records=['before','after'].map(phase=>({phase,page:'gallery',language:'en',width:390,region:'main',file:'image.png',sha256:createHash('sha256').update(bytes).digest('hex')}));
    writeFileSync(join(root,'output/ci/browser-results.json'),JSON.stringify({stats:{skipped:0,unexpected:0,flaky:0},suites:[{specs:[{tests:[{expectedStatus:'passed',results:[{status:'passed'}]}]}]}]}));
    writeFileSync(join(directory,'records/gallery.json'),JSON.stringify(records));assert.equal(validateEvidence(root,context).screenshots,2);
    writeFileSync(join(root,'output/ci/browser-results.json'),JSON.stringify({stats:{skipped:1},suites:[]}));assert.throws(()=>validateEvidence(root,context),/without skips/);
    writeFileSync(join(directory,'image.png'),Buffer.concat([bytes,Buffer.from('altered')]));assert.throws(()=>validateEvidence(root,context),/checksum/);
    assert.throws(()=>gateResult([{name:'browser',required:true,status:'cancelled'}]),/did not pass/);
    assert.throws(()=>gateResult([{name:'browser',required:true,status:'skipped'}]),/did not pass/);
    assert.doesNotThrow(()=>gateResult([{name:'browser',required:false,status:'not-applicable'}]));
  }finally{rmSync(root,{recursive:true,force:true});}
});

test('a real added or deleted HTML route remains in browser scope with honest baseline availability',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-route-'));
  try {
    git(root,'init','-b','main');git(root,'config','user.name','CI Fixture');git(root,'config','user.email','ci@example.invalid');
    writeFileSync(join(root,'README.md'),'route fixture\n');git(root,'add','README.md');git(root,'commit','-m','base');const base=git(root,'rev-parse','HEAD').trim();
    mkdirSync(join(root,'website/new-feature'),{recursive:true});writeFileSync(join(root,'website/new-feature/index.html'),'<main>New route</main>');git(root,'add','website');git(root,'commit','-m','new route');
    const added=getContext(root,{base,head:'HEAD'}).scope.pages.find(page=>page.path==='/new-feature/');
    assert.ok(added);assert.equal(added.generic,true);assert.equal(added.beforeExists,false);assert.equal(added.afterExists,true);
    const introduced=git(root,'rev-parse','HEAD').trim();git(root,'rm','website/new-feature/index.html');git(root,'commit','-m','remove route');
    const removed=getContext(root,{base:introduced,head:'HEAD'}).scope.pages.find(page=>page.path==='/new-feature/');
    assert.ok(removed);assert.equal(removed.beforeExists,true);assert.equal(removed.afterExists,false);
    const translated='website/new-feature/用户.html';mkdirSync(join(root,'website/new-feature'),{recursive:true});writeFileSync(join(root,translated),'<main>Existing route</main>');git(root,'add',translated);git(root,'commit','-m','Unicode route');
    const previous=git(root,'rev-parse','HEAD').trim();writeFileSync(join(root,translated),'<main>Updated route</main>');git(root,'add',translated);git(root,'commit','-m','update Unicode route');
    assert.equal(getContext(root,{base:previous,head:'HEAD'}).scope.pages.find(page=>page.file===translated).beforeExists,true);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('new page URLs preserve index-like names, uppercase HTML and URL-special characters',()=>{
  const scope=classify([{status:'A',paths:['website/test/myindex.html']},{status:'A',paths:['website/test/a#b.HTML']}]);
  assert.ok(scope.pages.some(page=>page.path==='/test/myindex'));
  assert.ok(scope.pages.some(page=>page.path==='/test/a%23b.HTML'));
  assert.equal(new Set(scope.pages.map(page=>page.id)).size,scope.pages.length);
});

test('the real secret scanner rejects a credential removed from the final tree and never reports its value',async()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-secret-history-'));
  try {
    git(root,'init','-b','main');git(root,'config','user.name','CI Fixture');git(root,'config','user.email','ci@example.invalid');
    writeFileSync(join(root,'README.md'),'No credential.\n');git(root,'add','README.md');git(root,'commit','-m','base');const base=git(root,'rev-parse','HEAD').trim();
    await scanSecrets(root,{baseSha:base,headSha:base,scope:{files:['README.md']}});
    const alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const secret=['gh','p_'].join('')+Array.from(randomBytes(36),byte=>alphabet[byte%alphabet.length]).join('');
    writeFileSync(join(root,'README.md'),`credential = "${secret}"\n`);git(root,'add','README.md');git(root,'commit','-m','synthetic credential');
    writeFileSync(join(root,'README.md'),'No credential.\n');git(root,'add','README.md');git(root,'commit','-m','remove synthetic credential');
    const head=git(root,'rev-parse','HEAD').trim();
    await assert.rejects(scanSecrets(root,{baseSha:base,headSha:head,scope:{files:['README.md']}}),/Secrets detected/);
    const report=readFileSync(join(root,'output/ci/secrets.json'),'utf8');
    assert.equal(report.includes(secret),false);
    const findings=JSON.parse(report).findings;assert.ok(findings.length);assert.ok(findings.every(finding=>finding.scan==='commits'));
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('Pages builds the advanced-mode entry without functions and rejects a broken entry dependency',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-pages-entry-'));
  try {
    mkdirSync(join(root,'website'));mkdirSync(join(root,'services/case-access'),{recursive:true});
    cpSync('services/case-access/wrangler.jsonc',join(root,'services/case-access/wrangler.jsonc'));
    writeFileSync(join(root,'website/_worker.js'),'import {message} from "./dependency.js";export default {fetch(){return new Response(message)}};');
    writeFileSync(join(root,'website/dependency.js'),'export const message="Actual advanced-mode Worker";');
    const scope={caseService:true};
    assert.doesNotThrow(()=>buildWorkers(root,scope));
    rmSync(join(root,'website/dependency.js'));
    assert.throws(()=>buildWorkers(root,scope),/configuration\/build failed/);
    const log=readFileSync(join(root,'output/ci/build-services-case-access-wrangler-jsonc.log'),'utf8');
    assert.match(log,/Could not resolve ["']\.\/dependency\.js/);
  } finally {rmSync(root,{recursive:true,force:true});}
});

test('a real Worker config rename builds only the destination and still rejects its missing main',()=>{
  const root=mkdtempSync(join(tmpdir(),'rminte-config-rename-'));
  try {
    git(root,'init','-b','main');git(root,'config','user.name','CI Fixture');git(root,'config','user.email','ci@example.invalid');
    const service='services/tianshanos-ota';
    mkdirSync(join(root,service,'src'),{recursive:true});mkdirSync(join(root,service,'preview-a'));
    writeFileSync(join(root,service,'src/index.js'),'export default {fetch(){return new Response("Local build fixture")}};');
    const configuration={name:'ci-rename-fixture',main:'src/index.js',compatibility_date:'2026-09-26'};
    writeFileSync(join(root,service,'wrangler.jsonc'),JSON.stringify(configuration));
    writeFileSync(join(root,service,'preview-a/wrangler.jsonc'),JSON.stringify({...configuration,main:'../src/index.js'}));
    git(root,'add',service);git(root,'commit','-m','base');const base=git(root,'rev-parse','HEAD').trim();
    git(root,'mv',service+'/preview-a',service+'/preview-b');git(root,'commit','-m','move preview config');
    const changes=changedPaths(root,base,'HEAD'),scope=classify(changes);
    assert.ok(changes.some(change=>change.status.startsWith('R')));
    assert.doesNotThrow(()=>buildWorkers(root,scope));
    assert.deepEqual(scope.workerConfigs,[service+'/preview-b/wrangler.jsonc']);
    writeFileSync(join(root,service,'preview-b/wrangler.jsonc'),JSON.stringify({...configuration,main:'../src/missing.js'}));
    assert.throws(()=>buildWorkers(root,scope),/configuration\/build failed/);
    const log=readFileSync(join(root,'output/ci/build-services-tianshanos-ota-preview-b-wrangler-jsonc.log'),'utf8');
    assert.match(log,/missing\.js/);
    git(root,'rm', '-f', service+'/preview-b/wrangler.jsonc');
    const pending=classify([...changes,...parseChanges(git(root,'diff','--name-status','-z','HEAD','--'))]);
    assert.deepEqual(pending.workerConfigs,[]);assert.doesNotThrow(()=>buildWorkers(root,pending));
    git(root,'commit','-m','remove preview config');
    const deleted=classify(changedPaths(root,base,'HEAD'));
    assert.deepEqual(deleted.workerConfigs,[]);assert.doesNotThrow(()=>buildWorkers(root,deleted));
  } finally {rmSync(root,{recursive:true,force:true});}
});
