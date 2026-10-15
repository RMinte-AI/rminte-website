import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resources} from '../resources.mjs';
const base='http://127.0.0.1:8788';
const credentials=await readFile(new URL('../.local/admin-login.txt',import.meta.url),'utf8');
const username=credentials.match(/用户名：(.*)/)[1],password=credentials.match(/密码：(.*)/)[1];
let admin='',user='';const checks=[];
async function call(path,{method='GET',data,cookie='',origin=base}={}){const r=await fetch(base+path,{method,headers:{Origin:origin,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined});let body;try{body=await r.json()}catch{body=null}return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};}
function ok(name,condition){assert.ok(condition,name);checks.push(name);}
const downloads=Object.entries(resources).filter(([,resource])=>resource.fileKey);
let r=await call('/api/admin/users');ok('unauthenticated admin rejected',r.status===401);
for(const [id] of downloads)ok('anonymous download rejected: '+id,(await call(`/api/resources/${id}/download`)).status===401);
r=await call('/api/login',{method:'POST',data:{username,password}});ok('admin login',r.status===200&&r.body.user.role==='admin');admin=r.cookie;ok('HttpOnly SameSite session',r.headers.get('set-cookie').includes('HttpOnly')&&r.headers.get('set-cookie').includes('SameSite=Strict'));
r=await call('/api/admin/users',{method:'POST',cookie:admin,origin:'https://other.example',data:{can_demo:true,can_download:false}});ok('cross origin write blocked',r.status===403);
r=await call('/api/admin/users',{method:'POST',cookie:admin,data:{can_demo:true,can_download:false}});ok('account generated',r.status===201);const account=r.body;
try{
 r=await call('/api/admin/users',{cookie:admin});const initial=r.body.users.find(u=>u.id===account.id);ok('new accounts ignore creation-time permission grants',!initial.can_demo&&!initial.can_download);
 r=await call('/api/admin/users/'+account.id,{method:'PATCH',cookie:admin,data:{can_demo:true,can_download:false}});ok('permissions assigned only after creation',r.status===200);
 ok('username format',/^rminte-[a-z0-9]{10}$/.test(account.username));ok('12 character mixed case alphanumeric password',/^[A-Za-z0-9]{12}$/.test(account.password)&&/[a-z]/.test(account.password)&&/[A-Z]/.test(account.password)&&/\d/.test(account.password));
 r=await call('/api/admin/users/'+account.id+'/password',{cookie:admin});ok('admin can retrieve encrypted password',r.body.password===account.password);
 r=await call('/api/login',{method:'POST',data:{username:account.username,password:account.password}});ok('ordinary login',r.status===200&&r.body.user.can_demo&&!r.body.user.can_download);user=r.cookie;
 r=await call('/api/admin/users',{cookie:user});ok('user cannot list credentials',r.status===403);
 r=await call('/api/admin/users/'+account.id,{method:'PATCH',cookie:user,data:{can_demo:true,can_download:true,username:'changed',password:'changed'}});ok('user cannot change account or permissions',r.status===403);
 r=await call('/api/resources/ci-unregistered/download',{cookie:user});ok('download denied independently',r.status===403);
 for(const [id] of downloads)ok('registered download denied independently: '+id,(await call(`/api/resources/${id}/download`,{cookie:user})).status===403);
 r=await call('/api/resources/ci-unregistered/demo',{cookie:user});ok('authorized but missing demo explicitly unavailable',r.status===503);
 r=await call('/api/admin/users/'+account.id+'/logins',{cookie:admin});ok('login recorded with time and IP fields',r.body.events.length===1&&r.body.events[0].occurred_at&&typeof r.body.events[0].ip==='string'&&'region' in r.body.events[0]);
 r=await call('/api/admin/users/'+account.id,{method:'PATCH',cookie:admin,data:{can_demo:false,can_download:true}});ok('admin updates two permissions',r.status===200);
 r=await call('/api/session',{cookie:user});ok('permissions change in existing session',!r.body.user.can_demo&&r.body.user.can_download);
 r=await call('/api/resources/ci-unregistered/demo',{cookie:user});ok('revoked demo denied',r.status===403);
 r=await call('/api/resources/ci-unregistered/download',{cookie:user});ok('authorized missing download explicit',r.status===503);
 for(const [id,resource] of downloads){
  const file=await fetch(`${base}/api/resources/${id}/download`,{headers:{Cookie:user}});
  ok(`registered download succeeds: ${id} (HTTP ${file.status})`,file.status===200);
  const expected=await readFile(new URL('./files/'+resource.fileKey.split('/').map(encodeURIComponent).join('/'),import.meta.url));
  ok('registered download contains the correct local object: '+id,Buffer.from(await file.arrayBuffer()).equals(expected));
  ok('registered download names the file: '+id,file.headers.get('content-disposition')===`attachment; filename*=UTF-8''${encodeURIComponent(resource.fileName||'document.pdf')}`);
  ok('registered download is private: '+id,file.headers.get('cache-control')?.includes('no-store'));
 }
 if(downloads.length){
  await call('/api/admin/users/'+account.id,{method:'PATCH',cookie:admin,data:{can_demo:false,can_download:false}});
  for(const [id] of downloads)ok('registered download revoked: '+id,(await call(`/api/resources/${id}/download`,{cookie:user})).status===403);
 }
 r=await call('/api/resources/ci-unregistered/demo',{cookie:admin});ok('admin bypasses user permission switches',r.status===503);
 r=await call('/api/applications',{method:'POST',data:{name:'本地验收',company:'测试申请（非真实合作）',email:'qa@example.com',message:'<script>alert(1)</script> 测试合作信息',experience:'仅用于本地收件箱验证'}});ok('software application saved',r.status===201);
 r=await call('/api/admin/inbox',{cookie:user});ok('inbox private to admin',r.status===403);
 r=await call('/api/admin/inbox',{cookie:admin});const message=r.body.messages.find(x=>x.email==='qa@example.com');ok('application in admin inbox',message&&message.kind==='software'&&message.message.includes('<script>'));
 r=await call('/api/admin/inbox/'+message.id,{method:'PATCH',cookie:admin});ok('mark message read',r.status===200);
 r=await call('/api/admin/users/'+account.id,{method:'DELETE',cookie:admin});ok('delete account',r.status===200);
 r=await call('/api/session',{cookie:user});ok('deletion invalidates existing login',r.body.user===null);
 r=await call('/api/login',{method:'POST',data:{username:account.username,password:account.password}});ok('deleted credentials rejected',r.status===401);
 r=await call('/api/logout',{method:'POST',cookie:admin});ok('logout',r.status===200);
 r=await call('/api/admin/users',{cookie:admin});ok('logout revokes session',r.status===401);
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await call('/api/admin/users/'+account.id,{method:'DELETE',cookie:admin});}
