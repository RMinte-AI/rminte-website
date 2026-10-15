import {existsSync,readFileSync,statSync,mkdtempSync,rmSync,cpSync} from 'node:fs';
import {dirname,resolve,extname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {parse} from 'parse5';
import postcss from 'postcss';
import {readJsonc} from './config.mjs';
import {origin} from '../../website/scripts/seo.mjs';

export function markup(source) {
  const elements=[];
  function visit(node) {if(node.tagName) elements.push(node);for(const child of node.childNodes||[])visit(child);if(node.content)visit(node.content);}
  visit(parse(source));return elements;
}
const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value;
function navigationURL(file,reference) {
  if(!reference||reference.startsWith('#'))return null;
  const url=new URL(reference,new URL('/'+file.replace(/^website\//,''),'https://ci.invalid'));
  if(!['https://ci.invalid',origin].includes(url.origin))return null;
  return url.pathname.startsWith('/api/')?null:url.pathname+url.search;
}

export function resourceFile(root,from,reference,{navigation=false}={}) {
  if(!reference||/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) return null;
  const url=new URL(reference,new URL('/'+from.replace(/^website\//,''),'https://ci.invalid'));
  if(url.pathname==='/visitor-language.js'||url.pathname.startsWith('/api/')) return null;
  let file=resolve(root,'website','.'+decodeURIComponent(url.pathname));
  if(file!==resolve(root,'website')&&!file.startsWith(resolve(root,'website')+'/')) throw new Error(`${from}: reference outside website: ${reference}`);
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)&&!extname(file))file+='.html';
  if(!existsSync(file)) {
    if(navigation&&(!extname(file)||/\.html?$/i.test(file)))return null;
    throw new Error(`${from}: missing local resource ${reference}`);
  }
  return file;
}

export function syntax(source,file,type='classic') {
  if(type==='json'){JSON.parse(source);return;}
  try {execFileSync(process.execPath,['--check',`--input-type=${type==='module'?'module':'commonjs'}`],{input:source,encoding:'utf8',stdio:['pipe','pipe','pipe']});}
  catch(e){throw new Error(`${file}: ${e.stderr||e.message}`);}
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

export function staticChecks(root,scope) {
  const files=new Set(scope.files.filter(file=>existsSync(join(root,file)))),navigation=new Set();
  for(const page of scope.pages.filter(page=>page.sourceExists?.after!==false))files.add(page.file);
  for(const page of scope.pages.filter(page=>page.sourceExists?.after!==false)) {
    for(const node of markup(readFileSync(join(root,page.file),'utf8'))) {
      for(const key of ['src','href']) {
        const target=resourceFile(root,page.file,attr(node,key),{navigation:key==='href'&&['a','area'].includes(node.tagName)});
        if(target&&/\.(?:js|mjs|css|json)$/.test(target))files.add(target.slice(root.length+1));
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
      syntax(source,file,file.endsWith('.mjs')||/^(?:import|export)\s/m.test(source)?'module':'classic');
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
