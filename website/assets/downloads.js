(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  let lang = RM_I18N.initial();
  let currentRelease;

  function applyRelease() {
    if (!currentRelease) return;
    $("[data-tianshan-release-notes]").href = currentRelease.release_url;
    $$("[data-tianshan-file]").forEach(link => {
      const kind = link.dataset.tianshanFile;
      link.href = `https://ota.rminte.com/${kind}?release=${currentRelease.snapshot}`;
      const line = $("p[data-download-text]", link.closest(".download-row"));
      line.textContent = `${RM_I18N.text(line.dataset, lang)} · ${currentRelease.tag} · ${(currentRelease[kind].size / 1024 / 1024).toFixed(1)} MB`;
    });
  }

  async function loadRelease() {
    try {
      const response = await fetch("https://ota.rminte.com/release", { cache: "no-store" });
      if (!response.ok) throw new Error(`Release lookup: ${response.status}`);
      currentRelease = await response.json();
      applyRelease();
      applyBrandFonts();
    } catch (error) {
      console.warn("TianShanOS release metadata unavailable", error);
    }
  }

  function applyBrandFonts(root = document.body) {
    const textNodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest('.rm-mark, [data-brand-font="ui"], script, style')) continue;
      if (/(?:RM-01|TianShanOS|TianshanOS|RMinte(?:\s+AI\b)?)(?![A-Za-z0-9_-]|\.[A-Za-z0-9])/.test(node.nodeValue)) textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      const parts = textNode.nodeValue.split(/(RM-01|TianShanOS|TianshanOS|RMinte(?:\s+AI\b)?)(?![A-Za-z0-9_-]|\.[A-Za-z0-9])/g);
      const fragment = document.createDocumentFragment();
      parts.forEach((part) => {
        if (/^(RM-01|TianShanOS|TianshanOS|RMinte(?:\s+AI\b)?)$/.test(part)) {
          const mark = document.createElement('span');
          mark.className = 'rm-mark';
          mark.textContent = part;
          fragment.appendChild(mark);
        } else if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      textNode.replaceWith(fragment);
    });
  }

  // A document line reads "description · language · N pages · PDF · size · date" in every language. Where it carries pages or a
  // date, the parts after the description are laid out as fields (language, pages, size, date); the text itself is unchanged.
  const PAGES = /^\d+\s*(?:页|pages?|ページ|페이지|쪽|páginas?)$/i;
  const SIZE = /^[\d.,]+\s?(?:[KMG]B|[KMG]o)$/;
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const FORMAT = /^[A-Z0-9]{2,5}$/;

  // Every action is named after the file it belongs to ("Download" plus the file title): the bare word, repeated for every file,
  // tells a screen reader's link list nothing. Both pieces already exist in all six languages, so there is no new wording.
  function nameActions() {
    $$('.download-row, .download-release-row').forEach((row, index) => {
      const title = $('h3', row), action = $('.download-action, .download-release-link', row), label = action && $('[data-download-text]', action);
      if (!title || !label) return;
      title.id = title.id || `download-title-${index}`;
      label.id = label.id || `download-action-${index}`;
      action.setAttribute('aria-labelledby', `${label.id} ${title.id}`);
    });
  }

  function enhanceRows() {
    $$('.download-row').forEach((row) => {
      row.querySelector('.download-fields')?.remove();
      const copy = row.querySelector('.download-copy');
      const line = copy && copy.querySelector('p[data-download-text]');
      if (!line) return;
      const parts = line.textContent.split(' · ').map((part) => part.trim());
      const pagesAt = parts.findIndex((part, index) => index > 0 && PAGES.test(part));
      if (pagesAt < 0 && !parts.some((part, index) => index > 0 && DATE.test(part))) return; // not a document line: stays one muted line
      const fields = document.createElement('div');
      fields.className = 'download-fields';
      parts.slice(1).forEach((part, offset) => {
        const index = offset + 1;
        const kind = index === pagesAt - 1 ? 'language' : PAGES.test(part) ? 'pages' : SIZE.test(part) ? 'size' : DATE.test(part) ? 'date' : FORMAT.test(part) ? 'format' : 'other';
        const field = document.createElement('span');
        field.className = `download-field is-${kind}`;
        field.textContent = part;
        fields.append(field);
      });
      line.textContent = parts[0];
      copy.after(fields);
    });
  }

  // The index marks the category being read: the last one whose top is above the reading line, and the last one at the page end
  function setupIndex() {
    const links = $$('.download-overview-item');
    const sections = links.map((link) => $(link.getAttribute('href'))).filter(Boolean);
    if (!links.length || !sections.length) return;
    const mark = (id) => links.forEach((link) => {
      const on = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-current', on);
      if (on) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    let queued = false;
    const update = () => {
      queued = false;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const line = window.innerHeight * 0.4;
      const current = atEnd ? sections[sections.length - 1] : sections.filter((section) => section.getBoundingClientRect().top <= line).pop() || sections[0];
      mark(current.id);
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    links.forEach((link) => link.addEventListener('click', () => mark(link.getAttribute('href').slice(1))));
    update();
  }

  function applyLanguage(nextLang) {
    lang = nextLang;

    RM_I18N.apply(lang);

    $$('[data-download-text]').forEach((element) => {
      const value = RM_I18N.text(element.dataset, lang);
      if (value !== undefined) element.textContent = value;
    });
    enhanceRows();
    applyRelease();
    applyBrandFonts();



    const menuButton = $('[data-menu-toggle]');
    if (menuButton) {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-label', RM_I18N.text({zh: open ? '关闭菜单' : '打开菜单', en: open ? 'Close menu' : 'Open menu'}, lang));
    }

    RM_I18N.apply(lang);
    window.dispatchEvent(new CustomEvent('download-language-change', { detail: lang }));
  }

  function setupLanguage() {
    RM_I18N.mount('[data-download-lang-toggle]', next => applyLanguage(next));
    applyLanguage(lang);
  }

  function setupMenu() {
    const overlay = $('#mobileOverlay');
    const button = $('[data-menu-toggle]');
    if (!overlay || !button) return;

    overlay.inert = true;
    // While the full-screen menu is open nothing behind it may be reached from the keyboard (the overlay covers the page and the menu button)
    const pageParts = ['.skip-link', '.site-shell', 'main', 'body > .footer'].map((selector) => $(selector)).filter(Boolean);
    function setOpen(open) {
      const restoreFocus = !open && overlay.contains(document.activeElement);
      overlay.inert = !open;
      pageParts.forEach((part) => { part.inert = open; });
      if (open) requestAnimationFrame(() => $('[data-menu-close]')?.focus({ preventScroll: true }));
      else if (restoreFocus) button.focus({ preventScroll: true });
      overlay.classList.toggle('active', open);
      overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
      button.classList.toggle('active', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', RM_I18N.text({zh: open ? '关闭菜单' : '打开菜单', en: open ? 'Close menu' : 'Open menu'}, lang));
    }

    button.addEventListener('click', () => setOpen(!button.classList.contains('active')));
    $('[data-menu-close]')?.addEventListener('click', () => setOpen(false));
    $$('.mobile-links a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  window.addEventListener('download-resources-change',()=>{nameActions();applyBrandFonts(document.querySelector('#dealer-list'));});
  nameActions();
  setupLanguage();
  setupMenu();
  setupIndex();
  loadRelease();
})();
