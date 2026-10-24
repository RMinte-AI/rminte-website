/* Home, "TianshanOS" figure: the modules come in from the middle one after another while the figure scrolls into view, each wire draws once
   both of its ends are in place, and the labels and the travelling light come last. It is driven by the scroll position (the middle of the
   figure at the window's bottom edge = 0, the whole figure in view = 1) and eased, so scrolling back un-builds it. Reduced motion: the
   figure is left as drawn by home-architecture.js. */
(() => {
  const graph = document.getElementById('networkGraph');
  if (!graph || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  // when each module starts (fraction of the build), and which two modules each wire joins
  const start = { switch: 0, 'nic-cuda': .08, 'nic-x86': .08, cuda: .2, x86: .2, 'storage-cuda': .3, 'storage-x86': .3, mcu: .4, ethernet: .4, config: .5 };
  const wires = { 'management-spi': ['mcu', 'ethernet'], 'management-config': ['mcu', 'config'], 'management-network': ['ethernet', 'switch'], 'cuda-pcie': ['cuda', 'nic-cuda'], 'cuda-network': ['nic-cuda', 'switch'], 'x86-pcie': ['x86', 'nic-x86'], 'x86-network': ['nic-x86', 'switch'], 'cuda-storage': ['cuda', 'storage-cuda'], 'x86-storage': ['x86', 'storage-x86'] };
  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  let parts = [], routes = [], pads = [], names = [];
  let target = 0, shown = 0, frame = 0;

  const collect = () => {
    parts = [...graph.querySelectorAll('.part-frame')];
    routes = [...graph.querySelectorAll('[data-route]')];
    routes.forEach((route) => route.setAttribute('pathLength', '1'));
    pads = [...graph.querySelectorAll('[data-pad]')];
    names = [...graph.querySelectorAll('.system-label')];
  };
  const progress = () => {
    const box = graph.getBoundingClientRect(), height = innerHeight, middle = box.top + box.height / 2;
    const from = height, to = height * .9 - box.height / 2 - 40;
    return Math.max(0, Math.min(1, (from - middle) / Math.max(1, from - to)));
  };
  const draw = (p) => {
    parts.forEach((part) => {
      const begin = (start[part.dataset.node] ?? .3) * .6, e = smooth(begin, begin + .32, p), box = part.offsetParent;
      // pieces start a little toward the middle of the figure; offsets are layout values, so the pointer parallax (transform) is untouched
      const dx = box && box.offsetWidth ? (box.offsetWidth / 2 - (part.offsetLeft + part.offsetWidth / 2)) * .22 * (1 - e) : 0;
      const dy = box && box.offsetHeight ? (box.offsetHeight / 2 - (part.offsetTop + part.offsetHeight / 2)) * .22 * (1 - e) : 0;
      part.style.opacity = e.toFixed(3);
      part.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      part.style.scale = (.94 + .06 * e).toFixed(3);
    });
    routes.forEach((route) => {
      const [a, b] = wires[route.dataset.route] || [], begin = Math.max(start[a] ?? 0, start[b] ?? 0) * .6 + .3;
      route.style.strokeDasharray = '1 1';
      route.style.strokeDashoffset = (1 - smooth(begin, begin + .22, p)).toFixed(3);
    });
    const late = smooth(.82, 1, p).toFixed(3), padIn = smooth(.6, .85, p).toFixed(3);
    graph.style.setProperty('--asm-late', late); // the travelling light fades in through styles.css, which keeps its dim and lit values
    names.forEach((item) => { item.style.opacity = late; });
    pads.forEach((item) => { item.style.opacity = padIn; });
  };
  const step = () => {
    frame = 0;
    shown += (target - shown) * .16;
    if (Math.abs(target - shown) < .002) shown = target;
    draw(shown);
    if (shown !== target) frame = requestAnimationFrame(step);
  };
  const update = () => { target = progress(); if (!frame) frame = requestAnimationFrame(step); };

  collect();
  shown = target = progress();
  draw(shown);
  // the figure is drawn again when the language changes
  new MutationObserver(() => { collect(); draw(shown); }).observe(graph, { childList: true });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
})();
