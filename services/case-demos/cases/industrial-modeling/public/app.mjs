import { createViewer } from './viewer.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = { phase: 'intro', stage: 0, slot: 16, height: 30, chamfer: 1, versions: [], history: [], selected: null, section: false, paused: false };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let viewer;
try { viewer = createViewer($('#model-canvas'), $('#viewport')); }
catch (error) { $('#viewer-error').hidden = false; $('#model-canvas').hidden = true; console.warn('3D preview unavailable:', error.message); }
if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('embedded');
const labels = ['六角主体', '端部倒角', '四方通槽', '侧面销孔'];
let timer = null, queue = [], pending = null, pendingInput = null, due = 0, remaining = 0, toastTimer;

function toast(text) { $('#toast').textContent = text; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3800); }
function message(role, text) {
  const div = document.createElement('div'); div.className = `message ${role}`;
  if (role === 'assistant') { const label = document.createElement('div'); label.className = 'message-label'; label.innerHTML = '<span>✧</span> 建模助手'; div.append(label); }
  const p = document.createElement('p'); p.textContent = text; div.append(p); $('#conversation').append(div); $('#conversation').scrollTop = $('#conversation').scrollHeight;
}
function record(text) { state.history.push({ text, time: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) }); }
function showModel(version) {
  const v = version || { stage: 3, slot: state.slot, height: state.height, chamfer: state.chamfer };
  viewer?.setModel(v); $('#dimensions').textContent = `34.64 × 30.00 × ${v.height.toFixed(2)} mm`;
  $('#versions').innerHTML = version ? `版本 ${String(version.n).padStart(2, '0')} <span>⌄</span>` : '示例半成品 <span>⌄</span>';
  $('#preview-label').textContent = version ? (v.stage === 3 ? '半成品 · 方槽已开' : labels[v.stage - 1]) : '半成品预览';
  $('#model-note').textContent = version ? (v.stage === 3 ? '半成品检查点 · 侧面销孔尚未加工' : `步骤检查点 · ${labels[v.stage - 1]}已展示`) : '示例半成品 · 孔位等后续特征尚未加工';
}
function checkpoint(stage, label) {
  state.stage = stage; const version = { n: state.versions.length + 1, stage, label, slot: state.slot, height: state.height, chamfer: state.chamfer };
  state.versions.push(version); state.selected = version.n; showModel(version); record(`保存版本 ${String(version.n).padStart(2, '0')}：${label}`); renderProgress();
}
function renderProgress() {
  const titles = { intro: '你来决定下一步', reading: '正在查看案例图纸', slot: '请确认方槽尺寸', body: '正在建立六角主体', chamfer: '请确认端部倒角', machining: '正在逐步更新模型', complete: '半成品已就绪' };
  $('#progress-title').textContent = state.paused ? '已暂停 · 进度已保留' : titles[state.phase];
  $('#progress-count').textContent = state.phase === 'intro' ? '约 1 分钟' : `${state.stage} / 4 步`;
  $('#progress-detail').textContent = state.paused ? '点击继续，从当前步骤接着演示' : state.phase === 'complete' ? '已完成 3 项示例特征，侧面销孔留待后续' : state.phase === 'intro' ? '从一个尺寸确认，开始协作建模' : state.phase === 'machining' && state.operation ? state.operation : labels[Math.min(state.stage, 3)];
  $$('.step-track i').forEach((item, i) => { item.className = i < state.stage ? 'done' : i === state.stage && state.phase !== 'intro' ? 'current' : ''; });
  const asking = ['slot', 'chamfer'].includes(state.phase);
  $('#status').textContent = state.paused ? '已暂停' : asking ? '需要你确认' : state.phase === 'complete' ? '半成品已生成' : state.phase === 'intro' ? '等待开始' : '正在处理';
  $('#status').className = 'state-label' + (asking ? ' warning' : state.phase === 'complete' ? ' done' : '');
  $('#start').textContent = state.phase === 'intro' ? '开始体验 →' : state.paused ? '继续演示 →' : state.phase === 'complete' ? '再体验一次 ↻' : '体验进行中';
  $('#start').disabled = state.phase !== 'intro' && state.phase !== 'complete' && !state.paused;
}
function activity(text) { $('#activity').hidden = !text; $('#activity-text').textContent = text; $('#pause').textContent = state.paused ? '继续' : '暂停'; }
function clearQueue() { clearTimeout(timer); timer = null; pending = null; queue = []; state.paused = false; activity(''); }
function runQueue(items) { clearQueue(); queue = items; next(); }
function next() {
  pending = queue.shift();
  if (!pending) { activity(''); return; }
  activity(pending.text); remaining = pending.delay; due = performance.now() + remaining;
  timer = setTimeout(() => { const action = pending.action; pending = null; action(); next(); }, remaining);
}
function pause() {
  if (!pending) { toast('当前正在等待你的回答，无需暂停。'); return; }
  if (state.paused) { resume(); return; }
  clearTimeout(timer); remaining = Math.max(0, due - performance.now()); state.paused = true; record('暂停演示'); activity('进度已保留'); renderProgress();
}
function resume() {
  if (!state.paused || !pending) return;
  state.paused = false; activity(pending.text); due = performance.now() + remaining;
  timer = setTimeout(() => { const action = pending.action; pending = null; action(); next(); }, remaining); record('继续演示'); renderProgress();
}
function question(kind) {
  const returnToQuestion = document.activeElement === $('#progress-title');
  state.phase = kind; renderProgress();
  const isSlot = kind === 'slot';
  $('#question').hidden = false;
  $('#question').innerHTML = `<article class="question-card"><div class="question-kicker">✧ 工程师确认 · ${isSlot ? '01' : '02'}</div><h3>${isSlot ? '四方通槽的边长，按哪个尺寸预览？' : '上下端部的外棱，采用多大的倒角？'}</h3><p>${isSlot ? '示例标注为 16 mm。你可以确认，也可以试着修改。' : '保持总高度不变，从两端外缘去除材料。'}</p><div class="question-options">${(isSlot ? [16, 18] : [1, 2]).map(value => `<button data-answer="${value}">${isSlot ? `${value} × ${value} mm` : `${value} × 45°`}</button>`).join('')}</div><button class="custom-answer" id="custom-answer">用自己的话补充答案 ↗</button></article>`;
  $('#prompt').placeholder = isSlot ? '例如：方槽改成 18 毫米' : '例如：倒角做 1.5 毫米';
  $('#composer-hint').textContent = '回答后继续，不需要重新开始';
  const field = isSlot ? 'slot' : 'chamfer';
  if (pendingInput?.field === field) {
    const input = pendingInput; pendingInput = null;
    queueMicrotask(() => accept(input.value, input.text));
  } else if (returnToQuestion) $('#question [data-answer]')?.focus({ preventScroll: true });
}
function hideQuestion() { if ($('#question').contains(document.activeElement)) $('#progress-title').focus({ preventScroll: true }); $('#question').hidden = true; $('#question').replaceChildren(); }
function reset() {
  clearQueue(); pendingInput = null; Object.assign(state, { phase: 'intro', stage: 0, slot: 16, height: 30, chamfer: 1, versions: [], history: [], selected: null, section: false, paused: false, operation: null });
  $('#conversation').replaceChildren(); hideQuestion(); $('#prompt').value = ''; $('#prompt').placeholder = '例如：方槽改成 18 毫米'; $('#composer-hint').textContent = '试着用自己的话修改尺寸';
  $('#section').setAttribute('aria-pressed', 'false'); $('#section-caption').hidden = true; viewer?.section(false); viewer?.view('iso');
  $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'iso'));
  showModel(null); renderProgress();
  message('assistant', '你好，我是建模助手。我们用一个六角扳头，体验一次从图纸到三维模型的协作过程。');
  const card = document.createElement('div'); card.className = 'welcome-card'; card.innerHTML = '<strong>这一次，由你来确认细节。</strong>我会提出两个问题。你的选择会改变模型；你也可以随时用文字修改参数。<button class="button primary" id="welcome-start">使用示例图纸，开始体验 →</button>'; $('#conversation').append(card);
}
function start() {
  if (state.paused) { resume(); return; }
  if (state.phase !== 'intro' && state.phase !== 'complete') return;
  const queuedInput = pendingInput, returnToProgress = $('#conversation').contains(document.activeElement); reset(); pendingInput = queuedInput; $('#conversation').replaceChildren(); state.phase = 'reading'; renderProgress(); if (returnToProgress) $('#progress-title').focus({ preventScroll: true }); record('载入脱敏案例图纸，开始模拟建模');
  message('user', '请根据这张图纸建立三维模型，不清楚的尺寸先与我确认。');
  runQueue([
    { text: '正在查看主视图与端面', delay: 1400, action: () => message('assistant', '已载入案例。示例外形为六角柱，对边 30 mm，总高 30 mm。接下来按主体、倒角、方槽逐步预览。') },
    { text: '整理需要确认的尺寸', delay: 1000, action: () => { message('assistant', '先确认中间的四方通槽。这个尺寸会直接影响开口大小。'); record('提出方槽边长确认问题'); question('slot'); } }
  ]);
}
function accept(value, text) {
  const slot = state.phase === 'slot', min = slot ? 6 : .3, max = slot ? 22 : 2.5;
  if (!Number.isFinite(value) || value < min || value > max) { message('assistant', `这个演示支持${slot ? '方槽边长 6～22' : '倒角 0.3～2.5'} mm，请在这个范围内输入。`); return; }
  message('user', text || (slot ? `方槽边长用 ${value} mm。` : `倒角采用 ${value} × 45°。`)); hideQuestion();
  if (slot) {
    state.slot = value; record(`工程师确认方槽边长 ${value} mm`); state.phase = 'body'; renderProgress();
    message('assistant', `已记录：方槽 ${value} × ${value} mm。先建立六角主体，再处理端部和开口。`);
    runQueue([{ text: '正在建立六角主体', delay: 1800, action: () => { checkpoint(1, '六角主体'); message('assistant', '六角主体已展示，已保存第一个检查点。现在确认上下端面的倒角。'); question('chamfer'); } }]);
  } else {
    state.chamfer = value; record(`工程师确认端部倒角 ${value} × 45°`); state.phase = 'machining'; renderProgress();
    message('assistant', `收到，两端外棱采用 ${value} × 45° 倒角，总高保持 ${state.height} mm。随后按已确认尺寸开方槽。`);
    runQueue([
      { text: '正在预览端部倒角', delay: 1600, action: () => { checkpoint(2, `端部倒角 ${value} × 45°`); message('assistant', '端部倒角已展示，已保留主体版本，方便回看。'); } },
      { text: '正在预览四方通槽', delay: 1700, action: () => { checkpoint(3, `方槽 ${state.slot} × ${state.slot} mm`); complete(); } }
    ]);
  }
}
function complete() {
  state.phase = 'complete'; state.operation = null; renderProgress(); $('#prompt').placeholder = '例如：方槽改成 18 毫米'; $('#composer-hint').textContent = '可修改方槽、倒角和总高';
  message('assistant', `半成品已展示：总高 ${state.height} mm，方槽 ${state.slot} × ${state.slot} mm，两端倒角 ${state.chamfer} × 45°。\n侧面销孔尚未加工，演示停在这个检查点。你可以旋转、剖切、回看版本，或继续输入修改要求。`);
  record('完成半成品展示；侧面销孔保留为未完成特征');
  if (pendingInput?.field === 'height') {
    const input = pendingInput; pendingInput = null;
    queueMicrotask(() => edit(input.field, input.value, input.text));
  }
}
function edit(field, value, text) {
  const bounds = { slot: [6, 22], chamfer: [.3, 2.5], height: [24, 45] };
  const name = { slot: '方槽边长', chamfer: '端部倒角', height: '总高' }[field];
  if (value < bounds[field][0] || value > bounds[field][1]) { message('assistant', `${name}的演示范围为 ${bounds[field][0]}～${bounds[field][1]} mm，请换一个范围内的值。`); return; }
  clearQueue(); hideQuestion(); message('user', text); const old = state[field]; state[field] = value; state.phase = 'machining'; state.operation = name; renderProgress();
  record(`文字修改：${name} ${old} → ${value} mm`); message('assistant', `已理解：${name}从 ${old} 改为 ${value} mm。现在更新半成品预览，并保留修改前的版本。`);
  runQueue([{ text: `正在更新${name}`, delay: 1400, action: () => { checkpoint(3, `${name}改为 ${value} mm`); complete(); } }]);
}
function send(text) {
  text = text.trim(); if (!text) return;
  if (/^(暂停|停止|停一下)[。！! ]*$/.test(text)) { pause(); return; }
  if (/^(继续|继续演示)[。！! ]*$/.test(text) && state.paused) { resume(); return; }
  if (/^(开始|开始体验|重新开始|重新体验)[。！! ]*$/.test(text)) { reset(); start(); return; }
  const normalized = text.replace(/[０-９．]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248)).replace(/[−－]/g, '-');
  const number = normalized.match(/[+-]?\d+(?:\.\d+)?/); const value = number ? Number(number[0]) : NaN;
  const field = /方槽|通槽|槽宽|边长/.test(text) ? 'slot' : /倒角/.test(text) ? 'chamfer' : /高度|总高|高改|高为|高[度]?\s*\d/.test(text) ? 'height' : null;
  if (state.phase === 'intro') { if (field && number) pendingInput = { field, value, text }; start(); return; }
  if (['slot', 'chamfer'].includes(state.phase)) { if (!number) { message('assistant', '请写出要采用的尺寸数字，或点击上面的选项。'); return; } accept(value, text); return; }
  if (field && number && state.versions.length) { edit(field, value, text); return; }
  message('user', text);
  message('assistant', pending ? '演示正在进行。你可以暂停后继续；已有模型后，可以输入“方槽改成 18 毫米”“倒角改成 2 毫米”或“高度改成 35 毫米”。' : '这里使用预设剧情，不调用真实模型。你可以输入“方槽改成 18 毫米”“倒角改成 2 毫米”或“高度改成 35 毫米”，查看对应的变化。');
}
function dialog(title, html) { $('#dialog-title').textContent = title; $('#dialog-body').innerHTML = html; $('#dialog').showModal(); }
$('#dialog-close').onclick = () => $('#dialog').close();
$('#dialog').addEventListener('click', event => { if (event.target === $('#dialog')) { const box = $('#dialog').getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('#dialog').close(); } });
$('#start').onclick = start; $('#reset').onclick = () => { reset(); toast('演示已重置，可以重新选择。'); }; $('#pause').onclick = pause;
$('#conversation').addEventListener('click', event => { if (event.target.closest('#welcome-start')) start(); });
$('#question').addEventListener('click', event => { const button = event.target.closest('[data-answer]'); if (button) accept(Number(button.dataset.answer)); else if (event.target.closest('#custom-answer')) { $('#prompt').focus(); $('#prompt').scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' }); } });
$('#prompt-form').onsubmit = event => { event.preventDefault(); const text = $('#prompt').value; $('#prompt').value = ''; send(text); };
$('#prompt').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('#prompt-form').requestSubmit(); } });
function compare(enabled) { $('#drawing-pane').hidden = !enabled; $('#compare-tab').classList.toggle('active', enabled); $('#model-tab').classList.toggle('active', !enabled); $('#compare-tab').setAttribute('aria-selected', enabled); $('#model-tab').setAttribute('aria-selected', !enabled); }
$('#model-tab').onclick = () => compare(false); $('#compare-tab').onclick = () => compare(true);
$$('[data-view]').forEach(button => { button.onclick = () => { viewer?.view(button.dataset.view); $$('[data-view]').forEach(b => b.classList.toggle('active', b === button)); }; });
$('#fit').onclick = () => { viewer?.view('iso'); $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'iso')); };
$('#section').onclick = () => { state.section = !state.section; viewer?.section(state.section); $('#section').setAttribute('aria-pressed', state.section); $('#section-caption').hidden = !state.section; };
$('#enlarge').onclick = () => dialog('脱敏图纸示意', '<p>此素材仅用于还原图纸区域的视觉体验，不含原始工程图纸。</p><img src="./drawing-mosaic.svg" alt="放大的马赛克示意图纸">');
$('#about').onclick = () => dialog('亲手体验一次协作建模', '<p>这是图纸工坊的交互演示。对话、参数与建模过程使用模拟数据，三维预览会随你的选择变化。</p><ul><li>点击开始，回答方槽与倒角两个问题。</li><li>用文字调整方槽边长、倒角或总高。</li><li>旋转模型、切换视角、查看剖切与历史版本。</li></ul><p>展示停留在半成品；不调用真实 Agent、FreeCAD 或模型 API，也不接收上传文件。示例不用于制造。</p>');
$('#history').onclick = () => dialog('修改记录', state.history.length ? state.history.map(item => `<div class="history-entry"><b>${esc(item.time)}</b>${esc(item.text)}</div>`).join('') : '<p>开始体验后，确认与修改会记录在这里。</p>');
$('#versions').onclick = () => dialog('回看模型版本', state.versions.length ? state.versions.map(v => `<button class="version-item" data-version="${v.n}"><span>版本 ${String(v.n).padStart(2, '0')} · ${esc(v.label)}</span><span>${v.n === state.selected ? '当前查看' : '查看 →'}</span></button>`).join('') + '<p>回看只改变预览，不会撤销当前修改。</p>' : '<p>当前展示示例半成品。开始体验后，每完成一步都会保存一个可回看的版本。</p>');
$('#dialog-body').addEventListener('click', event => { const button = event.target.closest('[data-version]'); if (!button) return; const version = state.versions.find(v => v.n === Number(button.dataset.version)); if (!version) return; state.selected = version.n; showModel(version); $('#dialog').close(); toast(`正在查看版本 ${String(version.n).padStart(2, '0')}：${version.label}`); });
$('#checks').onclick = () => { const v = state.versions.find(v => v.n === state.selected) || { stage: 3, slot: state.slot, height: state.height, chamfer: state.chamfer }; dialog('当前预览参数', `<p>以下为模拟参数，不是 CAD 几何验收报告。</p><table><tbody><tr><th>六角对边</th><td>30 mm</td></tr><tr><th>总高度</th><td>${v.height} mm</td></tr><tr><th>端部倒角</th><td>${v.stage >= 2 ? `${v.chamfer} × 45°` : '待加工'}</td></tr><tr><th>四方通槽</th><td>${v.stage >= 3 ? `${v.slot} × ${v.slot} mm` : '待加工'}</td></tr><tr><th>侧面销孔</th><td>未加工 · 半成品展示</td></tr></tbody></table>`); };
reset();
