// After a boss with a `decision` block: spare or kill. Logged to the Record for the ending.
TG.DecisionScene = class extends Phaser.Scene {
  constructor() { super('Decision'); }

  init(data) { this.d = data; }

  create() {
    var def = TG.bosses[this.d.boss], dec = def.decision, W = TG.W, H = TG.H;
    var st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
    this.cameras.main.setBackgroundColor(0x050206);
    var bg = this.add.graphics();
    TG.Art.gradient(bg, W, H, [[0, 0x050206], [0.7, 0x140609], [1, 0x3a100a]]);
    this.fx = new TG.FX(this);

    this.add.text(W / 2, 200, dec.prompt, Object.assign({ fontSize: '26px', align: 'center', wordWrap: { width: 900 }, fontStyle: 'italic' }, st)).setOrigin(0.5);
    this.opts = [
      { k: 'spare', t: this.add.text(W / 2 - 170, 400, dec.spare, Object.assign({ fontSize: '28px' }, st)).setOrigin(0.5) },
      { k: 'kill', t: this.add.text(W / 2 + 170, 400, dec.kill, Object.assign({ fontSize: '28px' }, st)).setOrigin(0.5) }
    ];
    this.add.text(W / 2, 470, 'A / D choose     Enter confirm', Object.assign({ fontSize: '14px', color: '#7d7894' }, st)).setOrigin(0.5);
    this.after = this.add.text(W / 2, 560, '', Object.assign({ fontSize: '22px', align: 'center', wordWrap: { width: 900 }, color: '#c9c4dc', fontStyle: 'italic' }, st)).setOrigin(0.5);

    this.sel = 0; this.locked = false;
    this.paint();
    var kb = this.input.keyboard;
    kb.on('keydown-A', function () { this.move(0); }, this);
    kb.on('keydown-LEFT', function () { this.move(0); }, this);
    kb.on('keydown-D', function () { this.move(1); }, this);
    kb.on('keydown-RIGHT', function () { this.move(1); }, this);
    kb.on('keydown-ENTER', this.confirm, this);
    kb.on('keydown-SPACE', this.confirm, this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  move(i) { if (!this.locked) { this.sel = i; this.paint(); } }

  paint() {
    for (var i = 0; i < this.opts.length; i++) {
      this.opts[i].t.setAlpha(i === this.sel ? 1 : 0.4).setScale(i === this.sel ? 1.08 : 1);
    }
  }

  confirm() {
    if (this.locked) return;
    this.locked = true;
    var key = this.opts[this.sel].k, dec = TG.bosses[this.d.boss].decision;
    TG.Record.decide(this.d.boss, key);
    this.after.setText(dec.after[key]);
    this.time.delayedCall(3600, function () {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, function () { TG.Flow.next(this, this.d.idx); }, [], this);
    }, [], this);
  }

  update(time, delta) {
    var dt = Math.min(delta, 50) / 1000;
    if (Math.random() < dt * 8) this.fx.ember(Math.random() * TG.W, TG.H + 10);
    this.fx.update(dt);
  }
};
