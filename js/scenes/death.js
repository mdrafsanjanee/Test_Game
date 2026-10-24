// Death screen. Every boss respawns you at the fight's checkpoint, but only the Mirror asks the question.
TG.DeathScene = class extends Phaser.Scene {
  constructor() { super('Death'); }

  init(data) { this.d = data; }

  create() {
    var def = TG.bosses[this.d.boss], W = TG.W, H = TG.H, mirror = this.d.boss === 'mirror';
    var st = { fontFamily: 'Georgia, serif', color: mirror ? '#f0d6d6' : '#c9c4dc' };
    this.cameras.main.setBackgroundColor(0x000000);
    if (TG.Music) TG.Music.fadeOut(300);
    var line = this.add.text(W / 2, H / 2 - 10, def.deathText || 'You have fallen.',
      Object.assign({ fontSize: mirror ? '46px' : '34px', fontStyle: 'italic', align: 'center' }, st)).setOrigin(0.5).setAlpha(0);
    var hint = this.add.text(W / 2, H / 2 + 70, this.d.tries > 1 ? 'Enter  try again   (' + this.d.tries + ')' : 'Enter  try again',
      Object.assign({ fontSize: '16px', color: '#7d7894' }, { fontFamily: 'Georgia, serif' })).setOrigin(0.5).setAlpha(0);
    var esc = this.add.text(W / 2, H / 2 + 98, 'Esc  menu', { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#5f5a74' }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: line, alpha: 1, duration: mirror ? 2600 : 1200, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: [hint, esc], alpha: 1, duration: 700, delay: mirror ? 3200 : 1700 });
    this.ready = false;
    this.time.delayedCall(mirror ? 3200 : 1700, function () { this.ready = true; }, [], this);

    var kb = this.input.keyboard;
    kb.on('keydown-ENTER', this.retry, this);
    kb.on('keydown-SPACE', this.retry, this);
    kb.on('keydown-ESC', function () { this.scene.start('Menu'); }, this);
  }

  retry() {
    if (!this.ready) return;
    this.ready = false;
    this.scene.start('Arena', { boss: this.d.boss, idx: this.d.idx, tries: this.d.tries });
  }
};
