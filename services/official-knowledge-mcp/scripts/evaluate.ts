import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createKnowledge } from '../src/knowledge.ts';
import type { Corpus } from '../src/types.ts';
const corpus=JSON.parse(await readFile(new URL('../.generated/corpus.json',import.meta.url),'utf8')) as Corpus;
const fixture=await readFile(new URL('../tests/questions.json',import.meta.url),'utf8');
const cases=JSON.parse(fixture).cases as {id:string;query:string;language:'zh'|'en';expected_docs:string[];evidence_regex:string|null}[];
const kb=createKnowledge(corpus);const results=cases.map(q=>{
 const r=kb.search(q);let match=false;const reads=[];
 for(const hit of r.results){
  const section=kb.read(hit.section_id,r.corpus_revision);reads.push({doc:hit.doc_id,heading:hit.heading_path.join(' / '),score:hit.score});
  if(q.expected_docs.includes(hit.doc_id)&&(!q.evidence_regex||new RegExp(q.evidence_regex,'i').test(section.heading_path.join(' / ')+'\n'+section.body+'\n'+section.context)))match=true;
 }
 const passed=q.expected_docs.length?match:r.results.length===0;
 return{...q,passed,results:reads};
});
const report={at:new Date().toISOString(),scope:'offline retrieval; no models, SDK clients or network used',corpus_revision:corpus.revision,fixtures_sha256:createHash('sha256').update(fixture).digest('hex'),passed:results.filter(x=>x.passed).length,total:results.length,results};
const evidence=new URL('../../../docs/knowledge-mcp/evidence/',import.meta.url);await mkdir(evidence,{recursive:true});await writeFile(new URL('retrieval-'+Date.now()+'.json',evidence),JSON.stringify(report,null,2)+'\n');
console.log(`${report.passed}/${report.total}`);for(const r of results.filter(x=>!x.passed))console.log(JSON.stringify(r));if(report.passed!==report.total)process.exitCode=1;
