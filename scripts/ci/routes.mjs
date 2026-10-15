// Source files describe the change; HTTP describes whether a URL still has a page.
export const operationName=(page,language,width)=>`operations ${page.id} ${language} ${width}px`;

export function routeEvidence(sourceExists,response) {
  const {status,location,finalStatus}=response;
  if(status===200)return {kind:'page',status};
  if(sourceExists===false&&[404,410].includes(status))return {kind:'absent',status};
  if([301,302,303,307,308].includes(status)&&location&&finalStatus===200) {
    return sourceExists===false?{kind:'redirect',status,location,finalStatus}:{kind:'page',status:200,redirect:{status,location}};
  }
  throw new Error(`Expected a reachable page${sourceExists===false?' or an HTTP removal/redirect':''}; received HTTP ${status}`);
}

export async function checkNavigation(base,links) {
  const externalRedirects=[];
  for(const path of links) {
    let url=new URL(path,base);const visited=new Set();
    for(;;) {
      if(visited.has(url.href))throw new Error(`Navigation redirect loop: ${path}`);
      visited.add(url.href);
      const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(10000)});
      await response.body?.cancel();
      if(response.status===200)break;
      const location=response.headers.get('location');
      if(![301,302,303,307,308].includes(response.status)||!location)throw new Error(`Internal navigation ${path}: HTTP ${response.status}`);
      url=new URL(location,url);
      if(url.origin!==new URL(base).origin){externalRedirects.push({path,location:url.href});break;}
    }
  }
  return {checked:links.length,externalRedirects};
}
