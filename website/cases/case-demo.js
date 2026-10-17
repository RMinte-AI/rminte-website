// Same presentation as the TianshanOS preview: lazy-loaded, same-origin iframe.
// The case gateway, rather than this dialog, enforces access to every asset.
(() => {
  const modal = document.getElementById('case-demo-modal');
  const frame = document.getElementById('case-demo-frame');
  const close = modal.querySelector('[data-case-demo-close]');
  let opener;
  window.CASE_DEMO = {
    open(url, trigger) {
      opener = trigger;
      frame.style.height = '820px';
      frame.src = url;
      modal.showModal();
      document.body.classList.add('case-demo-open');
      close.focus({preventScroll: true});
    }
  };
  close.addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const box = modal.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) modal.close();
  });
  modal.addEventListener('close', () => {
    // Tear down WebGL and pending demo timers; reopening starts a fresh experience.
    frame.src = 'about:blank';
    document.body.classList.remove('case-demo-open');
    opener?.focus({preventScroll: true});
  });
  addEventListener('message', event => {
    if (!modal.open || event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'case-demo-close') modal.close();
    if (event.data?.type === 'case-demo-height' && Number.isFinite(event.data.height) && event.data.height > 0) {
      frame.style.height = `${Math.min(4000, Math.ceil(event.data.height))}px`;
    }
  });
})();
