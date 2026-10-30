import { createMcpHandler } from 'agents/mcp/server';
import data from '../.generated/corpus.json';
import type { Corpus } from './types.ts';
import { createServer } from './server.ts';
const corpus=data as unknown as Corpus;
const handler=createMcpHandler(()=>createServer(corpus),{route:'/mcp',legacy:'stateless',allowedHostnames:['mcp.rminte.com','127.0.0.1','localhost'],allowedOriginHostnames:['mcp.rminte.com','rminte.com','www.rminte.com','localhost','127.0.0.1'],corsOptions:false});
export default {
 async fetch(request:Request):Promise<Response>{
  const path=new URL(request.url).pathname;
  if(path==='/health'&&request.method==='GET')return Response.json({service:'rminte-official-knowledge',version:'0.1.0',corpus_revision:corpus.revision});
  if(path!=='/mcp')return new Response('Not found',{status:404});
  try{
   if(request.method==='POST'){
    if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return new Response('JSON required',{status:415});
    const reader=request.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
    if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return new Response('Request too large',{status:413});}chunks.push(value);}
    const body=new Uint8Array(size);let offset=0;for(const b of chunks){body.set(b,offset);offset+=b.length;}
    request=new Request(request.url,{method:request.method,headers:request.headers,body});
   }
   return await handler.fetch(request);
  }catch{return Response.json({error:'Internal service error'},{status:500});}
 }
};
