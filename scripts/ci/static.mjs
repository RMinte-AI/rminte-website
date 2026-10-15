import {existsSync,readFileSync,statSync,mkdtempSync,rmSync,cpSync} from 'node:fs';
import {dirname,resolve,extname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {parse} from 'parse5';
import postcss from 'postcss';
import {pages} from './scope.mjs';

export function markup(source) {
  const elements=[];
  function visit(node) {if(node.tagName) elements.push(node);for(const child of node.childNodes||[])visit(child);if(node.content)visit(node.content);}
  visit(parse(source));return elements;
}
const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value;

export function resourceFile(root,from,reference) {
  if(!reference||/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) return null;
  // Private demos have their own asset root; they are not public website files.
  const prefix=from.startsWith('services/case-demos/assets/')?'services/case-demos/assets/':'website/';
  const assetRoot=resolve(root,prefix);
  const url=new URL(reference,new URL('/'+from.slice(prefix.length),'https://ci.invalid'));
  if(url.pathname==='/visitor-language.js'||url.pathname.startsWith('/api/')) return null;
  let file=resolve(assetRoot,'.'+decodeURIComponent(url.pathname));
  if(file!==assetRoot&&!file.startsWith(assetRoot+'/')) throw new Error(`${from}: reference outside asset root: ${reference}`);
  if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html');
  if(!existsSync(file)&&!extname(file))file+='.html';
  if(!existsSync(file))throw new Error(`${from}: missing local resource ${reference}`);
  return file;
}

export function syntax(source,file,type='classic') {
  if(type==='json'){JSON.parse(source);return;}
  try {execFileSync(process.execPath,['--check',`--input-type=${type==='module'?'module':'commonjs'}`],{input:source,encoding:'utf8',stdio:['pipe','pipe','pipe']});}
  catch(e){throw new Error(`${file}: ${e.stderr||e.message}`);}
}

export function checkHtml(root,file) {
  const source=readFileSync(join(root,file),'utf8');
  for(const node of markup(source)) {
    for(const key of ['src','href','poster'])resourceFile(root,file,attr(node,key));
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
}

export function checkCss(root,file) {
  const css=readFileSync(join(root,file),'utf8');postcss.parse(css,{from:file});
  for(const match of css.matchAll(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g))resourceFile(root,file,match[2]);
}

export function staticChecks(root,scope) {
  const files=new Set(scope.files.filter(file=>existsSync(join(root,file))));
  for(const page of scope.pages)files.add(page.file);
  for(const page of scope.pages) {
    for(const node of markup(readFileSync(join(root,page.file),'utf8'))) {
      for(const key of ['src','href']) {
        const target=resourceFile(root,page.file,attr(node,key));
        if(target&&/\.(?:js|mjs|css|json)$/.test(target))files.add(target.slice(root.length+1));
      }
    }
  }
  let checked=0;
  for(const file of [...files].sort()) {
    if(file.endsWith('.html'))checkHtml(root,file);
    else if(file.endsWith('.css'))checkCss(root,file);
    else if(/\.(?:js|mjs|cjs)$/.test(file)) {
      const source=readFileSync(join(root,file),'utf8');
      syntax(source,file,file.endsWith('.mjs')||/^(?:import|export)\s/m.test(source)?'module':'classic');
    }
    else if(file.endsWith('.json'))syntax(readFileSync(join(root,file),'utf8'),file,'json');
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
  return {checked};
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
