export function attachPressBehavior(el) {
  if (!el) return;
  const onDown = () => el.classList.add('pressed');
  const onUp = () => el.classList.remove('pressed');

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  el.addEventListener('blur', onUp);

  // Cleanup handle
  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    el.removeEventListener('blur', onUp);
  };
}
