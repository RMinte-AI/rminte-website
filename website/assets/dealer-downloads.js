(() => {
  const dialog = document.querySelector('.dealer-dialog');
  const title = document.querySelector('#dealerDialogTitle');
  const message = document.querySelector('#dealerDialogMessage');
  const help = document.querySelector('[data-dealer-help]');
  const login = document.querySelector('[data-case-login]');
  let opener;
  let lang = RM_I18N.initial();
  let state = 'login';
  const COPY = {
    login: {
      title: { zh: '下载前请先登录', en: 'Sign in to download' },
      message: { zh: '未登录，需要登录后才能下载。', en: 'You are not signed in. Please sign in before downloading.' },
      help: { zh: '请前往案例页面，使用已有账号登录。', en: 'Go to the cases page and sign in with your existing account.' }
    },
    forbidden: {
      title: { zh: '没有权限', en: 'Access denied' },
      message: { zh: '此账号尚未获得经销商资料下载权限，请联系账号发放人。', en: 'This account is not authorised to download dealer resources. Please contact the person who issued your account.' },
      help: { zh: '权限开通后，可直接重新下载，无需再次登录。', en: 'Once access is granted, try downloading again. You do not need to sign in again.' }
    },
    unavailable: {
      title: { zh: '暂时无法下载', en: 'Download unavailable' },
      message: { zh: '资料暂时不可用，请稍后重试。', en: 'This document is temporarily unavailable. Please try again later.' },
      help: { zh: '如需帮助，请联系账号发放人。', en: 'For help, contact the person who issued your account.' }
    },
    password: {
      title: { zh: '请先修改初始密码', en: 'Change your initial password first' },
      message: { zh: '请前往管理后台修改初始密码，然后重新登录下载。', en: 'Change your initial password in the admin console, then sign in again to download.' },
      help: { zh: '如需帮助，请联系账号发放人。', en: 'For help, contact the person who issued your account.' }
    }
  };
  function render() {
    for (const [element, key] of [[title, 'title'], [message, 'message'], [help, 'help']]) {
      const pair = COPY[state][key];
      element.dataset.zh = pair.zh;
      element.dataset.en = pair.en;
      element.textContent = RM_I18N.text(pair, lang);
    }
    login.href = `../cases/?lang=${lang}#access`;
    login.hidden = state !== 'login';
    if (opener) document.querySelector('#requestedFile').textContent = opener.closest('.download-row').querySelector('h3').textContent;
  }
  window.addEventListener('download-language-change', event => { lang = event.detail; render(); });
  document.querySelectorAll('[data-dealer-download]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      if (link.getAttribute('aria-busy') === 'true') return;
      opener = link;
      link.setAttribute('aria-busy', 'true');
      try {
        // The download request itself checks the current case-page session; no cached login decision.
        const response = await fetch(link.href, { credentials: 'same-origin', cache: 'no-store' });
        if (!response.ok) {
          state = response.status === 401 ? 'login' : 'unavailable';
          if (response.status === 403) {
            const { code } = await response.json();
            state = code === 'dealer_download_forbidden' ? 'forbidden' : code === 'password_change_required' ? 'password' : 'unavailable';
          }
          render();
          dialog.showModal();
          document.querySelector('[data-dealer-close]').focus();
          return;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const download = document.createElement('a');
        download.href = url;
        download.download = link.closest('.download-row').querySelector('h3').textContent + '.pdf';
        download.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } catch {
        state = 'unavailable';
        render();
        dialog.showModal();
        document.querySelector('[data-dealer-close]').focus();
      } finally {
        link.removeAttribute('aria-busy');
      }
    });
  });
  document.querySelectorAll('[data-dealer-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
})();
