import {resources} from '../resources.mjs';
import {caseIds} from '../../../website/assets/case-catalog.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const base=process.env.CASE_TEST_URL||'http://127.0.0.1:8788';
const credentials=await readFile(new URL('../.local/admin-login.txt',import.meta.url),'utf8');
const username=credentials.match(/用户名：(.*)/)[1],password=credentials.match(/密码：(.*)/)[1];
let admin='',user='';const checks=[];
async function call(path,{method='GET',data,cookie='',origin=base}={}){const r=await fetch(base+path,{method,headers:{Origin:origin,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});let body;try{body=await r.json()}catch{body=null}return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};}
function ok(name,condition){assert.ok(condition,name);checks.push(name);}
const previews=Object.entries(resources).filter(([,r])=>r.demoUrl||r.demoPath);
const downloads=Object.entries(resources).filter(([,resource])=>resource.fileKey);
let r=await call('/api/admin/users');ok('unauthenticated admin rejected',r.status===401);
for(const [id] of downloads)ok('anonymous download rejected: '+id,(await call(`/api/resources/${id}/download`)).status===401);
for(const [id] of previews)ok('anonymous preview rejected: '+id,(await call(`/api/resources/${id}/preview`)).status===401);
r=await call('/api/login',{method:'POST',data:{username,password}});ok('admin login',r.status===200&&r.body.user.role==='admin');admin=r.cookie;ok('HttpOnly SameSite session',r.headers.get('set-cookie').includes('HttpOnly')&&r.headers.get('set-cookie').includes('SameSite=Strict'));
r=await call('/api/admin/users',{method:'POST',cookie:admin,origin:'https://other.example',data:{can_demo:true,can_download:false}});ok('cross origin write blocked',r.status===403);
r=await call('/api/admin/users',{method:'POST',cookie:admin,data:{}});ok('account generated',r.status===201);const account=r.body;
try{
 r=await call('/api/admin/users',{cookie:admin});const initial=r.body.users.find(u=>u.id===account.id);ok('new accounts have no case grants',initial.case_ids.length===0);ok('new accounts have no dealer download permission',initial.dealer_download===false);
 r=await call('/api/admin/users/'+account.id+'/cases',{method:'PUT',cookie:admin,data:{dealer_download:false,case_ids:caseIds,version:0}});ok('permissions assigned only after creation',r.status===200);
 ok('username format',/^rminte-[a-z0-9]{10}$/.test(account.username));ok('12 character mixed case alphanumeric password',/^[A-Za-z0-9]{12}$/.test(account.password)&&/[a-z]/.test(account.password)&&/[A-Z]/.test(account.password)&&/\d/.test(account.password));
 r=await call('/api/admin/users/'+account.id+'/password',{cookie:admin});ok('admin can retrieve encrypted password',r.body.password===account.password);
 r=await call('/api/login',{method:'POST',data:{username:account.username,password:account.password}});ok('ordinary login',r.status===200&&r.body.user.case_ids.includes('digital-toll')&&!r.body.user.all_cases);user=r.cookie;
 r=await call('/api/admin/users',{cookie:user});ok('user cannot list credentials',r.status===403);
 r=await call('/api/admin/users/'+account.id,{method:'PATCH',cookie:user,data:{can_demo:true,can_download:true,username:'changed',password:'changed'}});ok('user cannot change account or permissions',r.status===403);
 r=await call('/api/dealer-materials/rm01-product-comparison/download',{cookie:user});ok('case grant does not enable dealer downloads',r.status===403&&r.body.code==='dealer_download_forbidden');
 r=await call('/api/resources/digital-toll/download',{cookie:user});ok('same case download authorized but unavailable',r.status===503);
 r=await call('/api/resources/digital-toll/demo',{cookie:user});ok('authorized registered demo is available',r.status===200);
 for(const [id,res] of Object.entries(resources)){
  if(res.demoPath||res.demoUrl){
   if(id==='ci-website'){const preview=await call(`/api/resources/${id}/preview`,{cookie:admin});ok('fixed website fixture',preview.status===200&&preview.body.kind==='website'&&preview.body.src===res.demoUrl);continue;}
   if(!caseIds.includes(id)){ok('invalid preview configuration fails closed '+id,(await call(`/api/resources/${id}/preview`,{cookie:admin})).status===503);continue;}
   for(const cookie of [user,admin]){
    const preview=await call(`/api/resources/${id}/preview`,{cookie});ok('preview succeeds '+id,preview.status===200);ok('preview private cache '+id,preview.headers.get('cache-control').includes('no-store'));
    ok('fixed preview descriptor '+id,preview.body.kind===(res.demoUrl?'website':'private')&&preview.body.src===(res.demoUrl||`/api/resources/${id}/demo/${res.demoEntry}`));
   }
   if(res.demoPath){const entry=`/api/resources/${id}/demo/${res.demoEntry}`;ok('private entry anonymous denied '+id,(await call(entry)).status===401);const bytes=await fetch(base+entry,{headers:{Cookie:user}});ok('private entry authorized '+id,bytes.status===200&&bytes.headers.get('cache-control').includes('no-store'));await bytes.body.cancel();}
  }
  if(res.fileKey){const download=await fetch(base+`/api/resources/${id}/download`,{headers:{Cookie:user}});ok('authorized download '+id,download.status===200);ok('download private '+id,download.headers.get('cache-control').includes('no-store'));ok('download filename '+id,download.headers.get('content-disposition')===`attachment; filename*=UTF-8''${encodeURIComponent(res.fileName||'document.pdf')}`);ok('download content '+id,Buffer.from(await download.arrayBuffer()).equals(await readFile(new URL('./files/'+res.fileKey,import.meta.url))));}
 }
 for(const id of ['asset-audit','ci-unregistered'])ok('missing preview remains unavailable '+id,(await call(`/api/resources/${id}/preview`,{cookie:admin})).status===503);
 r=await call('/api/admin/users/'+account.id+'/logins',{cookie:admin});ok('login recorded with time and IP fields',r.body.events.length===1&&r.body.events[0].occurred_at&&typeof r.body.events[0].ip==='string'&&'region' in r.body.events[0]);
 r=await call('/api/admin/users/'+account.id+'/cases',{method:'PUT',cookie:admin,data:{dealer_download:false,case_ids:[],version:1}});ok('admin revokes case grant',r.status===200);
 r=await call('/api/session',{cookie:user});ok('permissions change in existing session',r.body.user.case_ids.length===0);
 r=await call('/api/resources/digital-toll/demo',{cookie:user});ok('revoked demo denied',r.status===403);
 r=await call('/api/resources/digital-toll/download',{cookie:user});ok('revocation also denies download',r.status===403);
 for(const [id,res] of Object.entries(resources)){if(res.demoPath||res.demoUrl)ok('revoked preview '+id,(await call(`/api/resources/${id}/preview`,{cookie:user})).status===403);if(res.demoPath)ok('revoked bytes '+id,(await call(`/api/resources/${id}/demo/${res.demoEntry}`,{cookie:user})).status===403);if(res.fileKey)ok('revoked download '+id,(await call(`/api/resources/${id}/download`,{cookie:user})).status===403);}
 r=await call('/api/resources/digital-toll/demo',{cookie:admin});ok('admin bypasses user permission switches',r.status===200);
 r=await call('/api/applications',{method:'POST',data:{name:'本地验收',company:'测试申请（非真实合作）',email:'qa@example.com',message:'<script>alert(1)</script> 测试合作信息',experience:'仅用于本地收件箱验证'}});ok('software application saved',r.status===201);
 r=await call('/api/admin/inbox',{cookie:user});ok('inbox private to admin',r.status===403);
 r=await call('/api/admin/inbox',{cookie:admin});const message=r.body.messages.find(x=>x.email==='qa@example.com');ok('application in admin inbox',message&&message.kind==='software'&&message.message.includes('<script>'));
 r=await call('/api/admin/inbox/'+message.id,{method:'PATCH',cookie:admin});ok('mark message read',r.status===200);

 // Owner delegation and server-side target boundaries.
 const owner=(await call('/api/session',{cookie:admin})).body.user;ok('owner identity',owner.is_owner);
 r=await call('/api/admin/admins',{method:'POST',cookie:admin,data:{label:'Local test'}});ok('owner creates admin',r.status===201);const delegated=r.body;
 let login=await call('/api/login',{method:'POST',data:{username:delegated.username,password:delegated.password}}),dc=login.cookie;
 ok('new administrator must change password',login.body.user.must_change_password);
 for(const path of ['/api/admin/users','/api/admin/inbox','/api/resources/digital-toll/demo','/api/admin/admins'])ok('initial session denied '+path,(await call(path,{cookie:dc})).status===403);
 const next='Changed-Local-Password-'+crypto.randomUUID();
 ok('initial password changed',(await call('/api/admin/password',{method:'POST',cookie:dc,data:{current_password:delegated.password,new_password:next}})).status===200);
 ok('initial session revoked',(await call('/api/admin/users',{cookie:dc})).status===401);
 login=await call('/api/login',{method:'POST',data:{username:delegated.username,password:next}});dc=login.cookie;
 ok('delegated admin lists every user',(await call('/api/admin/users',{cookie:dc})).body.users.some(u=>u.id===account.id));
 ok('delegated admin reads user password',(await call('/api/admin/users/'+account.id+'/password',{cookie:dc})).status===200);
 ok('delegated admin cannot list admins',(await call('/api/admin/admins',{cookie:dc})).status===403);
 ok('delegated admin cannot create admins',(await call('/api/admin/admins',{method:'POST',cookie:dc,data:{}})).status===403);
 for(const id of [owner.id,delegated.id]){
  ok('admin target excluded from user deletion '+id,(await call('/api/admin/users/'+id,{method:'DELETE',cookie:dc})).status===404);
  ok('admin password cannot be fetched '+id,(await call('/api/admin/users/'+id+'/password',{cookie:dc})).status===404);
  ok('delegated admin cannot change admin status '+id,(await call('/api/admin/admins/'+id,{method:'PATCH',cookie:dc,data:{enabled:false}})).status===403);
 }
 ok('owner cannot disable self',(await call('/api/admin/admins/'+owner.id,{method:'PATCH',cookie:admin,data:{enabled:false}})).status===404);
 ok('role injection rejected',(await call('/api/admin/users',{method:'POST',cookie:dc,data:{role:'admin'}})).status===400);
 ok('owner injection rejected',(await call('/api/admin/admins',{method:'POST',cookie:admin,data:{is_owner:true}})).status===400);
 ok('invalid case rejected',(await call('/api/admin/users/'+account.id+'/cases',{method:'PUT',cookie:dc,data:{dealer_download:false,case_ids:['unknown'],version:2}})).status===400);
 const attempts=await Promise.all(['digital-toll','asset-audit'].map(id=>call('/api/admin/users/'+account.id+'/cases',{method:'PUT',cookie:dc,data:{dealer_download:false,case_ids:[id],version:2}})));
 ok('concurrent grant update has one winner',attempts.filter(r=>r.status===200).length===1&&attempts.filter(r=>r.status===409).length===1);
 const grants=(await call('/api/admin/users/'+account.id+'/cases',{cookie:dc})).body;
 ok('conflict does not mix grants',grants.case_ids.length===1&&grants.version===3);
 const allowed=grants.case_ids[0],denied=allowed==='digital-toll'?'asset-audit':'digital-toll';
 for(const kind of ['demo','download']){
  ok('allowed resource status '+kind,(await call('/api/resources/'+allowed+'/'+kind,{cookie:user})).status===(kind==='demo'?resources[allowed]?.demoPath?200:503:resources[allowed]?.fileKey?200:503));
  ok('other case denied '+kind,(await call('/api/resources/'+denied+'/'+kind,{cookie:user})).status===403);
  ok('HEAD denied '+kind,(await call('/api/resources/'+denied+'/'+kind,{method:'HEAD',cookie:user})).status===403);
 }
 ok('demo subpath denied',(await call('/api/resources/'+denied+'/demo/private.js',{cookie:user})).status===403);
 const dealerPath='/api/dealer-materials/rm01-product-comparison/download';
 const dealerPdf=Buffer.from('%PDF-1.7\nSynthetic dealer protocol fixture\n%%EOF');
 const uploadDealer=await fetch(base+'/api/admin/dealer-materials/rm01-product-comparison',{method:'PUT',headers:{Origin:base,Cookie:dc,'Content-Type':'application/pdf'},body:dealerPdf});ok('delegate uploads dealer PDF',uploadDealer.status===200);await uploadDealer.body.cancel();
 ok('delegate grants dealer downloads',(await call('/api/admin/users/'+account.id+'/cases',{method:'PUT',cookie:dc,data:{case_ids:grants.case_ids,dealer_download:true,version:3}})).status===200);
 const dealerResponse=await fetch(base+dealerPath,{headers:{Cookie:user}});ok('dealer download succeeds in an existing session',dealerResponse.status===200);ok('dealer download matches uploaded bytes',Buffer.from(await dealerResponse.arrayBuffer()).equals(dealerPdf));ok('dealer download is private',dealerResponse.headers.get('cache-control').includes('no-store'));
 const dealerHead=await fetch(base+dealerPath,{method:'HEAD',headers:{Cookie:user}});ok('dealer HEAD size and empty body',dealerHead.status===200&&dealerHead.headers.get('content-length')===String(dealerPdf.length)&&(await dealerHead.text())==='');
 ok('delegate revokes dealer downloads',(await call('/api/admin/users/'+account.id+'/cases',{method:'PUT',cookie:dc,data:{case_ids:grants.case_ids,dealer_download:false,version:4}})).status===200);
 const deniedDealer=await call(dealerPath,{cookie:user});ok('revoked dealer download explicitly denied',deniedDealer.status===403&&deniedDealer.body.code==='dealer_download_forbidden');
 ok('revoked dealer HEAD denied',(await call(dealerPath,{method:'HEAD',cookie:user})).status===403);
 ok('dealer revocation preserves case grant',(await call('/api/admin/users/'+account.id+'/cases',{cookie:admin})).body.case_ids[0]===allowed);
 ok('owner disables delegate',(await call('/api/admin/admins/'+delegated.id,{method:'PATCH',cookie:admin,data:{enabled:false}})).status===200);
 ok('disabled session denied',(await call('/api/admin/users',{cookie:dc})).status===401);
 ok('disabled login denied',(await call('/api/login',{method:'POST',data:{username:delegated.username,password:next}})).status===401);
 ok('owner re-enables delegate',(await call('/api/admin/admins/'+delegated.id,{method:'PATCH',cookie:admin,data:{enabled:true}})).status===200);
 ok('old session stays dead',(await call('/api/admin/users',{cookie:dc})).status===401);
 ok('new login allowed',(await call('/api/login',{method:'POST',data:{username:delegated.username,password:next}})).status===200);
 const adminList=(await call('/api/admin/admins',{cookie:admin})).body.admins;
 ok('no credentials in administrator list',adminList.every(a=>!('password' in a)&&!('password_mac' in a)&&!('password_cipher' in a)));
 r=await call('/api/admin/users/'+account.id,{method:'DELETE',cookie:admin});ok('delete account',r.status===200);
 r=await call('/api/session',{cookie:user});ok('deletion invalidates existing login',r.body.user===null);
 r=await call('/api/login',{method:'POST',data:{username:account.username,password:account.password}});ok('deleted credentials rejected',r.status===401);
 r=await call('/api/logout',{method:'POST',cookie:admin});ok('logout',r.status===200);
 r=await call('/api/admin/users',{cookie:admin});ok('logout revokes session',r.status===401);
 if(process.env.RMINTE_MISSING_DEMO_URL){
  const missingBase=process.env.RMINTE_MISSING_DEMO_URL;
  const auth=await readFile(process.env.RMINTE_MISSING_DEMO_RUNTIME+'/services/case-access/.local/admin-login.txt','utf8');
  const login=await fetch(missingBase+'/api/login',{method:'POST',headers:{Origin:missingBase,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:auth.match(/密码：(.*)/)[1]})});
  ok('missing-binding runtime login',login.status===200);const cookie=login.headers.get('set-cookie').split(';')[0];await login.body.cancel();
  for(const [id,expected] of [['industrial-modeling',503],['ci-website',200]]){
   const response=await fetch(missingBase+`/api/resources/${id}/preview`,{headers:{Cookie:cookie}});
   ok('no private binding: '+id,response.status===expected);await response.body.cancel();
  }
 }
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await call('/api/admin/users/'+account.id,{method:'DELETE',cookie:admin});}
