import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Client as V2Client, StreamableHTTPClientTransport as V2Transport } from '@modelcontextprotocol/client';
import { Client as V1Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport as V1Transport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const endpoint=new URL('http://127.0.0.1:8971/mcp');
const fixture=await readFile(new URL('../tests/questions.json',import.meta.url),'utf8');
const cases=JSON.parse(fixture).cases as {id:string;query:string;language:'zh'|'en';expected_docs:string[];evidence_regex:string|null}[];
const evidence=new URL('../../../docs/knowledge-mcp/evidence/',import.meta.url);await mkdir(evidence,{recursive:true});
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const report={at:new Date().toISOString(),fixtures_sha256:sha(fixture),scope:'Official SDK clients over loopback HTTP to Wrangler local workerd; no models or deployment',runs:[] as unknown[],errors:[] as string[]};
function unpack(r:Record<string,unknown>){assert(Array.isArray(r.content));const item=r.content.find(x=>x.type==='text');assert(item&&typeof item.text==='string');return JSON.parse(item.text);}
try{
 for(const generation of ['modern','legacy']as const){
  const traffic:{method:string;protocol:string|null;name:string|null}[]=[];
  const traced:typeof fetch=async(input,init)=>{const r=new Request(input,init);traffic.push({method:r.method,protocol:r.headers.get('MCP-Protocol-Version'),name:r.headers.get('Mcp-Name')});return fetch(r);};
  const client=generation==='modern'?new V2Client({name:'rminte-local-verifier-v2',version:'0.1.0'},{versionNegotiation:{mode:{pin:'2026-07-28'}}}):new V1Client({name:'rminte-local-verifier-v1',version:'0.1.0'});
  const transport=generation==='modern'?new V2Transport(endpoint,{fetch:traced}):new V1Transport(endpoint,{fetch:traced});
  const checks:unknown[]=[];try{
   if(generation==='modern')await (client as V2Client).connect(transport as V2Transport);else await (client as V1Client).connect(transport as V1Transport);
   const tools=await client.listTools();assert.deepEqual(tools.tools.map(t=>t.name).sort(),['read_section','search_knowledge']);assert(tools.tools.every(t=>t.annotations?.readOnlyHint));
   let revision='';
   for(const q of cases){
    const raw=await client.callTool({name:'search_knowledge',arguments:{query:q.query,language:q.language}});assert(!raw.isError,JSON.stringify(raw));const found=unpack(raw);revision=found.corpus_revision;
    let passed=q.expected_docs.length===0&&found.results.length===0;const hits=[];
    for(const hit of found.results){
     const rawRead=await client.callTool({name:'read_section',arguments:{section_id:hit.section_id,corpus_revision:revision}});assert(!rawRead.isError);const s=unpack(rawRead);
     assert.equal(s.corpus_revision,revision);assert.equal(s.content_hash,sha(s.body));assert.equal(s.context_hash,sha(s.context));assert(s.source_urls.length&&s.source_urls.every((u:string)=>/^https:\/\//.test(u)));assert(s.applicability&&s.evidence_status);
     const body=s.heading_path.join(' / ')+'\n'+s.body+'\n'+s.context;
     if(q.expected_docs.includes(s.doc_id)&&(!q.evidence_regex||new RegExp(q.evidence_regex,'i').test(body)))passed=true;
     hits.push({section_id:s.section_id,doc_id:s.doc_id,content_hash:s.content_hash});
    }
    checks.push({id:q.id,passed,hits});if(!passed)report.errors.push(`${generation}: ${q.id}`);
   }
   for(const [section_id,rev,code]of [['../../website/admin',revision,'SECTION_NOT_FOUND'],['zh/company-brochure-ocr/page-1',revision,'SECTION_NOT_FOUND'],['anything','0'.repeat(64),'CORPUS_CHANGED']]){const r=await client.callTool({name:'read_section',arguments:{section_id,corpus_revision:rev}});assert(r.isError);assert.equal(unpack(r).error.code,code);}
   const invalid=await client.callTool({name:'search_knowledge',arguments:{query:'x',limit:999}});assert(invalid.isError);
   assert(traffic.some(t=>t.protocol===(generation==='modern'?'2026-07-28':'2025-11-25')));
   report.runs.push({generation,server:client.getServerVersion(),revision,tools:tools.tools,checks,traffic});
  }finally{await client.close();}
 }
 for(const [path,status]of [['/health',200],['/connect',404],['/docs/official-knowledge/zh/guide-root.md',404],['/unknown',404]]as const)assert.equal((await fetch(new URL(path,endpoint))).status,status);
 assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:' '.repeat(32769)})).status,413);
 assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:'x'})).status,415);
 for(const method of ['GET','DELETE'])assert.equal((await fetch(endpoint,{method})).status,405);
 assert.equal((await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})})).status,403);
}catch(e){report.errors.push(String(e));}
await writeFile(new URL('protocol-'+Date.now()+'.json',evidence),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({runs:report.runs.length,errors:report.errors}));if(report.errors.length)process.exitCode=1;
