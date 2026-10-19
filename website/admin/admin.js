const $=s=>document.querySelector(s),api=CASE_AUTH.api;
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let usersOffset=0,inboxOffset=0,historyOffset=0,historyId=null,users=[],newAccount=null;
const ago=t=>{if(!t)return '从未登录';const s=Date.now()/1000-t;return s<60?'刚刚登录':s<3600?`${Math.floor(s/60)} 分钟前登录`:s<86400?`${Math.floor(s/3600)} 小时前登录`:`${Math.floor(s/86400)} 天前登录`;};
const date=t=>new Date(t*1000).toLocaleString('zh-CN',{hour12:false});
const region=e=>[e.country,e.region,e.city].filter(Boolean).join(' / ')||'地区未知';
// Results and errors come up as a toast at the bottom left and go after a few seconds
let toastTimer;
function toast(label,text){const live=$('#toasts'),box=document.createElement('div'),tag=document.createElement('b');box.className='ad-toast';tag.textContent=label;box.append(tag,text);live.replaceChildren(box);clearTimeout(toastTimer);toastTimer=setTimeout(()=>live.replaceChildren(),5000);}
// A hint box under a form: the label is optional
function say(slot,text,label){const box=document.createElement('div');box.className='cs-msg';if(label){const tag=document.createElement('b');tag.textContent=label;box.append(tag);}box.append(text);slot.replaceChildren(box);}
function report(error){toast('未能完成',error.message||String(error));if(error.status===401)showLogin();}
const accountControls=['#account-who','#change-password','#logout'];
function showAdmin(user){$('#account-who').textContent=`${user.username} · 管理员`;accountControls.forEach(s=>$(s).hidden=false);$('#admin-panel').hidden=false;$('#login-panel').hidden=true;}
function showLogin(){for(const d of ['#password-dialog','#history'])if($(d).open)$(d).close();users=[];$('#users').replaceChildren();$('#messages').replaceChildren();$('#new-account').replaceChildren();$('#new-account').hidden=true;newAccount=null;accountControls.forEach(s=>$(s).hidden=true);$('#unread').hidden=true;$('#admin-panel').hidden=true;$('#login-panel').hidden=false;}
async function init(){try{const user=await CASE_AUTH.refresh();if(user?.role==='admin'){showAdmin(user);await loadUsers();loadInbox();}else{showLogin();if(user)say($('#login-message'),'当前账号不是管理员。你仍可前往案例页使用已授权的功能。');}}catch(e){showLogin();say($('#login-message'),e.message,'未能登录');}}
$('#admin-login').onsubmit=async e=>{e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;try{await CASE_AUTH.login(form.username.value,form.password.value);form.reset();$('#login-message').replaceChildren();await init();}catch(e){say($('#login-message'),e.message,'未能登录');}finally{b.disabled=false;}};
$('#logout').onclick=async()=>{try{await CASE_AUTH.logout();await init();}catch(e){report(e);}};
async function loadUsers(){
 try{const data=await api(`/api/admin/users?offset=${usersOffset}`);users=data.users;
 $('#users').innerHTML=users.length?users.map(u=>`<tr data-id="${u.id}"><td data-label="账号 / 密码"><span class="u">${escapeHtml(u.username)}</span><div class="ad-pw"><code data-password>••••••••••••</code><button class="ad-btn" type="button" data-show>查看密码</button><button class="ad-btn" type="button" data-copy>复制账号密码</button></div></td><td data-label="访问权限"><label class="ad-check"><input type="checkbox" data-permission="can_demo" ${u.can_demo?'checked':''}>查看演示</label><label class="ad-check"><input type="checkbox" data-permission="can_download" ${u.can_download?'checked':''}>下载相关资料</label></td><td data-label="最近登录"><span data-time="${u.occurred_at||''}">${ago(u.occurred_at)}</span><span class="s">${u.occurred_at?date(u.occurred_at):''}</span></td><td data-label="IP / 地区">${escapeHtml(u.ip||'—')}<span class="s">${escapeHtml(u.occurred_at?region(u):'—')}</span></td><td data-label="操作"><div class="ad-ops"><button class="ad-btn" type="button" data-history>登录记录</button><button class="ad-btn danger" type="button" data-delete>删除</button></div></td></tr>`).join(''):'<tr><td colspan="5">尚未分发账号。</td></tr>';
 $('#users-prev').disabled=usersOffset===0;$('#users-next').disabled=!data.more;$('#users-page').textContent=`第 ${usersOffset/50+1} 页`;
 }catch(e){report(e);}
}
$('#create-user').onsubmit=async e=>{e.preventDefault();const form=e.target,b=form.querySelector('button');b.disabled=true;try{const data=await api('/api/admin/users',{method:'POST',body:JSON.stringify({})});newAccount=data;const box=$('#new-account');box.hidden=false;box.innerHTML=`<p class="k">账号已生成</p><dl><dt>用户名</dt><dd>${escapeHtml(data.username)}</dd><dt>密码</dt><dd>${escapeHtml(data.password)}</dd></dl><div class="row"><button class="ad-btn" type="button" data-copy-new>复制账号密码</button></div><p class="ad-note">请在下方列表中设置演示和下载权限。</p>`;usersOffset=0;await loadUsers();}catch(e){report(e);}finally{b.disabled=false;}};
$('#new-account').addEventListener('click',async e=>{if(!e.target.closest('[data-copy-new]')||!newAccount)return;try{await navigator.clipboard.writeText(`用户名：${newAccount.username}\n密码：${newAccount.password}`);toast('已复制','账号密码已复制。');}catch(error){report(error);}});
$('#users').addEventListener('change',async e=>{if(!e.target.matches('[data-permission]'))return;const row=e.target.closest('tr'),boxes=[...row.querySelectorAll('[data-permission]')];boxes.forEach(b=>b.disabled=true);try{await api('/api/admin/users/'+row.dataset.id,{method:'PATCH',body:JSON.stringify(Object.fromEntries(boxes.map(b=>[b.dataset.permission,b.checked])))});toast('已保存','权限已保存，对现有登录立即生效。');}catch(error){e.target.checked=!e.target.checked;report(error);}finally{boxes.forEach(b=>b.disabled=false);}});
// Delete asks in the row itself: the actions turn into "confirm / cancel" until one is chosen
const rowActions=new WeakMap();
$('#users').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const row=b.closest('tr'),id=row.dataset.id,u=users.find(u=>u.id===id);
 if(b.hasAttribute('data-delete')){const ops=b.closest('.ad-ops');rowActions.set(ops,ops.innerHTML);ops.innerHTML='<span class="ad-note">删除后已有登录立即失效</span><button class="ad-btn solid" type="button" data-confirm>确认删除</button><button class="ad-btn" type="button" data-cancel>取消</button>';ops.querySelector('[data-confirm]').focus();return;}
 if(b.hasAttribute('data-cancel')){const ops=b.closest('.ad-ops');ops.innerHTML=rowActions.get(ops);ops.querySelector('[data-delete]').focus();return;}
 b.disabled=true;try{
 if(b.hasAttribute('data-show')){const target=row.querySelector('[data-password]');if(b.textContent==='隐藏密码'){target.textContent='••••••••••••';b.textContent='查看密码';}else{target.textContent=(await api(`/api/admin/users/${id}/password`)).password;b.textContent='隐藏密码';}}
 if(b.hasAttribute('data-copy')){const {password}=await api(`/api/admin/users/${id}/password`);await navigator.clipboard.writeText(`用户名：${u.username}\n密码：${password}`);toast('已复制','账号密码已复制。');}
 if(b.hasAttribute('data-confirm')){await api(`/api/admin/users/${id}`,{method:'DELETE'});$('#new-account').hidden=true;$('#new-account').replaceChildren();newAccount=null;await loadUsers();toast('已删除','账号已删除。');}
 if(b.hasAttribute('data-history')){historyId=id;historyOffset=0;$('#history-user').textContent=u.username;await loadHistory();$('#history').showModal();}
 }catch(e){report(e);}finally{b.disabled=false;}});
async function loadHistory(){const data=await api(`/api/admin/users/${historyId}/logins?offset=${historyOffset}`);$('#events').innerHTML=data.events.length?data.events.map(e=>`<div class="e"><strong data-time="${e.occurred_at}">${ago(e.occurred_at)}</strong><p>${date(e.occurred_at)} · ${escapeHtml(e.ip)} · ${escapeHtml(region(e))}</p></div>`).join(''):'<p class="ad-note">暂无登录记录。</p>';$('#history-prev').disabled=historyOffset===0;$('#history-next').disabled=!data.more;$('#history-pager').hidden=historyOffset===0&&!data.more;}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#history').addEventListener('close',()=>$('#events').replaceChildren());
$('#history-prev').onclick=()=>{historyOffset-=50;loadHistory().catch(report)};$('#history-next').onclick=()=>{historyOffset+=50;loadHistory().catch(report)};
async function loadInbox(){try{const data=await api(`/api/admin/inbox?offset=${inboxOffset}`);
 $('#messages').innerHTML=data.messages.length?data.messages.map(m=>`<article class="ad-msg"${m.read_at?' data-read':''}><div class="top"><span class="st">${m.read_at?'已读':'未读'}</span><span>${date(m.created_at)}</span></div><h3>${escapeHtml(m.company)} · ${escapeHtml(m.name)}</h3><a class="m" href="mailto:${encodeURIComponent(m.email)}">${escapeHtml(m.email)}</a><dl><div><dt>应用与合作构想</dt><dd${m.read_at?' class="a"':''}>${escapeHtml(m.message)}</dd></div><div><dt>产品理解与开发经验</dt><dd${m.read_at?' class="a"':''}>${escapeHtml(m.experience)}</dd></div></dl>${m.read_at?'':`<div class="row"><button class="ad-btn solid" type="button" data-read="${m.id}">标为已读</button></div>`}</article>`).join(''):'<p class="ad-note">暂无软件合作伙伴申请。</p>';
 $('#inbox-prev').disabled=inboxOffset===0;$('#inbox-next').disabled=!data.more;$('#inbox-page').textContent=`第 ${inboxOffset/50+1} 页`;
 if(inboxOffset===0){const unread=data.messages.filter(m=>!m.read_at).length;$('#unread').textContent=unread;$('#unread').hidden=!unread;}
 }catch(e){report(e);}}
$('#messages').onclick=async e=>{const b=e.target.closest('button[data-read]');if(!b)return;b.disabled=true;try{await api('/api/admin/inbox/'+b.dataset.read,{method:'PATCH'});await loadInbox();}catch(e){report(e);b.disabled=false;}};
// Tabs: the two panels, with arrow keys, Home and End moving between the tabs
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(tab){tabs.forEach(x=>{const on=x===tab;x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1;});$('#users-panel').hidden=tab.dataset.tab!=='users';$('#inbox-panel').hidden=tab.dataset.tab!=='inbox';if(tab.dataset.tab==='inbox')loadInbox();else loadUsers();}
tabs.forEach(b=>b.onclick=()=>selectTab(b));
$('[role=tablist]').addEventListener('keydown',e=>{const i=tabs.indexOf(document.activeElement);if(i<0)return;const next={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[e.key];if(next===undefined)return;e.preventDefault();tabs[next].focus();selectTab(tabs[next]);});
$('#refresh-users').onclick=loadUsers;$('#refresh-inbox').onclick=loadInbox;
$('#users-prev').onclick=()=>{usersOffset-=50;loadUsers()};$('#users-next').onclick=()=>{usersOffset+=50;loadUsers()};$('#inbox-prev').onclick=()=>{inboxOffset-=50;loadInbox()};$('#inbox-next').onclick=()=>{inboxOffset+=50;loadInbox()};
setInterval(()=>document.querySelectorAll('[data-time]').forEach(e=>e.textContent=ago(Number(e.dataset.time))),30000);
init();

$('#change-password').onclick=()=>{$('#password-form').reset();$('#password-message').replaceChildren();$('#password-dialog').showModal();$('#password-form').elements.current_password.focus();};
$('#password-dialog').addEventListener('close',()=>$('#password-form').reset());
$('#password-form').onsubmit=async event=>{
 event.preventDefault();const form=event.target,button=form.querySelector('[type=submit]');
 if(form.elements.new_password.value!==form.elements.confirm_password.value){say($('#password-message'),'两次输入的新密码不一致','未能保存');return;}
 button.disabled=true;
 try{
  await CASE_AUTH.changePassword({current_password:form.elements.current_password.value,new_password:form.elements.new_password.value});
  $('#password-dialog').close();showLogin();await CASE_AUTH.refresh();
  say($('#login-message'),'密码已修改，所有旧登录已退出。请使用新密码登录。');$('#admin-login').elements.password.focus();
 }catch(error){say($('#password-message'),error.message,'未能保存');if(error.status===401)showLogin();}
 finally{button.disabled=false;}
};
