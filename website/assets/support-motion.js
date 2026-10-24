/* Downloads page, small touches: one sapphire line slides between the category links as the current one changes, and the arrow on a
   download button drops into the tray when it is pressed (the label is untouched). Reduced motion: none of it runs. */
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
      if (!link) { line.style.opacity = 0; placed = false; return; }
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
  });
})();
