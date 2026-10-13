window.CASE_AUTH = (()=>{
 let user=null;
 // Copy of the authorised-access panel on the cases page (#access). Every string is a zh/en pair that cases.js paints in the visitor's language;
 // the admin console is Chinese only and has no #access, so render() does nothing there.
 const PANEL={
  label:{zh:'授权访问',en:'AUTHORISED ACCESS'},
  hint:{zh:'已有官方分发的账号？登录后可进入获准的演示与下载资料。',en:'Have an account issued by us? Sign in to open the demos and materials you are authorised to use.'},
  signIn:{zh:'授权登录',en:'Sign in'},
  demos:{zh:'查看演示',en:'View demos'},
  downloads:{zh:'下载相关资料',en:'Download materials'},
  on:{zh:'已授权',en:'Authorised'},
  off:{zh:'未授权',en:'Not authorised'},
  admin:{zh:'管理后台',en:'Admin console'},
  signOut:{zh:'退出登录',en:'Sign out'},
  unavailable:{zh:'账号服务暂时不可用',en:'The account service is temporarily unavailable'}
 };
 async function api(path,options={}){
  let response,data;
  try{
   response=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
   data=await response.json();
  }catch{const error=new Error('服务暂时不可用，请稍后重试');error.unavailable=true;if(response)error.status=response.status;throw error;}
  if(!response.ok){const error=new Error(data.error||'操作失败');error.status=response.status;throw error;}return data;
 }
 function node(tag,className,pair){const n=document.createElement(tag);if(className)n.className=className;if(pair){n.textContent=pair.zh;n.dataset.caseText='';n.dataset.zh=pair.zh;n.dataset.en=pair.en;}return n;}
 // problem: the error of a failed call, shown under the panel
 function render(problem){const panel=document.querySelector('#access');if(!panel)return;
  panel.replaceChildren(node('p','k',PANEL.label));
  if(!user){
   const login=node('button','cs-pill ghost',PANEL.signIn);login.type='button';login.dataset.action='login';
   panel.append(node('p','hint',PANEL.hint),login);
  }else{
   const who=node('p','who');who.textContent=user.username;
   const list=node('ul','p');
   [[PANEL.demos,user.can_demo],[PANEL.downloads,user.can_download]].forEach(([label,granted])=>{const item=node('li');if(granted)item.dataset.state='ok';item.append(node('span','',label),node('span','',granted?PANEL.on:PANEL.off));list.append(item);});
   const row=node('div','row');
   if(user.role==='admin'){const link=node('a','cs-pill ghost',PANEL.admin);link.href='/admin/';row.append(link);}
   const out=node('button','txt',PANEL.signOut);out.type='button';out.onclick=async()=>{try{await api('/api/logout',{method:'POST'});user=null;render();window.dispatchEvent(new Event('case-auth-change'));}catch(e){render(e);}};
   row.append(out);panel.append(who,list,row);
  }
  if(problem){const note=problem.unavailable?node('div','cs-msg',PANEL.unavailable):node('div','cs-msg');if(!problem.unavailable)note.textContent=problem.message;panel.append(note);}
  window.dispatchEvent(new Event('case-auth-render'));
 }
 async function refresh(){user=(await api('/api/session')).user;render();return user;}
 async function login(username,password){user=(await api('/api/login',{method:'POST',body:JSON.stringify({username,password})})).user;render();return user;}
 return {api,refresh,login,render,get user(){return user;}};
})();
