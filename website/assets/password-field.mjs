const labels = {
 zh: ['显示密码', '隐藏密码'], en: ['Show password', 'Hide password'],
 ja: ['パスワードを表示', 'パスワードを非表示'], ko: ['비밀번호 표시', '비밀번호 숨기기'],
 es: ['Mostrar contraseña', 'Ocultar contraseña'], fr: ['Afficher le mot de passe', 'Masquer le mot de passe']
};

export function refreshPasswordButtons(root = document) {
 const language = document.documentElement.lang.split('-')[0];
 const text = labels[language] || labels.en;
 for (const button of root.querySelectorAll('.cs-password-toggle')) {
  const visible = button.previousElementSibling.type === 'text';
  button.setAttribute('aria-label', text[Number(visible)]);
  button.setAttribute('aria-pressed', String(visible));
 }
}

export function enhancePasswords(root) {
 for (const input of root.querySelectorAll('input[type="password"]')) {
  const label = input.closest('label').querySelector(':scope > span');
  label.id = `password-label-${input.name}`;
  input.setAttribute('aria-labelledby', label.id);
  const wrapper = document.createElement('span');
  wrapper.className = 'cs-password';
  input.before(wrapper);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cs-password-toggle';
  wrapper.append(input, button);
  button.addEventListener('click', () => {
   input.type = input.type === 'password' ? 'text' : 'password';
   refreshPasswordButtons(wrapper);
  });
  input.form.addEventListener('reset', () => {
   input.type = 'password';
   refreshPasswordButtons(wrapper);
  });
 }
 refreshPasswordButtons(root);
}
