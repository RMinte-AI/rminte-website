// One HTTP observation is shared by navigation checks, browser checks and the evidence report.
export const operationName=(page,language,width)=>`operations ${page.id} ${language} ${width}px`;
export const operationLanguages=(page,languages)=>languages.filter(language=>(!page.languages||page.languages.includes(language))&&(page.generic||['zh','en'].includes(language)));
const redirects=new Set([301,302,303,307,308]);

export function routeEvidence(expected,response,phase='after') {
  const {status,location,finalStatus,external}=response;
  if(phase==='after'&&expected===false&&status===200)throw new Error('Undeclared HTML page is still reachable; retain its Worker page declaration.');
  if(status===200)return {kind:'page',status};
  if(expected===false&&[404,410].includes(status))return {kind:'absent',status};
  if(redirects.has(status)&&location&&(external||finalStatus===200)) {
    return {kind:external||expected===false?'redirect':'page',status,location,...(external?{external:true}:{finalStatus})};
  }
  throw new Error(`Expected a reachable page${expected===false?' or an HTTP removal/redirect':''}; received HTTP ${status}`);
}

export async function observeRoute(url,request) {
  let target=new URL(url),first;
  const origin=target.origin,visited=new Set();
  for(;;) {
    if(visited.has(target.href)||visited.size>=20)throw new Error(`Navigation redirect loop or limit: ${url}`);
    visited.add(target.href);
    const response=await request(target.href);
    first ||= response;
    if(!redirects.has(response.status)||!response.location)return {...first,finalStatus:response.status,finalURL:target.href,contentType:response.contentType};
    const next=new URL(response.location,target);
    if(!['http:','https:'].includes(next.protocol))throw new Error(`Unsupported redirect protocol: ${next.protocol}`);
    if(next.origin!==origin)return {status:first.status,location:next.href,external:true};
    if(first===response)first={status:response.status,location:next.href};
    target=next;
  }
}

export async function checkNavigation(base,links,pagePaths) {
  const externalRedirects=[];
  for(const path of links) {
    const observed=await observeRoute(new URL(path,base),async url=>{
      const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(10000)}),contentType=response.headers.get('content-type');
      await response.body?.cancel();
      return {status:response.status,location:response.headers.get('location'),contentType};
    });
    routeEvidence(true,observed);
    if(observed.external)externalRedirects.push({path,location:observed.location});
    else if(/\btext\/html\b/i.test(observed.contentType)&&!pagePaths.includes(new URL(observed.finalURL).pathname))throw new Error(`HTML navigation ${path} has no page declaration; register Worker HTML in tests/browser/worker-pages.json.`);
  }
  return {checked:links.length,externalRedirects};
}
