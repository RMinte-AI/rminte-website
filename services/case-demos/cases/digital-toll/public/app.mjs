import {catalog,groups,questions,days,totals,exemptionRows,paymentRows,articles,format} from './data.mjs';

const $=id=>document.getElementById(id);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon=name=>`<img src="./icons/${name}.svg" alt="">`;
const status=(text,warning=false)=>`<span class="status${warning?' warning':''}">${escape(text)}</span>`;
const table=(label,headers,rows)=>`<div class="table-scroll" role="region" aria-label="${escape(label)}" tabindex="0"><table><thead><tr>${headers.map(x=>`<th scope="col">${escape(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${escape(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const messageMarkup=message=>`<article class="message ${message.role}" aria-label="${message.role==='user'?'用户问题':'AI 模拟回答'}"><span class="avatar">${icon(message.role==='user'?'user-round':'bot')}</span><div class="message-content">${message.html}</div></article>`;
const metrics=items=>`<div class="metrics">${items.map(([label,value,unit])=>`<div><p class="metric-label">${escape(label)}</p><p class="metric-value">${escape(value)}<span class="metric-unit">${escape(unit)}</span></p></div>`).join('')}</div>`;
const heading=(title,caption='2026-09-18 · 模拟数据')=>`<div class="result-heading"><h2>${escape(title)}</h2><p>${escape(caption)}</p></div>`;
const select=(name,label,options)=>`<label class="field">${escape(label)}<select name="${name}">${options.map(([value,text])=>`<option value="${escape(value)}">${escape(text)}</option>`).join('')}</select></label>`;
const dateSelect=()=>select('day','日期',Object.keys(days).map(day=>[day,day]));
const sourceNote='<p class="result-note">独立模拟资料，不构成真实业务记录或政策依据。</p>';
let currentConversation=null,nextConversationId=1;
const conversations=[];
const mobile=matchMedia('(max-width:600px)');

function syncSidebar() {
  const visible=mobile.matches?$('workspace').classList.contains('mobile-nav'):!$('workspace').classList.contains('collapsed');
  $('toggle-sidebar').setAttribute('aria-expanded',String(visible));
  const label=visible?'收起侧栏':'展开侧栏';
  $('toggle-sidebar').setAttribute('aria-label',label);$('toggle-sidebar').title=label;
}
function navigate(view,id=null) {
  for(const name of ['chat','plaza','feature'])$(`${name}-view`).hidden=name!==view;
  for(const button of document.querySelectorAll('.sidebar .nav-button')) {
    const active=(view==='chat'&&(currentConversation?button.dataset.conversation===String(currentConversation.id):button.id==='new-chat'))||(button.id==='open-plaza'&&view==='plaza')||(button.dataset.feature===id&&view==='feature');
    button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  $('workspace').classList.remove('mobile-nav');syncSidebar();
  if(view==='feature')renderFeature(id);
  if(view==='plaza')$('plaza-title').focus({preventScroll:true});
}
function updateRecent() {
  $('recent').innerHTML=conversations.length?conversations.slice().reverse().map(item=>`<button class="nav-button recent-button" data-conversation="${item.id}" title="${escape(item.title)}">${escape(item.title)}</button>`).join(''):'<p class="empty-history">暂无对话</p>';
  $('clear-history').disabled=conversations.length===0;
}
function renderMessages() {
  $('welcome').hidden=Boolean(currentConversation?.messages.length);
  $('messages').innerHTML=(currentConversation?.messages||[]).map(messageMarkup).join('');
  $('chat-scroll').scrollTop=$('chat-scroll').scrollHeight;
}
function newChat() {
  currentConversation=null;$('question').value='';$('scenario').value='';$('send').disabled=true;
  navigate('chat');renderMessages();$('scenario').focus({preventScroll:true});
}
function answer(id) {
  const data=totals();
  const source='<p class="answer-source">示例收费站 · 2026-09-18 · 逻辑日口径 · 模拟数据</p>';
  if(id==='daily')return `<p>2026 年 9 月 18 日出口流水汇总如下：</p>${table('出口流水汇总',['指标','数值'],[['出口车流量',`${format(data.traffic)} 辆`],['通行费收入',`${format(data.revenue,2)} 元`],['优惠金额',`${format(data.discount,2)} 元`]])}<p>以上为按逻辑日汇总的模拟结果。收费收入与优惠金额分别列示，不混用统计口径。</p>${source}<div class="answer-actions"><button class="text-link" data-feature="statistics">查看数据统计</button></div>`;
  if(id==='payments')return `<p>同一示例日按支付方式拆分如下：</p>${table('支付方式拆分',['支付方式','车流量（辆）','通行费（元）'],[...data.payments.map(([name,count,fee])=>[name,format(count),format(fee,2)]),['合计',format(data.traffic),format(data.revenue,2)]])}<p>四类支付方式合计与日汇总一致，便于逐项核对。</p>${source}`;
  if(id==='exception')return `<p>示例流水中有 <strong>2 项待核对</strong>，不能仅凭这些状态认定收费损失。</p>${table('待核对流水',['流水编号','金额（元）','待办事项'],[paymentRows[0],paymentRows[2]].map(row=>[row[0],row[3],row[5]]))}<p>先比对支付与回写记录，再核对退款凭据。核对结论应由业务人员确认。</p>${source}<div class="answer-actions"><button class="text-link" data-feature="payment">打开支付流水排查</button></div>`;
  const article=articles[0];
  return `<p>在示例资料中找到“${article.title}”。</p><p>${article.body}</p><div class="evidence"><h3>资料来源</h3><p>${article.source}<br>${article.section}</p></div><p class="answer-source">以上为编写的演示条目，不是现行政策或实际办事依据。</p><div class="answer-actions"><button class="text-link" data-feature="knowledge">查看知识库原文</button></div>`;
}

function renderFeature(id) {
  const item=catalog.find(entry=>entry.id===id);
  $('feature-title').textContent=item.name;
  const forms={
    statistics:[dateSelect(),'查询'],
    squad:[dateSelect()+select('shift','班次',[['all','全部班次'],['early','早班'],['middle','中班'],['night','夜班']]),'查询日志'],
    exemption:['<label class="field">车辆示例编号<input name="plate" placeholder="DEMO-A001" maxlength="32" autocomplete="off"></label>','查询记录'],
    knowledge:[select('article','资料主题',articles.map(article=>[article.id,article.title])),'检索资料'],
    payment:[select('scope','核对范围',[['pending','待核对流水'],['all','全部示例流水']]),'核对流水'],
    automation:[select('file','示例表格',[['monthly','通行费月报（示例）']]),'自动填写示例表'],
    report:[dateSelect(),'生成示例汇报'],
    inspection:[select('lane','巡检范围',[['all','全部示例车道']]),'查看巡检结果'],
    archive:[select('file','示例目录',[['archive','2026-09-18 影像记录']]),'扫描示例目录'],
    video:[select('file','示例事件',[['event','DEMO-V018 出口事件']]),'查看示例分析'],
    ocr:[select('file','示例文档',[['ocr','交接班记录（示例）']]),'查看识别结果']
  };
  const [fields,action]=forms[id];
  $('feature-content').innerHTML=`<form class="feature-toolbar" id="feature-form">${fields}<button class="button primary" type="submit">${icon('search-check')}${escape(action)}</button></form><div class="result-area" id="feature-result" tabindex="-1" aria-live="polite"><p class="empty-result">暂无结果</p></div>`;
  $('feature-form').addEventListener('submit',event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget));
    $('feature-result').innerHTML=featureResult(id,values);
    $('feature-result').focus({preventScroll:true});
  });
  $('feature-view').scrollTop=0;$('feature-title').focus({preventScroll:true});
}
function featureResult(id,values) {
  const day=values.day||'2026-09-18';
  const data=totals(day);
  if(id==='statistics')return metrics([['出口车流量',format(data.traffic),'辆'],['通行费收入',format(data.revenue,2),'元'],['入口车流量',format(data.entry),'辆'],['优惠金额',format(data.discount),'元']])+heading('支付方式统计',`${day} · 逻辑日 · 模拟数据`)+table('支付方式统计',['支付方式','车流量（辆）','通行费（元）'],[...data.payments.map(([name,count,fee])=>[name,format(count),format(fee,2)]),['合计',format(data.traffic),format(data.revenue,2)]])+'<p class="result-note">日汇总与分项采用同一套模拟数据。</p>';
  if(id==='squad') {
    const shifts=day==='2026-09-18'?[
      ['early','早班','08:00—16:00',2130,106120,'支付回写待核对 1 项'],['middle','中班','16:00—24:00',1720,82560,'退款凭据待核对 1 项'],['night','夜班','00:00—08:00',970,47800,'设备状态正常']
    ]:[['early','早班','08:00—16:00',2050,100120,'无未完结事项'],['middle','中班','16:00—24:00',1710,83240,'无未完结事项'],['night','夜班','00:00—08:00',950,46500,'设备状态正常']];
    const selected=shifts.filter(row=>values.shift==='all'||row[0]===values.shift);
    return metrics([['所选班次',selected.length,'班'],['出口车流量',format(selected.reduce((sum,row)=>sum+row[3],0)),'辆'],['通行费收入',format(selected.reduce((sum,row)=>sum+row[4],0),2),'元']])+heading('交接班记录',`${day} · 模拟数据`)+table('交接班记录',['班次','时间','出口车辆','交接事项'],selected.map(row=>[row[1],row[2],`${format(row[3])} 辆`,row[5]]))+'<p class="result-note">未完结事项随班次保留，交接后仍需继续核对。</p>';
  }
  if(id==='exemption') {
    const search=values.plate.trim().toUpperCase();
    const rows=exemptionRows.filter(row=>row[0].includes(search));
    if(!rows.length)return '<p class="empty-result">没有匹配的示例车辆记录</p>';
    return heading('车辆减免记录')+table('车辆减免记录',['车辆示例编号','类型','查验时间','核对状态'],rows.map(row=>row.slice(0,4)))+`<div class="evidence"><h3>原始记录索引</h3><p>${rows.map(row=>`${escape(row[0])} / ${escape(row[4])}`).join('<br>')}</p><p>仅展示模拟记录。查到记录不等于确认车辆符合减免条件。</p></div>`;
  }
  if(id==='knowledge') {
    const article=articles.find(entry=>entry.id===values.article);
    return `<article class="document"><div class="document-label">${icon('book-open')}示例资料</div><h2>${article.title}</h2><p>${article.body}</p><button class="text-link" id="show-source" aria-expanded="false" aria-controls="source-excerpt">查看原文位置</button><div class="evidence" id="source-excerpt" hidden><h3>${article.source}</h3><p>${article.section}</p><p>${article.body}</p></div>${sourceNote}</article>`;
  }
  if(id==='payment') {
    const rows=paymentRows.filter(row=>values.scope==='all'||row[5]!=='已匹配');
    return heading('支付流水核对')+table('支付流水核对',['流水编号','时间','支付方式','金额（元）','支付状态','核对状态'],rows)+`<div class="evidence"><h3>核对清单</h3><p>DEMO-P018：核对支付成功记录与收费回写。<br>DEMO-P031：核对退款记录及对应凭据。</p><p>待核对不等于少收或漏收；此处没有执行退款、扣款或业务状态修改。</p></div>`;
  }
  if(id==='automation')return `<div class="result-heading"><h2>示例表格已填写</h2>${status('2 个完整月份')}</div>`+table('示例表格已填写',['月份','通行费收入（万元）','核对结果'],[['2026-08','686.52','31 天齐全'],['2026-09','704.18','30 天齐全'],['2026-10','数据缺失','示例资料仅含部分日期']])+`<div class="evidence"><h3>填写依据</h3><p>按逻辑日汇总完整月份，并核对表格单位。缺失月份不填零，不生成完整年度合计。</p><p>这是预设填表结果，没有上传文件或连接实际数据源。</p></div>`;
  if(id==='report')return `<article class="document"><div class="document-label">${icon('file-text')}模拟汇报草稿</div><h2>示例收费站运营日报</h2><p>${day} · 待人工复核</p><h2>一、通行与收费情况</h2><p>按逻辑日统计，入口车辆 ${format(data.entry)} 辆，出口车辆 ${format(data.traffic)} 辆，通行费收入 ${format(data.revenue,2)} 元，优惠金额 ${format(data.discount,2)} 元。</p><h2>二、核对与交接事项</h2><p>${day==='2026-09-18'?'支付回写与退款凭据各有 1 项待核对，须记录处理过程并在交接时说明。':'本组示例记录未列出未完结事项。'}</p><h2>三、复核要求</h2><p>核对统计日期、数据口径与待办事项，确认后再使用。此文本为固定模拟草稿，未提交审批或对外发送。</p></article>`;
  if(id==='inspection')return metrics([['示例车道','4','条'],['状态正常','3','条'],['待复核','1','条']])+heading('设备巡检记录')+table('设备巡检记录',['车道','设备','状态','跟进事项'],[['入口 01','摄像机','正常','无需跟进'],['入口 02','读卡器','正常','无需跟进'],['出口 01','栏杆机','正常','无需跟进'],['出口 02','摄像机','心跳异常','核实供电与网络']])+'<p class="result-note">以上为固定巡检快照，不是现场实时告警，未执行设备控制。</p>';
  if(id==='archive')return `<div class="result-heading"><h2>示例归档清单</h2>${status('3 条记录')}</div>`+table('示例归档清单',['原文件','归档编号','资料类别','状态'],[['demo-clip-01.mp4','DEMO-20260918-001','车道事件','已匹配示例记录'],['demo-frame-02.jpg','DEMO-20260918-002','查验影像','已匹配示例记录'],['demo-clip-03.mp4','待复核','车道事件','时间信息缺失']])+'<p class="result-note">只展示模拟归档结果，不读取本机或共享文件夹，也不修改任何影像文件。</p>';
  if(id==='video')return `<article class="document"><div class="document-label">${icon('video')}DEMO-V018 · 示例事件分析</div><h2>出口事件核对记录</h2><div class="step-list"><div class="step-row"><span>00:03 车辆进入车道</span>${status('示例时点')}</div><div class="step-row"><span>00:08 出现异常通行片段</span>${status('待复核',true)}</div><div class="step-row"><span>00:12 车辆离开画面</span>${status('示例时点')}</div></div><h2>待核对材料</h2><p>对应时段交易记录、车道设备记录及人工复核意见。仅凭示例事件描述不作逃费或违法判断。</p><p class="result-note">预设分析结果，不包含真实视频，不执行视频识别。</p></article>`;
  return `<div class="result-heading"><h2>交接班记录识别结果</h2>${status('含 1 项待核对',true)}</div>`+table('交接班记录识别结果',['字段','识别文本','核对状态'],[['日期','2026-09-18','示例字段'],['班次','早班','示例字段'],['设备记录','出口 02 摄像机待复核','示例字段'],['交接签名','字迹不清','待人工确认']])+'<p class="result-note">示例识别结果保留不确定项，不把模糊签名猜成人名。未上传文档或调用 OCR 服务。</p>';
}

$('frequent').innerHTML=['squad','statistics','exemption'].map(id=>{const item=catalog.find(entry=>entry.id===id);return `<button class="nav-button" data-feature="${id}">${icon(item.icon)}${item.name}</button>`;}).join('');
$('catalog').innerHTML=groups.map(group=>`<section class="catalog-group" aria-labelledby="group-${group.id}"><div class="catalog-heading"><h2 id="group-${group.id}">${group.name}</h2><p>${group.description}</p></div><div class="function-grid">${catalog.filter(item=>item.group===group.id).map(item=>`<button class="function-card tone-${item.tone}" data-feature="${item.id}">${icon(item.icon)}<strong>${item.name}</strong><p>${item.description}</p></button>`).join('')}</div></section>`).join('');
for(const item of questions){const option=new Option(item.label,item.id);$('scenario').append(option);}
$('scenario').addEventListener('change',()=>{const question=questions.find(item=>item.id===$('scenario').value);$('question').value=question?.text||'';$('send').disabled=!question;});
$('composer').addEventListener('submit',event=>{
  event.preventDefault();
  const question=questions.find(item=>item.id===$('scenario').value);if(!question)return;
  if(!currentConversation){currentConversation={id:nextConversationId++,title:question.label,messages:[]};conversations.push(currentConversation);updateRecent();}
  const messages=[{role:'user',html:`<p>${escape(question.text)}</p>`},{role:'assistant',html:answer(question.id)}];
  currentConversation.messages.push(...messages);
  $('welcome').hidden=true;
  $('messages').insertAdjacentHTML('beforeend',messages.map(messageMarkup).join(''));
  $('chat-scroll').scrollTop=$('chat-scroll').scrollHeight;
  $('scenario').value='';$('question').value='';$('send').disabled=true;
  navigate('chat');$('scenario').focus({preventScroll:true});
});
$('question').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();$('composer').requestSubmit();}});
$('new-chat').addEventListener('click',newChat);
$('open-plaza').addEventListener('click',()=>navigate('plaza'));
$('toggle-sidebar').addEventListener('click',()=>{$('workspace').classList.toggle(mobile.matches?'mobile-nav':'collapsed');syncSidebar();});
mobile.addEventListener('change',()=>{$('workspace').classList.remove('mobile-nav');syncSidebar();});
document.addEventListener('click',event=>{
  const feature=event.target.closest('[data-feature]');if(feature){navigate('feature',feature.dataset.feature);return;}
  const recent=event.target.closest('[data-conversation]');if(recent){currentConversation=conversations.find(item=>item.id===Number(recent.dataset.conversation));navigate('chat');renderMessages();$('scenario').focus({preventScroll:true});}
  const source=event.target.closest('#show-source');if(source){const open=$('source-excerpt').hidden;$('source-excerpt').hidden=!open;source.setAttribute('aria-expanded',String(open));source.textContent=open?'收起原文':'查看原文位置';}
});
$('clear-history').addEventListener('click',()=>$('confirm-clear').showModal());
$('cancel-clear').addEventListener('click',()=>$('confirm-clear').close());
$('confirm-clear-button').addEventListener('click',()=>{conversations.length=0;$('confirm-clear').close();updateRecent();newChat();});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||$('confirm-clear').open)return;
  if($('workspace').classList.contains('mobile-nav')){$('workspace').classList.remove('mobile-nav');syncSidebar();$('toggle-sidebar').focus();event.stopPropagation();return;}
  if(window.parent!==window){event.preventDefault();parent.postMessage({type:'case-demo-close'},location.origin);}
});
syncSidebar();
if(parent!==window)parent.postMessage({type:'case-demo-ready'},location.origin);
