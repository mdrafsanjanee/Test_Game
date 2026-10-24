TG.BootScene = class extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    var b = document.getElementById('boot');
    if (b) b.classList.add('hidden');
    this.input.mouse && this.input.mouse.disableContextMenu();
    if (TG.debug.boss && TG.bosses[TG.debug.boss]) {
      this.scene.start('Arena', { boss: TG.debug.boss, idx: TG.Flow.index(TG.debug.boss), tries: 0 });
    } else this.scene.start('Menu');
  }
};
