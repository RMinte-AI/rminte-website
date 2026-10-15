import {readFileSync,existsSync,statSync} from 'node:fs';
import {join,posix} from 'node:path';

export const workerPageManifest='tests/browser/worker-pages.json';

export function htmlPage(file) {
  const path='/'+file.slice('website/'.length).replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'').split('/').map(encodeURIComponent).join('/');
  return {id:'route-'+encodeURIComponent(file.slice('website/'.length)),path,file,regions:['body'],generic:true};
}

// A Worker can compute arbitrary URLs: its HTML entry points and their inputs must be declared.
export function workerPages(source) {
  const entries=JSON.parse(source),seen=new Set();
  if(!Array.isArray(entries))throw new Error(`${workerPageManifest}: expected an array of HTML routes`);
  return entries.map(entry=>{
    const url=new URL(entry.path,'http://ci.invalid');
    if(!entry.path.startsWith('/')||url.origin!=='http://ci.invalid'||url.pathname!==entry.path||url.search||url.hash||seen.has(entry.path))throw new Error(`${workerPageManifest}: invalid or duplicate route ${entry.path}`);
    if(!Array.isArray(entry.dependencies)||!entry.dependencies.length||entry.dependencies.some(file=>typeof file!=='string'||!file||posix.isAbsolute(file)||posix.normalize(file)!==file||file.split('/').some(part=>part==='.'||part==='..')))throw new Error(`${workerPageManifest}: ${entry.path} needs canonical repository-relative dependencies`);
    seen.add(entry.path);
    return {id:'worker-'+encodeURIComponent(entry.path),path:entry.path,file:null,regions:['body'],generic:true,dependencies:entry.dependencies};
  });
}

export function readWorkerPages(root) {
  const file=join(root,workerPageManifest);
  const pages=workerPages(existsSync(file)?readFileSync(file,'utf8'):'[]');
  for(const page of pages)for(const dependency of page.dependencies) {
    const input=join(root,dependency);
    if(!existsSync(input))throw new Error(`${workerPageManifest}: ${page.path} refers to missing input ${dependency}`);
    if(statSync(input).isDirectory()&&!dependency.endsWith('/'))throw new Error(`${workerPageManifest}: directory input ${dependency} must end with /`);
  }
  return pages;
}
