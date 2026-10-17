import {existsSync,readFileSync,statSync,mkdtempSync,rmSync,cpSync,readdirSync} from 'node:fs';
import {dirname,resolve,extname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {Script} from 'node:vm';
import {parse} from 'parse5';
import postcss from 'postcss';
import {configurationProfiles,readJsonc} from './config.mjs';
import {navigationPath} from './routes.mjs';

export function markup(source) {
  const elements=[];
  function visit(node) {if(node.tagName) elements.push(node);for(const child of node.childNodes||[])visit(child);if(node.content)visit(node.content);}
  visit(parse(source));return elements;
}
const assetRoot=file=>file.match(/^(services\/case-demos\/cases\/[a-z0-9-]+\/public)\//)?.[1]||'website';
const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value;
function navigationURL(file,reference) {
  if(!file.startsWith('website/')||!reference||reference.startsWith('#'))return null;
  return navigationPath(reference,new URL('/'+file.slice('website/'.length),'https://ci.invalid'));
}

export function resourceFile(root,from,reference,{navigation=false}={}) {
  if(!reference||/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) return null;
  const directory=assetRoot(from),base=resolve(root,directory);
  const url=new URL(reference,new URL('/'+from.slice(directory.length+1),'https://ci.invalid'));
  if(url.pathname==='/visitor-language.js'||url.pathname.startsWith('/api/')) return null;
  if(navigation)return null; // Navigation is an HTTP contract, independent of the URL's suffix or producer.
  let file=resolve(base,'.'+decodeURIComponent(url.pathname));
  if(file!==base&&!file.startsWith(base+'/'))throw new Error(`${from}: reference outside deployed assets: ${reference}`);
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)&&!extname(file))file+='.html';
  if(!existsSync(file))throw new Error(`${from}: missing local resource ${reference}`);
  return file;
}

export function syntax(source,file,type='classic') {
  if(type==='json'){JSON.parse(source);return;}
  if(type==='classic'){new Script(source,{filename:file});return;}
  try {execFileSync(process.execPath,['--check',`--input-type=${type==='module'?'module':'commonjs'}`],{input:source,encoding:'utf8',stdio:['pipe','pipe','pipe']});}
  catch(e){throw new Error(`${file}: ${String(e.stderr||e.message).slice(-2000)}`);}
}

export function checkHtml(root,file) {
  const source=readFileSync(join(root,file),'utf8'),navigation=new Set();
  for(const node of markup(source)) {
    for(const key of ['src','href','poster']) {
      const reference=attr(node,key),link=key==='href'&&['a','area'].includes(node.tagName);
      resourceFile(root,file,reference,{navigation:link});
      const target=link&&navigationURL(file,reference);if(target)navigation.add(target);
    }
    if(node.tagName==='script'&&!attr(node,'src')) {
      const type=attr(node,'type');const body=(node.childNodes||[]).map(child=>child.value||'').join('');
      if(type==='application/ld+json'||type==='application/json') syntax(body,file,'json');
      else if(!type||type==='text/javascript'||type==='module')syntax(body,file,type==='module'?'module':'classic');
    }
    if(node.tagName==='style')postcss.parse((node.childNodes||[]).map(child=>child.value||'').join(''),{from:file});
    if(attr(node,'style'))postcss.parse(`x{${attr(node,'style')}}`,{from:file});
    const prefix=attr(node,'data-frame-prefix');
    if(prefix) {resourceFile(root,file,prefix+'001.jpg');resourceFile(root,file,prefix+String(attr(node,'data-frame-count')||120).padStart(3,'0')+'.jpg');}
  }
  return [...navigation];
}

export function checkCss(root,file) {
  const css=readFileSync(join(root,file),'utf8');postcss.parse(css,{from:file});
  for(const match of css.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g))resourceFile(root,file,match[2]);
}

function moduleReferences(root,file,source) {
  const targets=[];
  const references=[...source.matchAll(/\b(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+[^'"]*?\s+from\s+)['"](\.[^'"]+)['"]/g),...source.matchAll(/\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)];
  for(const match of references) {
    let target=resolve(dirname(file),match[1]);
    if(!extname(target))for(const extension of ['.js','.mjs'])if(existsSync(target+extension)){target+=extension;break;}
    if(target.startsWith(root+'/')&&/\.(?:js|mjs)$/.test(target))targets.push(target);
  }
  return targets;
}

function moduleGraph(root,entries) {
  const modules=new Set(),pending=[...entries];
  for(const profile of Object.values(configurationProfiles).flat())if(profile.kind==='worker'&&existsSync(join(root,profile.file))) {
    const config=readJsonc(root,profile.file);
    pending.push(resolve(root,dirname(profile.file),config.main));
  }
  while(pending.length) {
    const file=pending.pop();
    if(!existsSync(file)||modules.has(file))continue;
    modules.add(file);
    const source=readFileSync(file,'utf8');
    pending.push(...moduleReferences(root,file,source));
  }
  return new Set([...modules].map(file=>file.slice(root.length+1)));
}

function previewModuleEntries(root,files) {
  const entries=[];
  const directories=new Set(files.filter(file=>file.startsWith('design-preview/')&&/\.(?:js|mjs)$/.test(file)).map(file=>dirname(join(root,file))));
  for(const directory of directories)for(const name of readdirSync(directory).filter(name=>/\.html?$/.test(name))) {
    const html=join(directory,name),source=readFileSync(html,'utf8');
    for(const node of markup(source))if(node.tagName==='script'&&attr(node,'type')==='module') {
      const src=attr(node,'src');
      if(src)entries.push(resolve(directory,src));
      else entries.push(...moduleReferences(root,html,(node.childNodes||[]).map(child=>child.value||'').join('')));
    }
  }
  return entries;
}

function packageModule(root,file) {
  for(let directory=dirname(join(root,file));directory.startsWith(root+'/');directory=dirname(directory)) {
    const manifest=join(directory,'package.json');
    if(existsSync(manifest))return JSON.parse(readFileSync(manifest,'utf8')).type==='module';
  }
  return false;
}

export function staticChecks(root,scope) {
  const files=new Set(scope.files.filter(file=>existsSync(join(root,file)))),navigation=new Set();
  const scriptModes=new Map();
  const moduleFiles=moduleGraph(root,previewModuleEntries(root,scope.files));
  const sourcePages=scope.pages.filter(page=>page.file&&page.sourceExists?.after!==false);
  for(const page of sourcePages)files.add(page.file);
  for(const file of [...files].filter(file=>file.endsWith('.html'))) {
    for(const node of markup(readFileSync(join(root,file),'utf8'))) {
      for(const key of ['src','href']) {
        const target=resourceFile(root,file,attr(node,key),{navigation:key==='href'&&['a','area'].includes(node.tagName)});
        if(target&&/\.(?:js|mjs|css|json)$/.test(target))files.add(target.slice(root.length+1));
      }
      if(node.tagName==='script'&&attr(node,'src')) {
        const type=attr(node,'type')||'';
        if(!['','text/javascript','application/javascript','module'].includes(type))continue;
        const target=resourceFile(root,file,attr(node,'src'));
        if(!target)continue;
        const name=target.slice(root.length+1),modes=scriptModes.get(name)||new Set();
        modes.add(type==='module'?'module':'classic');scriptModes.set(name,modes);
      }
    }
  }
  for(const file of scope.navigationFiles||[])for(const node of markup(readFileSync(join(root,file),'utf8')))if(['a','area'].includes(node.tagName)) {
    const target=navigationURL(file,attr(node,'href'));if(target)navigation.add(target);
  }
  let checked=0;
  for(const file of [...files].sort()) {
    if(/\.html?$/i.test(file))for(const link of checkHtml(root,file))navigation.add(link);
    else if(file.endsWith('.css'))checkCss(root,file);
    else if(/\.(?:js|mjs|cjs)$/.test(file)) {
      const source=readFileSync(join(root,file),'utf8');
      // HTML determines browser script grammar. Worker configurations define
      // module source roots; imported browser modules use .mjs.
      const modes=scriptModes.get(file)||[file.endsWith('.mjs')||file==='website/_worker.js'||moduleFiles.has(file)||packageModule(root,file)?'module':file.endsWith('.cjs')?'commonjs':'classic'];
      for(const mode of modes)syntax(source,file,mode);
    }
    else if(file.endsWith('.json'))syntax(readFileSync(join(root,file),'utf8'),file,'json');
    else if(/\.jsonc$/i.test(file))readJsonc(root,file);
    else if(file.endsWith('.md')) {
      const source=readFileSync(join(root,file),'utf8');
      for(const link of source.matchAll(/\]\(([^)]+)\)/g)) {
        const reference=link[1].replace(/^<|>$/g,'').split('#')[0];
        if(!reference||/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference))continue;
        if(!existsSync(resolve(dirname(join(root,file)),decodeURIComponent(reference))))throw new Error(`${file}: missing document link ${reference}`);
      }
    }
    else continue;
    checked++;
  }
  return {checked,navigation:[...navigation].sort()};
}

export function generatedCheck(root,script,outputs) {
  const temporary=mkdtempSync(join(tmpdir(),'rminte-generated-'));
  try {
    cpSync(join(root,'website'),join(temporary,'website'),{recursive:true});
    execFileSync(process.execPath,[script],{cwd:temporary,encoding:'utf8',stdio:'pipe'});
    for(const file of outputs)if(!readFileSync(join(root,file)).equals(readFileSync(join(temporary,file))))throw new Error(`${file}: stale generated output; run node ${script}`);
    return {outputs:outputs.length};
  } finally {rmSync(temporary,{recursive:true,force:true});}
}
