import {mountDemoFrame} from '../../assets/tianshanos-demo-frame.mjs';

const frame = document.getElementById('demo-preview');
const viewport = document.getElementById('demo-viewport');
const chinese = new URLSearchParams(location.search).get('lang')?.startsWith('zh');
document.documentElement.lang = chinese ? 'zh-CN' : 'en';
document.getElementById('mobile-message').textContent = chinese ? '请用电脑查看完整演示。' : 'Please use a computer to view the full demo.';
mountDemoFrame(frame, viewport);
const source = new URL('system.html', location.href);
source.searchParams.set('lang', chinese ? 'zh' : 'en');
source.hash = location.hash;
frame.src = source.href;
addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'tianshanos-demo-dialog') document.body.classList.toggle('has-demo-dialog', event.data.open === true);
});
