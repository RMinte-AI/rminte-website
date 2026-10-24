/* Navigation island: one pill follows the pointer or keyboard focus between the links, and the pill for the current page or chapter glides
   to its new link instead of jumping (styles.css, ".nav-glide"). Reduced motion: no pills are added, the links keep their own backgrounds. */
(() => {
  const island = document.querySelector('.nav-island');
  if (!island || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const hover = document.createElement('span'), current = document.createElement('span');
  hover.className = 'nav-glide-hover'; current.className = 'nav-glide-current';
  hover.setAttribute('aria-hidden', 'true'); current.setAttribute('aria-hidden', 'true');
  island.classList.add('nav-glide');
  island.setAttribute('data-glide', '');
  island.prepend(hover, current);

  const place = (pill, link, instant) => {
    if (!link) { pill.style.opacity = 0; return; }
    if (instant) pill.style.transition = 'none';
    pill.style.opacity = 1;
    pill.style.transform = `translate(${link.offsetLeft}px,${link.offsetTop}px)`;
    pill.style.width = link.offsetWidth + 'px'; pill.style.height = link.offsetHeight + 'px';
    if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
  };
  let placed = false;
  const update = () => {
    // the home page and a language change rebuild the links with replaceChildren(), which also removes the pills
    if (!island.contains(current)) { island.prepend(hover, current); placed = false; }
    place(current, island.querySelector('a.active,a[aria-current="page"]'), !placed);
    placed = true;
  };
  const showHover = (event) => {
    const link = event.target.closest && event.target.closest('a');
    if (link && island.contains(link)) place(hover, link, hover.style.opacity !== '1');
  };
  island.addEventListener('pointerover', showHover);
  island.addEventListener('focusin', showHover);
  island.addEventListener('pointerleave', () => { hover.style.opacity = 0; });
  island.addEventListener('focusout', () => { hover.style.opacity = 0; });
  // links are replaced on a language change and the current chapter changes while scrolling
  new MutationObserver(update).observe(island, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-current'] });
  const redo = () => { placed = false; update(); };
  addEventListener('resize', redo);
  if (document.fonts) document.fonts.ready.then(redo);
  update();
})();
