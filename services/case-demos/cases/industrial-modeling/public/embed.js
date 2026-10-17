// Embed contract. No model server, CAD process or customer data is involved.
if (parent !== window) {
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
    // Escape closes an inner size/history dialog first, then the outer demo.
    if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      parent.postMessage({type: 'case-demo-close'}, location.origin);
    }
  }, true);
}
