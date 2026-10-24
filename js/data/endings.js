// Story endings. Added in front of the core ones, so the first matching `when` wins.
// TG.lavaDeath is set by the cliff cutscene when the hero skipped the cursed ring (not saved between runs).
TG.endings.unshift({
  id: 'lava',
  when: function () { return TG.lavaDeath === true; },
  title: 'Ashes',
  text: 'You left the ring where it lay. The lava did not hesitate.'
});
