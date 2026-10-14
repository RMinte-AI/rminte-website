import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const owner = 'massif-01';
export const pages = [
  {id:'home', path:'/', file:'website/index.html', regions:['#hero','#engine','#teardown','#thermal','#sapphire','#craft']},
  {id:'gallery', path:'/gallery/', file:'website/gallery/index.html', regions:['main']},
  {id:'models', path:'/models/', file:'website/models/index.html', regions:['main']},
  {id:'cases', path:'/cases/', file:'website/cases/index.html', regions:['main']},
  {id:'admin', path:'/admin/', file:'website/admin/index.html', regions:['main'],languages:['zh']},
  {id:'downloads', path:'/downloads/', file:'website/downloads/index.html', regions:['main']},
  {id:'guides', path:'/guides/', file:'website/guides/index.html', regions:['main']},
  ...['admin','root','security','network'].map(id => ({id:`guide-${id}`,path:`/guides/${id}`,file:`website/guides/${id}.html`,regions:['main']})),
  {id:'lamp', path:'/tools/emoji2pixel/', file:'website/tools/emoji2pixel/index.html', regions:['body']}
];

export function git(root, ...args) {
  return execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:'pipe',maxBuffer:10_000_000});
}

export function parseChanges(output) {
  const parts=output.split('\0'), changes=[];
  for(let i=0;i<parts.length && parts[i];) {
    const status=parts[i++];
    const paths=/^[RC]/.test(status) ? [parts[i++],parts[i++]] : [parts[i++]];
    if(paths.some(path=>!path)) throw new Error('Incomplete Git name-status record');
    changes.push({status,paths});
  }
  return changes;
}

export function changedPaths(root,base,head) {
  return parseChanges(git(root,'diff','--name-status','-z','-M','--merge-base',base,head,'--'));
}

const infrastructure = path => /^(?:\.github\/workflows\/|scripts\/ci\/|tests\/browser\/|playwright\.config\.|package(?:-lock)?\.json$)/.test(path);
const document = path => /^(?:docs\/|design-preview\/|copy-review\/|output\/)/.test(path)
  || (/^[^/]+\.md$/.test(path) && path!=='DESIGN.md')
  || ['.gitignore','.github/CODEOWNERS','.github/pull_request_template.md'].includes(path);

export function classify(changes,{all=false}={}) {
  const files=[...new Set(changes.flatMap(change=>change.paths))].sort();
  const ids=new Set(), languages=new Set(['zh','en']);
  const scope={files,changes,pages:[],languages:[],widths:[1440,390],fonts:false,brand:false,exif:false,guides:false,translations:false,seo:false,caseService:false,ota:false,infrastructure:false,homeMotion:false};
  const addAll=()=>{pages.forEach(page=>ids.add(page.id));scope.widths=[1440,768,390,320];};
  const guidePages=()=>pages.filter(page=>page.id.startsWith('guide')).forEach(page=>ids.add(page.id));
  for(const file of files) {
    if(infrastructure(file)) {scope.infrastructure=true;addAll();Object.assign(scope,{fonts:true,brand:true,exif:true,guides:true,translations:true,seo:true,caseService:true,ota:true,homeMotion:true});continue;}
    if(document(file)) continue;
    if(file==='DESIGN.md'||file==='website/DESIGN.md') {addAll();continue;}
    if(file.startsWith('services/tianshanos-ota/')||file==='scripts/sync-tianshanos-release.mjs') {scope.ota=true;scope.fonts=true;continue;}
    if(file.startsWith('services/case-access/')) {scope.caseService=true;ids.add('cases');ids.add('admin');continue;}
    if(file==='scripts/build-service-brand.mjs') {scope.brand=true;scope.ota=true;continue;}
    if(/(?:seo|_worker\.js|_routes\.json|_headers|_redirects|404\.html|robots\.txt|sitemap\.xml)/.test(file)) {scope.seo=true;addAll();if(file.endsWith('_worker.js'))scope.caseService=true;continue;}
    if(file.startsWith('website/scripts/')) {
      if(file.includes('build-fonts')) {scope.fonts=true;addAll();}
      else if(file.includes('gallery-exif')) {scope.exif=true;ids.add('gallery');}
      else if(file.includes('build-guides')) {scope.guides=true;guidePages();}
      else if(/(?:translations|i18n)/.test(file)) {scope.translations=true;addAll();}
      else addAll();
      continue;
    }
    if(!file.startsWith('website/')) throw new Error(`No CI scope for ${file}; classify this path explicitly.`);
    scope.fonts=true;
    const locale=file.match(/(?:translations\/|locales\/)(ja|ko|es|fr)\.(?:js|json)$/)?.[1]||file.match(/\.(ja|ko|es|fr)\.md$/)?.[1];
    if(locale) languages.add(locale);
    if(/website\/(?:locales\/|assets\/translations\/)/.test(file)) {scope.translations=true;addAll();continue;}
    if(/website\/assets\/(?:brand\.css|styles\.css|motion\.js|i18n\.js|site-data\.js|footer\.js|fonts\/)/.test(file)) {
      addAll();scope.homeMotion=true;
      if(/(?:brand\.css|fonts\/)/.test(file)) {scope.brand=true;scope.ota=true;}
      if(file.endsWith('site-data.js')) {scope.guides=true;scope.translations=true;}
      if(file.endsWith('i18n.js')) ['ja','ko','es','fr'].forEach(lang=>languages.add(lang));
      continue;
    }
    if(file.startsWith('website/guides/')||file.startsWith('website/assets/guides')) {scope.guides=true;guidePages();continue;}
    if(/website\/(?:gallery\/|assets\/gallery)/.test(file)) {ids.add('gallery');if(/\.(?:jpg|jpeg)$/i.test(file)){scope.exif=true;ids.add('home');scope.homeMotion=true;}continue;}
    if(/website\/(?:downloads\/|assets\/downloads)/.test(file)) {ids.add('downloads');continue;}
    if(file.startsWith('website/models/')) {ids.add('models');continue;}
    if(file.startsWith('website/cases/')) {ids.add('cases');continue;}
    if(file.startsWith('website/admin/')) {ids.add('admin');continue;}
    if(/website\/assets\/case-(?:ui|auth)/.test(file)) {ids.add('cases');ids.add('admin');continue;}
    if(file.startsWith('website/tools/emoji2pixel/')) {ids.add('lamp');continue;}
    if(file==='website/index.html'||/website\/assets\/(?:main\.js|engine|system|images\/|videos\/|teardown-frames)/.test(file)) {ids.add('home');scope.homeMotion=true;continue;}
    addAll(); // Unknown production assets can affect more than one entry page.
  }
  if(all) {addAll();Object.assign(scope,{fonts:true,brand:true,exif:true,guides:true,translations:true,seo:true,caseService:true,ota:true,homeMotion:true,infrastructure:true});}
  scope.pages=pages.filter(page=>ids.has(page.id));scope.languages=[...languages];
  scope.reason=scope.pages.length ? 'Browser checks follow the changed production dependencies.' : 'No affected website UI; screenshots are not applicable.';
  return scope;
}

export function context(root,{base,head,all=false}={}) {
  const event=process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')) : {};
  const pr=event.pull_request;
  base ||= pr?.base.sha || 'origin/main';
  head ||= pr?.head.sha || 'HEAD';
  const changes=changedPaths(root,base,head);
  if(!process.env.CI) {
    changes.push(...parseChanges(git(root,'diff','--name-status','-z','-M','HEAD','--')));
    for(const file of git(root,'ls-files','--others','--exclude-standard','-z').split('\0').filter(Boolean)) changes.push({status:'A',paths:[file]});
  }
  return {schema:1,baseSha:git(root,'rev-parse',base).trim(),headSha:git(root,'rev-parse',head).trim(),testSha:git(root,'rev-parse','HEAD').trim(),local:!process.env.CI,prNumber:pr?.number||null,author:pr?.user?.login||null,body:pr?.body||'',scope:classify(changes,{all})};
}

export function checkDescription({author,body}) {
  if(!author||author===owner) return 'Owner/local run: no mandatory review material.';
  for(const label of ['问题与原因','影响范围','验证结果','依据与限制']) {
    const match=body.match(new RegExp(`^## ${label}\\s*\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`,'m'));
    const content=match?.[1].replace(/<!--[\s\S]*?-->/g,'').trim();
    if(!content||/^待填写|^TODO$/i.test(content)) throw new Error(`PR description missing: ${label}`);
  }
  return 'Contributor description fields are present; Owner judges their substance.';
}

if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const run=context(process.cwd());
  console.log(JSON.stringify({pages:run.scope.pages.map(p=>p.path),languages:run.scope.languages,widths:run.scope.widths,reason:run.scope.reason}));
  if(process.env.GITHUB_OUTPUT)writeFileSync(process.env.GITHUB_OUTPUT,`browser=${run.scope.pages.length>0}\n`,{flag:'a'});
}
