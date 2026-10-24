const Input = (() => {
  const down = new Set();
  const pressed = new Set();
  window.addEventListener('keydown', (e) => { if (e.repeat) return; down.add(e.code); pressed.add(e.code); });
  window.addEventListener('keyup', (e) => down.delete(e.code));
  return { isDown: (c) => down.has(c), justPressed: (c) => pressed.has(c), endFrame: () => pressed.clear() };
})();
