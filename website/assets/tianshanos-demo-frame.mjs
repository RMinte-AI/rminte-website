// Keep the actual device UI in a 1440px viewport; scale only its presentation.
export function mountDemoFrame(frame, viewport) {
  let height = 720;
  function layout() {
    const scale = Math.min(1, viewport.clientWidth / 1440);
    frame.style.width = '1440px';
    frame.style.height = `${height}px`;
    frame.style.transformOrigin = 'top left';
    frame.style.transform = `scale(${scale})`;
    viewport.style.height = `${Math.ceil(height * scale)}px`;
    frame.contentWindow.postMessage({type:'tianshanos-demo-layout'}, location.origin);
  }
  new ResizeObserver(layout).observe(viewport);
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type !== 'tianshanos-demo-height') return;
    if (!Number.isFinite(event.data.height) || event.data.height <= 0) return;
    height = event.data.height;
    layout();
  });
  layout();
  return {reset() { height = 720; layout(); }};
}
