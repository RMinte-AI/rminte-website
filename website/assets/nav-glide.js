/* Navigation island: one pill follows the pointer or keyboard focus between the links, and the pill for the current page or chapter glides
   to its new link instead of jumping. Both pills copy the look the page already gives its current link (read from the link itself), so
   the island looks as before when nothing moves. Reduced motion: no pills are added, the links keep their own backgrounds. */
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
    const link = island.querySelector('a.active,a[aria-current="page"]');
    if (link) {
      // The page's own look for its current link decides the pill: translucent grey (home chapters, cases) or silver (other pages).
      // It is read from a copy of the link in a hidden island of its own, which has no pills' overrides and no transitions.
      const probeIsland = document.createElement('div');
      probeIsland.className = island.className.replace('nav-glide', '').trim();
      probeIsland.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none';
      const probe = link.cloneNode(false);
      probe.style.transition = 'none';
      probeIsland.append(probe);
      document.body.append(probeIsland);
      const channels = getComputedStyle(probe).backgroundColor.match(/[\d.]+/g) || [];
      probeIsland.remove();
      current.dataset.kind = channels.length > 3 && +channels[3] <= .5 ? 'chapter' : 'page';
    }
    place(current, link, !placed); placed = true;
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
