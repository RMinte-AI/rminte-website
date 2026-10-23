/* Downloads and guides, small touches: on the downloads page one sapphire line slides between the category links as the current one
   changes, and the arrow on a download button drops into the tray when it is pressed (the label is untouched); on the guides page the
   search results rise one after another when they first appear. Reduced motion: none of it runs. */
(() => {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const overview = document.querySelector('.download-overview');
  if (overview) {
    const line = document.createElement('span');
    line.className = 'download-overview-line';
    line.setAttribute('aria-hidden', 'true');
    overview.append(line);
    overview.classList.add('is-glide');
    let placed = false;
    const move = () => {
      const link = overview.querySelector('.download-overview-item.is-current');
      // in the narrow layout the links are pills in a row and keep their own marker
      if (!link || getComputedStyle(overview).position !== 'sticky') { line.style.opacity = 0; placed = false; return; }
      if (!placed) line.style.transition = 'none';
      line.style.opacity = 1;
      line.style.transform = `translateY(${link.offsetTop + 6}px)`;
      line.style.height = `${link.offsetHeight - 12}px`;
      if (!placed) { void line.offsetWidth; line.style.transition = ''; placed = true; }
    };
    new MutationObserver(move).observe(overview, { attributes: true, subtree: true, attributeFilter: ['class'] });
    addEventListener('resize', move);
    move();
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.download-action');
    if (!button) return;
    button.classList.remove('is-sent'); void button.offsetWidth; button.classList.add('is-sent');
    setTimeout(() => button.classList.remove('is-sent'), 1000);
  });
  const results = document.querySelector('[data-guide-search-results]');
  const list = document.querySelector('[data-guide-search-result-list]');
  if (results && list) {
    // only the first appearance animates; typing on replaces the list without replaying it
    let had = false;
    new MutationObserver(() => {
      const has = list.children.length > 0;
      if (has && !had) { [...list.children].forEach((item, i) => item.style.setProperty('--i', Math.min(i, 8))); list.classList.add('is-entering'); setTimeout(() => list.classList.remove('is-entering'), 900); }
      had = has;
    }).observe(list, { childList: true });
    new MutationObserver(() => { if (results.hidden) had = false; }).observe(results, { attributes: true, attributeFilter: ['hidden'] });
  }
})();
