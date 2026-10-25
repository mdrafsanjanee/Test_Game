TG.BootScene = class extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    var b = document.getElementById('boot');
    if (b) b.classList.add('hidden');
    this.input.mouse && this.input.mouse.disableContextMenu();
    var fl = new URLSearchParams(location.search).get('flag');               // ?flag=picked_cursed_item,burned_lost_part  (dev: set story flags)
    if (fl) fl.split(',').forEach(function (k) { TG.Story.flag(k, true); });
    if (TG.debug.boss && TG.bosses[TG.debug.boss]) {
      this.scene.start('Arena', { boss: TG.debug.boss, idx: TG.Flow.index(TG.debug.boss), tries: 0 });
    } else if (TG.debug.cut && TG.cutscenes[TG.debug.cut]) {
      this.scene.start('Cutscene', { id: TG.debug.cut, idx: TG.Flow.index('cut:' + TG.debug.cut) });
    } else this.scene.start('Menu');
  }
};
