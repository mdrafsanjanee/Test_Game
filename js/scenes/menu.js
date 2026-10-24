TG.MenuScene = class extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    var W = TG.W, H = TG.H, st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
    var bg = this.add.graphics();
    TG.Art.gradient(bg, W, H, [[0, 0x05030a], [0.6, 0x1c0a10], [1, 0x5a1a0c]]);
    this.hero = this.add.graphics();
    this.fx = new TG.FX(this);
    this.t = 0;
    this.pose = TG.Pose.make();
    this.rigCfg = Object.assign({}, TG.Rig.defaults, { scale: 2.2, rim: 0xa8c4ff, rimA: 0.6, rimW: 3 });
    this.rigCfg.weapon = Object.assign({}, TG.Rig.defaults.weapon, { len: 46 });

    this.add.text(W / 2, 150, 'TEST GAME', Object.assign({ fontSize: '64px', letterSpacing: 12 }, st)).setOrigin(0.5);
    this.add.text(W / 2, 205, 'prototype', Object.assign({ fontSize: '16px', color: '#8a85a0', fontStyle: 'italic' }, st)).setOrigin(0.5);

    var n = TG.Record.save.fights.length;
    this.add.text(W / 2, 395, 'ENTER   begin', Object.assign({ fontSize: '22px' }, st)).setOrigin(0.5);
    this.add.text(W / 2, 430, 'M   face the mirror now' + (n ? '   (uses your last ' + Math.min(5, n) + ' fights)' : ''),
      Object.assign({ fontSize: '16px', color: '#a7a2bd' }, st)).setOrigin(0.5);
    this.add.text(W / 2, 458, 'R   erase the record', Object.assign({ fontSize: '16px', color: '#a7a2bd' }, st)).setOrigin(0.5);

    this.add.text(W / 2, 560,
      'A / D  move     W / Space  jump (twice)     J  strike     K  heavy swing     L  dash     I  roll (hurts)\nH  hold to heal (8 hits / 4 heavy)     S + jump  drop through     Esc / P  pause     N  mute',
      Object.assign({ fontSize: '15px', align: 'center', color: '#8a85a0', lineSpacing: 8 }, st)).setOrigin(0.5);

    var kb = this.input.keyboard;
    kb.on('keydown-ENTER', function () { this.go(0); }, this);
    kb.on('keydown-SPACE', function () { this.go(0); }, this);
    kb.on('keydown-M', function () { this.go(TG.Flow.index('mirror')); }, this);
    kb.on('keydown-R', function () { TG.Record.reset(); this.scene.restart(); }, this);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    if (TG.Music) TG.Music.play('menu');
  }

  go(idx) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, function () { TG.Flow.start(this, idx); }, [], this);
  }

  update(time, delta) {
    var dt = Math.min(delta, 50) / 1000;
    this.t += dt;
    TG.Pose.idle(this.pose, this.t);
    this.hero.clear();
    TG.Rig.draw(this.hero, 640, 340, 1, this.pose, this.rigCfg, 1);
    if (Math.random() < dt * 14) this.fx.ember(Math.random() * TG.W, TG.H + 10);
    this.fx.update(dt);
  }
};
