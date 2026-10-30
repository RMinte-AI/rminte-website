(() => {
  const dialog = document.getElementById('knowledgeDialog');
  const trigger = document.getElementById('knowledgeEntryLink');
  const prompt = document.getElementById('knowledgePrompt');
  const copy = document.getElementById('knowledgeCopyButton');
  const status = document.getElementById('knowledgeCopyStatus');
  let previousOverflow;
  let opening = 0;
  let backdropPressed = false;
  trigger.addEventListener('click', event => {
    event.preventDefault();
    opening += 1;
    status.textContent = '';
    const zh = document.documentElement.lang.startsWith('zh');
    prompt.value = zh ? prompt.dataset.promptZh : prompt.dataset.promptEn;
    prompt.lang = zh ? 'zh-CN' : 'en';
    prompt.scrollTop = 0;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  });
  dialog.querySelector('[data-knowledge-close]').addEventListener('click', () => dialog.close());
  function isBackdrop(event) {
    const r = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom);
  }
  dialog.addEventListener('pointerdown', event => { backdropPressed = isBackdrop(event); });
  dialog.addEventListener('click', event => {
    if (backdropPressed && isBackdrop(event)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    trigger.focus({ preventScroll: true });
  });
  copy.addEventListener('click', async () => {
    const copyOpening = opening;
    copy.disabled = true;
    let message;
    try {
      await navigator.clipboard.writeText(prompt.value);
      message = {zh: '已复制，发送给你的 Agent 即可。', en: 'Copied. Send it to your agent.'};
    } catch {
      message = {zh: '复制未成功，请选中文字后手动复制。', en: 'Copy failed. Select the instructions and copy them manually.'};
    }
    copy.disabled = false;
    if (copyOpening === opening && dialog.open) status.textContent = RM_I18N.text(message);
  });
})();
