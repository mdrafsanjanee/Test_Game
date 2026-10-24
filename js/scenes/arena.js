// The fight scene. Fixed 60Hz simulation, hitstop, camera, HUD, subtitles.
TG.ArenaScene = class extends Phaser.Scene {
  constructor() { super('Arena'); }

  init(data) {
    this.bossId = data.boss;
    this.idx = data.idx != null ? data.idx : TG.Flow.index(data.boss);
    this.tries = data.tries || 0;
  }

  create() {
    var def = TG.bosses[this.bossId], area = TG.areas[def.area];
    this.def = def; this.area = area;
    this.world = new TG.World(area);
    this.fx = new TG.FX(this);
    this.combat = new TG.Combat(this);
    this.fighters = []; this.projectiles = [];
    this.pg = this.add.graphics().setDepth(12);
    this.clock = 0; this.nowMs = 0; this.acc = 0; this.freeze = 0; this.slow = 1; this.over = false;

    this.areaUpdate = area.build(this);

    this.ctrl = TG.debug.bot ? new TG.Ctrl() : new TG.KeyboardCtrl(this);
    this.player = new TG.Player(this, area.spawn.player, area.groundY, { team: 'hero', ctrl: this.ctrl });
    this.player.y = area.groundY - 2;
    if (TG.debug.bot) this.player.brain = new TG.MirrorBrain(this.player, TG.Record.profile(5), { react: 0.3 });
    this.boss = def.create(this, area.spawn.boss, area.groundY - 2);
    this.fighters.push(this.player, this.boss);
    this.cameraX = Math.max(0, area.spawn.player - TG.W / 2);
    this.cameras.main.setScroll(this.cameraX, 0);

    TG.Record.begin(this.bossId);
    this.buildHud();
    this.cameras.main.fadeIn(500, 0, 0, 0);
    if (def.onStart) def.onStart(this);

    this.input.keyboard.on('keydown-ESC', function () { this.finishRecord('quit'); this.scene.start('Menu'); }, this);
    this.input.keyboard.on('keydown-F2', function () { TG.debug.god = !TG.debug.god; }, this);
  }

  // ---- services used by fighters and bosses ------------------------------------
  hitstop(ms) { this.freeze = Math.max(this.freeze, ms / 1000); }
  shake(intensity, ms) { this.cameras.main.shake(ms, intensity, true); }
  addProjectile(p) { p.age = 0; this.projectiles.push(p); }

  say(lines) {
    if (!Array.isArray(lines)) lines = [lines];
    for (var i = 0; i < lines.length; i++) this.subQ.push(TG.Story.line(lines[i]));
  }

  onFighterDead(f) {
    if (f === this.player) this.lose(); else this.onBossDefeated(f);
  }

  finishRecord(res) { if (TG.Record.live) TG.Record.end(res); }

  lose() {
    if (this.over) return;
    this.over = true;
    this.finishRecord('lose');
    this.slow = 0.3;
    this.time.delayedCall(1500, function () {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, function () {
        this.scene.start('Death', { boss: this.bossId, idx: this.idx, tries: this.tries + 1 });
      }, [], this);
    }, [], this);
  }

  onBossDefeated(b) {
    if (this.over) return;
    this.over = true;
    this.finishRecord('win');
    this.freeze = 0.28;
    this.slow = 0.35;
    this.shake(0.012, 500);
    this.fx.ring(b.x, b.y - 60, 10, 420, 0xffffff, 0.8, 5);
    if (this.def.onDefeated) this.def.onDefeated(this);
    this.time.delayedCall(1300, function () { this.slow = 1; }, [], this);
    this.time.delayedCall(5200, function () {
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.time.delayedCall(750, function () {
        if (this.def.decision) this.scene.start('Decision', { boss: this.bossId, idx: this.idx });
        else TG.Flow.next(this, this.idx);
      }, [], this);
    }, [], this);
  }

  // ---- HUD ----------------------------------------------------------------------
  buildHud() {
    var st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.lagP = 1; this.lagB = 1;
    this.bossName = this.add.text(TG.W / 2, 646, this.def.name, Object.assign({ fontSize: '17px' }, st))
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101).setAlpha(0.85);
    this.subWho = this.add.text(TG.W / 2, 96, '', Object.assign({ fontSize: '15px', color: '#b8b2d0', fontStyle: 'italic' }, st))
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101).setShadow(0, 2, '#000', 6);
    this.subTxt = this.add.text(TG.W / 2, 132, '', Object.assign({ fontSize: '23px', align: 'center', wordWrap: { width: 960 } }, st))
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(101).setShadow(0, 2, '#000', 8);
    this.subQ = []; this.subCur = null; this.subT = 0;
    if (TG.debug.fps) this.fpsT = this.add.text(8, 700, '', { fontSize: '12px', color: '#6f6' }).setScrollFactor(0).setDepth(102);
  }

  drawHud(real) {
    var g = this.hud, p = this.player, b = this.boss;
    g.clear();
    this.lagP = Math.max(p.hp / p.maxHp, this.lagP - real * 0.35);
    this.lagB = Math.max(b.hp / b.maxHp, this.lagB - real * 0.3);
    var fp = Math.max(0, p.hp / p.maxHp), fb = Math.max(0, b.hp / b.maxHp);
    // hero: slim bar top-left
    g.fillStyle(0x000000, 0.55); g.fillRect(36, 30, 304, 12);
    g.fillStyle(0xffffff, 0.55); g.fillRect(38, 32, 300 * this.lagP, 8);
    g.fillStyle(0xbcd0ff, 1); g.fillRect(38, 32, 300 * fp, 8);
    // boss: wide bar bottom
    var bw = 640, bx = (TG.W - bw) / 2;
    g.fillStyle(0x000000, 0.6); g.fillRect(bx - 2, 652, bw + 4, 14);
    g.fillStyle(0xffffff, 0.5); g.fillRect(bx, 654, bw * this.lagB, 10);
    g.fillStyle(this.boss.team === 'mirror' ? 0xe0524a : 0xff7a2a, 1); g.fillRect(bx, 654, bw * fb, 10);
    if (b.phaseAt && b.phase === 1) { g.fillStyle(0x000000, 0.9); g.fillRect(bx + bw * b.phaseAt - 1, 652, 2, 14); }

    // subtitles
    if (!this.subCur && this.subQ.length) {
      this.subCur = this.subQ.shift(); this.subT = this.subCur.ms / 1000;
      this.subWho.setText(this.subCur.who); this.subTxt.setText(this.subCur.text);
    }
    if (this.subCur) {
      this.subT -= real;
      var a = Math.min(1, this.subT / 0.4, (this.subCur.ms / 1000 - this.subT) / 0.3);
      this.subWho.setAlpha(Math.max(0, a)); this.subTxt.setAlpha(Math.max(0, a));
      if (this.subT <= 0) { this.subCur = null; this.subWho.setText(''); this.subTxt.setText(''); }
    }
  }

  // ---- frame loop ---------------------------------------------------------------
  update(time, delta) {
    var real = Math.min(delta, 50) / 1000, STEP = 1 / 60;
    this.ctrl.update(this.nowMs);

    if (this.freeze > 0) this.freeze -= real;
    else {
      this.acc += real * this.slow;
      var n = 0;
      while (this.acc >= STEP && n < 4) { this.step(STEP); this.acc -= STEP; n++; }
      if (n === 4) this.acc = 0;
    }

    for (var i = 0; i < this.fighters.length; i++) this.fighters[i].draw();
    this.drawProjectiles();
    this.updateCamera(real);
    this.areaUpdate(real);
    this.drawHud(real);
    if (this.fpsT) this.fpsT.setText(Math.round(this.game.loop.actualFps) + ' fps');
  }

  step(dt) {
    this.clock += dt;
    this.nowMs += dt * 1000;
    this.ctrl.now = this.nowMs;
    var i, f;
    for (i = 0; i < this.fighters.length; i++) {
      f = this.fighters[i];
      if (f.brain) f.brain.update(dt);
      f.update(dt);
    }
    this.separate();
    this.stepProjectiles(dt);
    if (!this.over) TG.Record.tick(dt, this.player, this.boss);
    this.fx.update(dt);
    if (this.def.tick && !this.over) this.def.tick(this, dt);
  }

  // soft body collision so fighters do not stand inside each other (dashes and rolls pass through)
  separate() {
    var a = this.player, b = this.boss;
    if (a.dead || b.dead || a.iframe || b.iframe || !a.grounded || !b.grounded) return;
    var min = (a.w + b.w) / 2 - 6, dx = b.x - a.x, d = Math.abs(dx);
    if (d >= min) return;
    var push = (min - d) * 0.35, dir = dx >= 0 ? 1 : -1;
    var w = this.world;
    a.x = TG.U.clamp(a.x - dir * push, w.left, w.right);
    b.x = TG.U.clamp(b.x + dir * push, w.left, w.right);
  }

  stepProjectiles(dt) {
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      p.age += dt; p.x += p.vx * dt;
      var box = { l: p.x - p.w / 2, r: p.x + p.w / 2, t: p.y - p.h, b: p.y }, dead = p.age > p.life;
      if (!dead) {
        var foes = this.fighters.filter(function (f) { return f.team !== p.team && !f.dead; });
        for (var k = 0; k < foes.length; k++) {
          if (TG.U.overlap(box, foes[k].hurt) &&
              foes[k].receiveHit({ dmg: p.dmg, poise: 0, kbx: TG.U.sign(p.vx) * 320, hitstop: 80, shake: 0.005 })) { dead = true; break; }
        }
      }
      if (dead) this.projectiles.splice(i, 1);
    }
  }

  drawProjectiles() {
    var g = this.pg; g.clear();
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i], t = this.time.now / 60;
      for (var k = 0; k < 5; k++) {
        var fx = p.x + (k - 2) * p.w / 5, h = p.h * (0.6 + 0.4 * Math.sin(t + k * 1.7));
        g.fillStyle(k % 2 ? 0xff7a1a : 0xffb347, 0.85);
        g.fillTriangle(fx - p.w / 9, p.y, fx + p.w / 9, p.y, fx - TG.U.sign(p.vx) * 4, p.y - h);
      }
      g.fillStyle(0xff4a0a, 0.4); g.fillRect(p.x - p.w / 2, p.y - 8, p.w, 8);
    }
  }

  updateCamera(real) {
    var cam = this.cameras.main, p = this.player, b = this.boss;
    var target = TG.U.clamp(p.x * 0.65 + b.x * 0.35 - TG.W / 2, 0, this.area.width - TG.W);
    this.cameraX += (target - this.cameraX) * Math.min(1, real * 5);
    cam.scrollX = this.cameraX;
  }
};
