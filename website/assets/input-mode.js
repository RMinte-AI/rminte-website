/* Which kind of input came last: a pointer or the keyboard. It is written to <html data-input="pointer"> and removed again by any key.
   Safari does not give a button the focus when it is clicked, so when a dialog or menu then moves focus to its close button by script, Safari
   counts that as keyboard focus and draws the focus ring (a sapphire circle round the round close buttons) until the next click elsewhere.
   styles.css hides the ring of links and buttons while data-input is "pointer"; keyboard users never see that attribute. */
(() => {
  const root = document.documentElement;
  addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; }, true);
  addEventListener('keydown', () => { delete root.dataset.input; }, true);
})();
