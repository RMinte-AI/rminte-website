import { demoReady } from './embed.js';
import { createViewer } from './viewer.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const labels = ['六角主体', '端部倒角', '四方通槽'];
const state = { phase: 'intro', slot: 16, chamfer: 1, versions: [], selected: null, section: false };
let viewer, timer;

function message(role, text) {
  const entry = document.createElement('div');
  entry.className = `message ${role}`;
  const content = document.createElement('p');
  content.textContent = text;
  entry.append(content);
  $('#conversation').append(entry);
  $('#conversation').scrollTop = $('#conversation').scrollHeight;
}
function progress(phase, title, detail) {
  state.phase = phase;
  $('#progress-title').textContent = title;
  $('#progress-detail').textContent = detail;
  $('#progress-count').textContent = `${state.versions.length} / 3 步`;
  const complete = phase === 'complete';
  const asking = phase === 'slot' || phase === 'chamfer';
  $('#status').textContent = complete ? '半成品已就绪' : asking ? '需要你确认' : '正在演示';
  $('#status').className = `state-label${complete ? ' done' : asking ? ' warning' : ''}`;
  $('#start').disabled = true;
  $$('.step-track i').forEach((item, index) => { item.className = index < state.versions.length ? 'done' : ''; });
}
function later(action, delay) {
  timer = setTimeout(action, delay);
}
function showModel(version) {
  viewer.setModel(version);
  $('#preview-label').textContent = labels[version.stage - 1];
  $('#model-note').textContent = version.stage === 3 ? '半成品检查点 · 侧面销孔尚未加工' : `步骤检查点 · ${labels[version.stage - 1]}`;
  $('#steps').textContent = `建模步骤 · 版本 ${String(version.stage).padStart(2, '0')}`;
}
function checkpoint(stage) {
  const version = { stage, slot: state.slot, chamfer: state.chamfer, height: 30 };
  state.versions.push(version);
  state.selected = stage;
  $('#steps').disabled = false;
  showModel(version);
}
function reset() {
  clearTimeout(timer);
  Object.assign(state, { phase: 'intro', slot: 16, chamfer: 1, versions: [], selected: null, section: false });
  $('#conversation').replaceChildren();
  $('#question').hidden = true;
  $('#question').replaceChildren();
  $('#section').setAttribute('aria-pressed', 'false');
  $('#section-caption').hidden = true;
  viewer.section(false);
  viewer.setModel({ stage: 3, slot: 16, height: 30, chamfer: 1 });
  viewer.view('iso');
  $('#preview-label').textContent = '示例半成品';
  $('#model-note').textContent = '示例半成品 · 侧面销孔尚未加工';
  $('#steps').textContent = '建模步骤';
  $('#steps').disabled = true;
  $('#status').textContent = '等待开始';
  $('#status').className = 'state-label';
  $('#progress-title').textContent = '你来决定下一步';
  $('#progress-count').textContent = '约 1 分钟';
  $('#progress-detail').textContent = '选择答案，查看模型逐步变化';
  $$('.step-track i').forEach(item => { item.className = ''; });
  $('#start').disabled = false;
  message('assistant', '你好，我是建模助手。点击开始，确认方槽与倒角两个细节，查看六角扳头的建模过程。');
}
function question(kind) {
  const slot = kind === 'slot';
  progress(kind, slot ? '请确认方槽尺寸' : '请确认端部倒角', '选择一个答案，继续当前演示');
  $('#question').hidden = false;
  $('#question').innerHTML = `<article class="question-card"><div class="question-kicker">工程师确认 · ${slot ? '01' : '02'}</div><h3>${slot ? '四方通槽采用哪个尺寸？' : '上下端部采用多大的倒角？'}</h3><p>${slot ? '你的选择会改变方槽开口大小。' : '保持总高度不变，从两端外缘去除材料。'}</p><div class="question-options">${(slot ? [16, 18] : [1, 2]).map(value => `<button data-answer="${value}">${slot ? `${value} × ${value} mm` : `${value} × 45°`}</button>`).join('')}</div></article>`;
  $('#question button').focus({ preventScroll: true });
}
function start() {
  $('#conversation').replaceChildren();
  $('#progress-title').focus({ preventScroll: true });
  progress('reading', '正在查看案例图纸', '示例外形：六角对边 30 mm，总高 30 mm');
  message('user', '请根据这张图纸建立三维模型，不清楚的尺寸先与我确认。');
  later(() => {
    message('assistant', '已载入脱敏案例。先确认方槽尺寸，再建立主体和端部特征。');
    question('slot');
  }, 1400);
}
function accept(value) {
  const slot = state.phase === 'slot';
  $('#progress-title').focus({ preventScroll: true });
  $('#question').hidden = true;
  $('#question').replaceChildren();
  if (slot) {
    state.slot = value;
    message('user', `方槽采用 ${value} × ${value} mm。`);
    message('assistant', '已记录。现在建立六角主体。');
    progress('body', '正在建立六角主体', '建立第一个步骤检查点');
    later(() => { checkpoint(1); question('chamfer'); }, 1600);
  } else {
    state.chamfer = value;
    message('user', `两端倒角采用 ${value} × 45°。`);
    message('assistant', '收到，总高度保持 30 mm，依次处理端部倒角和四方通槽。');
    progress('bevel', '正在展示端部倒角', '保留主体步骤，便于回看');
    later(() => {
      checkpoint(2);
      progress('opening', '正在展示四方通槽', `方槽 ${state.slot} × ${state.slot} mm`);
      later(() => {
        checkpoint(3);
        progress('complete', '半成品已就绪', '演示到此结束 · 侧面销孔尚未加工');
        message('assistant', `半成品已展示：总高 30 mm，方槽 ${state.slot} × ${state.slot} mm，两端倒角 ${state.chamfer} × 45°。可以旋转模型或回看建模步骤；点击“重新体验”再次开始。`);
      }, 1500);
    }, 1500);
  }
}
function dialog(title, html) {
  $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = html;
  $('#dialog').showModal();
}
$('#dialog-close').onclick = () => $('#dialog').close();
$('#dialog').addEventListener('click', event => {
  if (event.target !== $('#dialog')) return;
  const box = $('#dialog').getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) $('#dialog').close();
});
$('#start').onclick = start;
$('#reset').onclick = reset;
$('#question').addEventListener('click', event => {
  const button = event.target.closest('[data-answer]');
  if (button) accept(Number(button.dataset.answer));
});
function compare(enabled) {
  $('#drawing-pane').hidden = !enabled;
  for (const [id, active] of [['compare-tab', enabled], ['model-tab', !enabled]]) {
    $(`#${id}`).classList.toggle('active', active);
    $(`#${id}`).setAttribute('aria-selected', String(active));
  }
}
$('#model-tab').onclick = () => compare(false);
$('#compare-tab').onclick = () => compare(true);
$$('[data-view]').forEach(button => { button.onclick = () => viewer.view(button.dataset.view); });
$('#fit').onclick = () => viewer.fit();
$('#section').onclick = () => {
  state.section = !state.section;
  viewer.section(state.section);
  $('#section').setAttribute('aria-pressed', String(state.section));
  $('#section-caption').hidden = !state.section;
};
$('#enlarge').onclick = () => dialog('脱敏图纸示意', '<p>此素材不含原始客户图纸。</p><img src="./drawing-mosaic.svg" alt="放大的马赛克示意图纸">');
$('#about').onclick = () => dialog('体验说明', '<p>本页面展示图纸工坊项目的协作方式。选择两个预设问题的答案，查看主体、倒角与方槽三个步骤。</p><p>对话与参数为模拟数据，三维模型由浏览器展示；不调用实时 AI 或 FreeCAD，不用于制造。</p>');
$('#steps').onclick = () => dialog('建模步骤', state.versions.map(version => `<button class="version-item" data-stage="${version.stage}"><span>版本 ${String(version.stage).padStart(2, '0')} · ${labels[version.stage - 1]}</span><span>${state.selected === version.stage ? '当前查看' : '查看 →'}</span></button>`).join('') + '<p>总高 30 mm。每个版本对应一个建模步骤，侧面销孔尚未加工。</p>');
$('#dialog-body').addEventListener('click', event => {
  const button = event.target.closest('[data-stage]');
  if (!button) return;
  state.selected = Number(button.dataset.stage);
  showModel(state.versions[state.selected - 1]);
  $('#dialog').close();
});
try {
  viewer = createViewer($('#model-canvas'), $('#viewport'), name => {
    $$('[data-view]').forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  });
  reset();
  demoReady();
} catch (error) {
  $('#viewer-error').hidden = false;
  $('#model-canvas').hidden = true;
  $('#status').textContent = '三维展示未能启动';
  $('#progress-title').textContent = '演示未能启动';
  $('#progress-detail').textContent = '当前浏览器无法显示三维模型';
  for (const button of [$('#start'), $('#reset'), $('#steps'), $('#section'), $('#fit'), ...$$('[data-view]')]) button.disabled = true;
  console.error(error);
}
addEventListener('pagehide', event => {
  if (!event.persisted) { clearTimeout(timer); viewer?.dispose(); }
});
