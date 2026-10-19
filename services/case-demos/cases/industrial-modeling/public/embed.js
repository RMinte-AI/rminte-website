// Apply the iframe layout before styles and the Three.js module graph load.
const embedded = new URLSearchParams(location.search).get('embed') === '1';
if (embedded) document.documentElement.classList.add('embedded');

document.addEventListener('DOMContentLoaded', () => {
  if (embedded) document.getElementById('brand-home').href = './?embed=1';
  if (parent === window) return;
  let lastHeight = 0;
  const report = () => {
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    if (height !== lastHeight) {
      lastHeight = height;
      parent.postMessage({type: 'case-demo-height', height}, location.origin);
    }
  };
  new ResizeObserver(report).observe(document.body);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      parent.postMessage({type: 'case-demo-close'}, location.origin);
    }
  }, true);
});
