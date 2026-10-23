/* Home: the figures of the thermal and craft chapters (0.13 mm, 6063, R0.2, <0.03) light up character by character with the same hard-edged
   sweep as the hero figures (styles.css, ".fig-sweep"), each time they scroll into view. The craft figures wait for their panel while the
   chapter is a scroll story. Reduced motion: the figures are left as plain text. */
(() => {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const figures = [...document.querySelectorAll('.thermal-detail strong, .craft-story-value')];
  figures.forEach((figure) => {
    let index = 0;
    const wrap = (node, unit) => [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const fragment = document.createDocumentFragment();
        [...child.nodeValue].forEach((character) => {
          if (!character.trim()) { fragment.append(character); return; }
          const span = document.createElement('span');
          span.className = unit ? 'fig-ch is-unit' : 'fig-ch';
          span.style.setProperty('--ci', index++);
          span.textContent = character;
          fragment.append(span);
        });
        child.replaceWith(fragment);
      } else if (child.tagName === 'SMALL') wrap(child, true);
    });
    wrap(figure, false);
    figure.classList.add('fig-sweep');
    const total = figure.querySelectorAll('.fig-ch').length;
    let finished = 0, visible = false;
    figure.addEventListener('animationend', (event) => { if (event.animationName === 'fig-scan' && ++finished >= total) figure.classList.add('is-done'); });
    const panel = figure.closest('.craft-story-panel');
    const ready = () => !panel || !panel.closest('.is-scroll-story') || panel.classList.contains('is-active');
    const light = () => { figure.classList.remove('is-lit', 'is-done'); void figure.offsetWidth; finished = 0; figure.classList.add('is-lit'); };
    const update = () => { if (visible && ready()) { if (!figure.classList.contains('is-lit')) light(); } else figure.classList.remove('is-lit', 'is-done'); };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: .6 }).observe(figure);
    if (panel) new MutationObserver(update).observe(panel, { attributes: true, attributeFilter: ['class'] });
  });
})();
