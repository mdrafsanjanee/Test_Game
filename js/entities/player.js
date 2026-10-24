// The hero. The Mirror boss is this exact class driven by an AI controller,
// so it has the same moves, the same timings and the same weaknesses.
(function () {
  var U = TG.U, E = U.ease, Pose = TG.Pose, W = Pose.make;

  var RUN = 430, GACC = 3600, AACC = 2500, JV = -880, DJV = -780;
  var DASH_V = 1300, DASH_MS = 190, ROLL_MS = 430, ROLL_V = 560, DJ_SPIN = 0.34;

  // All times in ms, distances in px relative to the fighter's feet.
  // windup -> active -> recover. `cancel` = ms into recover before the chain input is accepted.
  // `cancelOut` = ms into recover before a dash/roll may cancel it (null = fully committed).
  var ATK = {
    l1: { id: 'l1', windup: 70, active: 80, recover: 170, cancel: 55, cancelOut: 120, next: 'l2',
          dmg: 8, poise: 6, reach: 96, off: 6, top: -94, bot: -6, kb: 170, lunge: 300, hitstop: 55, shake: 0.0022,
          smear: { r: 82, a0: -115, a1: 35, w: 10 },
          wind: W({ lean: -10, hipF: 14, kneeF: -10, hipB: -22, kneeB: -16, shF: 162, elF: -34, shB: -30, elB: 20, wpn: 25, head: 6 }),
          hit: W({ lean: 26, hipF: 36, kneeF: -18, hipB: -44, kneeB: -12, shF: 78, elF: 6, shB: -60, elB: 10, wpn: -8, head: -6 }) },
    l2: { id: 'l2', windup: 75, active: 80, recover: 190, cancel: 60, cancelOut: 130, next: 'l3',
          dmg: 8, poise: 6, reach: 100, off: 6, top: -96, bot: -6, kb: 190, lunge: 320, hitstop: 55, shake: 0.0022,
          smear: { r: 84, a0: 60, a1: -125, w: 10 },
          wind: W({ lean: 16, hipF: 22, kneeF: -14, hipB: -34, kneeB: -20, shF: 20, elF: 12, shB: -20, elB: 10, wpn: -30, head: 0 }),
          hit: W({ lean: -4, hipF: 26, kneeF: -10, hipB: -24, kneeB: -16, shF: 152, elF: 22, shB: -50, elB: 20, wpn: 12, head: -8 }) },
    // The finisher: big damage, long committed recovery. This is what makes spamming a losing trade.
    l3: { id: 'l3', windup: 125, active: 110, recover: 470, cancel: 0, cancelOut: null, next: null,
          dmg: 15, poise: 20, reach: 124, off: 4, top: -100, bot: -4, kb: 380, lunge: 520, hitstop: 100, shake: 0.0055,
          smear: { r: 104, a0: -135, a1: 65, w: 15 },
          wind: W({ lean: -24, hipF: 12, kneeF: -12, hipB: -36, kneeB: -24, shF: 178, elF: -18, shB: 150, elB: -10, wpn: 30, head: 10 }),
          hit: W({ lean: 40, hipF: 58, kneeF: -46, hipB: -54, kneeB: -8, shF: 52, elF: 4, shB: 30, elB: 10, wpn: -6, head: -12 }) },
    hv: { id: 'hv', windup: 310, active: 130, recover: 520, cancel: 0, cancelOut: null, next: null,
          dmg: 32, poise: 48, reach: 138, off: 2, top: -108, bot: 0, kb: 520, lunge: 380, hitstop: 140, shake: 0.008,
          smear: { r: 116, a0: -145, a1: 75, w: 19 },
          wind: W({ lean: -30, hipF: 30, kneeF: -48, hipB: -30, kneeB: -52, shF: 172, elF: -10, shB: 166, elB: -8, wpn: 35, head: 12, dy: -4 }),
          hit: W({ lean: 50, hipF: 64, kneeF: -56, hipB: -56, kneeB: -60, shF: 34, elF: 8, shB: 28, elB: 8, wpn: -10, head: -16 }) },
    a1: { id: 'a1', windup: 60, active: 90, recover: 190, cancel: 0, cancelOut: 140, next: null,
          dmg: 8, poise: 6, reach: 92, off: 6, top: -96, bot: 10, kb: 170, lunge: 0, hitstop: 55, shake: 0.0022,
          smear: { r: 80, a0: -110, a1: 60, w: 10 },
          wind: W({ lean: -6, hipF: 58, kneeF: -76, hipB: -12, kneeB: -52, shF: 160, elF: -30, shB: 80, elB: 20, wpn: 25 }),
          hit: W({ lean: 18, hipF: 48, kneeF: -60, hipB: -14, kneeB: -44, shF: 70, elF: 8, shB: -40, elB: 10, wpn: -10 }) }
  };
  var ROLL_DEF = { id: 'roll', dmg: 7, poise: 12, reach: 54, off: -26, top: -48, bot: 0, kb: 240, hitstop: 70, shake: 0.003 };

  var HERO_RIG = { scale: 1.15, rim: 0xa8c4ff, rimA: 0.55, eye: 0xffffff, weapon: { color: 0xe8eefc } };
  var MIRROR_RIG = { scale: 1.15, rim: 0xe0524a, rimA: 0.65, eye: 0xff3a30, weapon: { color: 0xff9a8a } };

  function Player(scene, x, y, opts) {
    opts = opts || {};
    TG.Fighter.call(this, scene, x, y, {
      hp: opts.hp || 100, team: opts.team || 'hero', w: 34, h: 98,
      rig: opts.rig || (opts.team === 'mirror' ? MIRROR_RIG : HERO_RIG)
    });
    this.ctrl = opts.ctrl;
    this.isHero = this.team === 'hero';
    this.mode = 'free';
    this.act = null;
    this.chain = null;
    this.comboLen = 0;
    this.airJumps = 1;
    this.airDash = true;
    this.coyote = 0;
    this.jumpRising = false;
    this.runPh = 0;
    this.spin = 0;
    this.dashCd = 0;
    this.rollCd = 0;
    this.ghostT = 0;
    this.staleLog = [];
    this.lastSafeX = x;
    this.base = W();
    this.lastStale = 1;
    // per-fighter tuning (the Mirror boss changes these; the hero keeps 1)
    this.speedMul = 1; this.windupMul = 1; this.recMul = 1; this.cdMul = 1;
    this.phase = 1; this.reflect = 0; this.shield = false;
  }
  Player.prototype = Object.create(TG.Fighter.prototype);
  Player.prototype.constructor = Player;
  Player.ATK = ATK;
  Player.RUN = RUN;

  Object.defineProperty(Player.prototype, 'hurt', {
    get: function () {
      var h = this.mode === 'roll' ? 46 : this.h;
      return { l: this.x - this.w / 2, r: this.x + this.w / 2, t: this.y - h, b: this.y };
    }
  });

  // attack timings after this fighter's tuning: {Wd: end of windup, A: end of active, T: end of recovery}
  Player.prototype.tm = function (d) {
    var Wd = d.windup * this.windupMul, A = Wd + d.active;
    return { Wd: Wd, A: A, T: A + d.recover * this.recMul };
  };

  Player.prototype.threat = function () {
    if (this.mode !== 'attack') return null;
    var a = this.act, d = a.d;
    if (a.t < this.tm(d).A) return { reach: d.reach + d.off };
    return null;
  };

  Player.prototype.rec = function (type) { if (this.isHero) TG.Record.ev(type); };

  // ---- main update --------------------------------------------------------
  Player.prototype.update = function (dt) {
    this.tickTimers(dt);
    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.rollCd > 0) this.rollCd -= dt;
    if (this.mpoise > 0) this.mpoise = Math.max(0, this.mpoise - 14 * dt);

    if (this.mode === 'dead') {
      this.vx *= Math.pow(0.001, dt);
      this.physics(dt);
      Pose.mix(this.pose, Pose.DEAD, Math.min(1, (this.act.t += dt * 1000) / 260), this.pose);
      return;
    }
    switch (this.mode) {
      case 'free': this.free(dt); break;
      case 'attack': this.atkUpdate(dt); break;
      case 'dash': this.dashUpdate(dt); break;
      case 'roll': this.rollUpdate(dt); break;
      case 'hurt': this.hurtUpdate(dt); break;
    }
    this.physics(dt);
    if (this.grounded && !this.onPlatform && this.mode === 'free') this.lastSafeX = this.x;
    this.animate(dt);
  };

  Player.prototype.onLand = function () {
    if (this.lastVy > 520) this.scene.fx.dust(this.x, this.y, 7, 18);
    this.spin = 0;
  };

  Player.prototype.onFall = function () {
    if (!this.isHero) { this.x = this.scene.world.left + 200; this.y = this.scene.world.groundY; this.vy = 0; return; }
    if (!TG.debug.god) this.hp -= 18;
    this.x = this.lastSafeX; this.y = this.scene.world.groundY; this.vx = 0; this.vy = 0;
    this.invuln = 1.2;
    if (this.hp <= 0) this.die();
  };

  // ---- free movement ------------------------------------------------------
  Player.prototype.free = function (dt) {
    var c = this.ctrl, m = c.move, g = this.grounded;
    if (g) { this.coyote = 0.1; this.airJumps = 1; this.airDash = true; this.floaty = false; }
    else this.coyote -= dt;

    if (this.chain) {
      this.chain.t -= dt;
      if (this.chain.t <= 0) this.endCombo();
    }

    this.vx = U.approach(this.vx, m * RUN * this.speedMul, (g ? GACC : AACC) * this.speedMul * dt);
    if (m !== 0) this.facing = m;

    if (c.peek('up', 110)) {
      if (g && c.held('down') && this.onPlatform) {
        c.pressed('up', 110);
        this.dropT = 0.25; this.y += 3;
      } else if (g || this.coyote > 0) {
        c.pressed('up', 110);
        this.vy = JV; this.grounded = false; this.coyote = 0; this.jumpRising = true;
        this.scene.fx.dust(this.x, this.y, 6);
        this.rec('jump');
        if (TG.Sfx && this.isHero) TG.Sfx.play('jump');
      } else if (this.airJumps > 0) {
        c.pressed('up', 110);
        this.airJumps--; this.vy = DJV; this.jumpRising = true; this.spin = DJ_SPIN;
        this.scene.fx.ring(this.x, this.y - 30, 6, 36, 0xbcd0ff, 0.28, 2);
        this.rec('djump');
        if (TG.Sfx && this.isHero) TG.Sfx.play('jump2');
      }
    }
    if (this.jumpRising && !c.held('up') && this.vy < -300) { this.vy *= 0.5; this.jumpRising = false; }
    if (this.vy >= 0) this.jumpRising = false;

    if (c.peek('light', 130)) {
      this.startAttack(this.chain ? this.chain.id : (g ? 'l1' : 'a1'), 'light');
      return;
    }
    if (g && c.peek('heavy', 130)) { this.startAttack('hv', 'heavy'); return; }
    if (c.peek('dash', 110) && this.dashCd <= 0 && (g || this.airDash)) { this.startDash(); return; }
    if (g && c.peek('roll', 110) && this.rollCd <= 0) { this.startRoll(); return; }
  };

  // ---- attacks ------------------------------------------------------------
  Player.prototype.startAttack = function (id, key) {
    var d = ATK[id];
    this.ctrl.pressed(key, 250);
    this.mode = 'attack';
    this.act = { id: id, d: d, t: 0, hit: new Set(), queued: false, lunged: false, smeared: false };
    if (this.ctrl.move !== 0) this.facing = this.ctrl.move;
    this.comboLen = this.chain ? this.comboLen + 1 : 1;
    this.chain = null;
    this.staleLog.push({ id: id, t: this.scene.clock });
    if (!this.isHero) this.scene.fx.ring(this.x + this.facing * 12, this.y - 70, 3, 30, this.phase === 2 ? 0xffffff : 0xff6a5a, 0.2, 2);
    this.rec(key === 'heavy' ? 'heavy' : 'light');
    if (!this.grounded) this.rec('airlight');
  };

  Player.prototype.staleMult = function (id) {
    var now = this.scene.clock, n = 0, i;
    for (i = this.staleLog.length - 1; i >= 0; i--) {
      if (now - this.staleLog[i].t > 5) { this.staleLog.splice(0, i + 1); break; }
    }
    for (i = 0; i < this.staleLog.length; i++) if (this.staleLog[i].id === id) n++;
    return Math.max(0.45, 1 - 0.17 * Math.max(0, n - 1));
  };

  Player.prototype.atkUpdate = function (dt) {
    var a = this.act, d = a.d, c = this.ctrl;
    a.t += dt * 1000;
    var tmg = this.tm(d), Wd = tmg.Wd, A = tmg.A, T = tmg.T;

    if (d.next && c.peek('light', 170)) a.queued = true;

    if (!a.lunged && a.t >= Wd - 20) {
      a.lunged = true;
      if (d.lunge && this.grounded) this.vx = this.facing * d.lunge;
    }
    if (a.t >= Wd && !a.smeared) {
      a.smeared = true;
      if (TG.Sfx) TG.Sfx.play(d.id === 'hv' || d.id === 'l3' ? 'swing_heavy' : 'swing', this.isHero ? 1 : 0.7);
      this.scene.fx.smear(this.x + this.facing * 10, this.y - 62, this.facing, d.smear,
        this.isHero ? 0xe6efff : 0xff9a8a, 0.22);
    }
    if (a.t >= Wd && a.t < A) this.scene.combat.melee(this, a, d);

    if (this.grounded) this.vx *= Math.pow(0.02, dt);

    if (d.cancelOut != null && a.t >= A + d.cancelOut) {
      if (c.peek('dash', 100) && this.dashCd <= 0 && (this.grounded || this.airDash)) {
        this.endAttack(); this.startDash(); return;
      }
      if (this.grounded && c.peek('roll', 100) && this.rollCd <= 0) {
        this.endAttack(); this.startRoll(); return;
      }
    }
    if (a.queued && d.next && a.t >= A + d.cancel) {
      c.pressed('light', 300);
      this.startAttack(d.next, 'light');
      return;
    }
    if (a.t >= T) this.endAttack();
  };

  Player.prototype.endAttack = function () {
    var d = this.act.d;
    this.mode = 'free';
    this.act = null;
    if (d.next) this.chain = { id: d.next, t: 0.2 };
    else this.endCombo();
  };

  Player.prototype.endCombo = function () {
    if (this.comboLen > 0 && this.isHero) TG.Record.comboEnd(this.comboLen);
    this.comboLen = 0;
    this.chain = null;
  };

  Player.prototype.onDealt = function (tgt, info) {
    if (this.isHero) { TG.Record.dealt(info.dmg); }
  };

  // ---- dash & roll --------------------------------------------------------
  Player.prototype.startDash = function () {
    var c = this.ctrl;
    c.pressed('dash', 110);
    var dir = c.move || this.facing;
    this.endCombo();
    this.mode = 'dash';
    this.act = { t: 0, dir: dir };
    this.facing = dir;
    this.dashCd = (DASH_MS / 1000 + 0.2) * this.cdMul;
    if (!this.grounded) { this.airDash = false; this.floaty = true; this.vy = 0; }
    this.vx = dir * DASH_V * (this.speedMul > 1 ? 1 + (this.speedMul - 1) * 0.5 : 1);
    this.iframe = true;
    this.ghostT = 0;
    this.scene.fx.dust(this.x, this.y, 5, 10);
    this.rec('dash');
    if (TG.Sfx) TG.Sfx.play('dash', this.isHero ? 1 : 0.6);
  };

  Player.prototype.dashUpdate = function (dt) {
    var a = this.act;
    a.t += dt * 1000;
    this.ghostT -= dt;
    if (this.ghostT <= 0) { this.scene.fx.ghost(this, this.isHero ? 0x6f8fd0 : 0xd0504a); this.ghostT = 0.035; }
    this.vx = a.dir * DASH_V * (1 - 0.4 * (a.t / DASH_MS));
    if (this.floaty) this.vy = 0;
    if (a.t >= 130) this.iframe = false;
    if (a.t >= DASH_MS) {
      this.floaty = false; this.iframe = false; this.mode = 'free'; this.act = null;
      this.vx = a.dir * RUN * 0.85;
    }
  };

  Player.prototype.startRoll = function () {
    var c = this.ctrl;
    c.pressed('roll', 110);
    var dir = c.move || this.facing;
    this.endCombo();
    this.mode = 'roll';
    this.act = { t: 0, dir: dir, hit: new Set() };
    this.facing = dir;
    this.rollCd = 0.3 * this.cdMul;
    this.iframe = true;
    this.vx = dir * ROLL_V;
    this.scene.fx.dust(this.x, this.y, 6, 12);
    this.rec('roll');
    if (TG.Sfx) TG.Sfx.play('roll', this.isHero ? 1 : 0.6);
  };

  Player.prototype.rollUpdate = function (dt) {
    var a = this.act;
    a.t += dt * 1000;
    var k = a.t < 300 ? 1 : Math.max(0, 1 - (a.t - 300) / 130);
    this.vx = a.dir * ROLL_V * k;
    if (a.t >= 250) this.iframe = false;
    if (a.t < 320) this.scene.combat.melee(this, a, ROLL_DEF);
    if (a.t >= ROLL_MS) { this.mode = 'free'; this.act = null; this.iframe = false; this.vx *= 0.3; }
  };

  // ---- taking damage ------------------------------------------------------
  Player.prototype.hurtUpdate = function (dt) {
    var a = this.act;
    a.t += dt * 1000;
    this.vx *= Math.pow(0.02, dt);
    if (a.t >= 300) { this.mode = 'free'; this.act = null; }
  };

  Player.prototype.receiveHit = function (info) {
    if (this.dead || this.invuln > 0 || this.iframe) return false;
    if (!(TG.debug.god && this.isHero)) this.hp -= info.dmg;
    this.flash = 0.12;
    if (!this.isHero) {                       // the Mirror shrugs off light hits, reels from heavy ones
      this.mpoise = (this.mpoise || 0) + info.poise;
      this.invuln = 0.1;
      var s0 = this.scene;
      s0.fx.spark(this.x, this.y - 50, info.kbx >= 0 ? 1 : -1, 10, 0xffc0b0, 1);
      s0.hitstop(info.hitstop || 60);
      s0.shake(info.shake || 0.003, 120);
      var src = info.src, heroDead = false;
      if (this.reflect > 0 && src && src.isHero && !src.dead) {      // phase 2: what you do to it, you do to yourself
        var back = info.dmg * this.reflect;
        if (this.hp <= 0) back = 1e6;                                // the killing blow is always lethal
        if (!(TG.debug.god)) src.hp -= back;
        src.flash = 0.18; src.invuln = Math.max(src.invuln, 0.05);
        s0.fx.spark(src.x, src.y - 55, info.kbx >= 0 ? -1 : 1, 14, 0xffffff, 1.2);
        s0.fx.ring(src.x, src.y - 55, 6, 60, 0xffffff, 0.3, 3);
        if (TG.Sfx) TG.Sfx.play('reflect');
        if (s0.def && s0.def.noteSwing) s0.def.noteSwing(s0);
        if (src.hp <= 0) { src.hp = 0; heroDead = true; }
      }
      if (this.hp <= 0) {
        this.hp = 0;
        if (this.phase === 1 && this.onShatter) { this.onShatter(src); return true; }
        if (heroDead) s0.mutualKill(this, src); else this.die();
        return true;
      }
      if (heroDead) { src.die(); return true; }
      if (this.mpoise >= 22) {
        this.mpoise = 0; this.endCombo();
        this.mode = 'hurt'; this.act = { t: 0 }; this.invuln = 0.35;
        this.vx = info.kbx * 0.8; this.vy = -200; this.grounded = false; this.iframe = false; this.floaty = false;
      } else this.vx += info.kbx * 0.25;
      return true;
    }
    this.invuln = 0.95;
    this.endCombo();
    this.mode = 'hurt';
    this.act = { t: 0 };
    this.vx = info.kbx * 0.9;
    this.vy = -260;
    this.grounded = false;
    this.floaty = false;
    this.iframe = false;
    if (this.isHero) { TG.Record.hit(); if (TG.Sfx) TG.Sfx.play('hurt'); }
    var s = this.scene;
    s.fx.spark(this.x, this.y - 50, info.kbx >= 0 ? 1 : -1, 12, 0xff6a4a, 1);
    s.hitstop(info.hitstop || 90);
    s.shake(0.007, 160);
    if (this.hp <= 0) { this.hp = 0; this.die(); }
    return true;
  };

  Player.prototype.die = function () {
    if (TG.Sfx) TG.Sfx.play('die');
    this.mode = 'dead';
    this.dead = true;
    this.act = { t: 0 };
    this.vy = -300;
    this.grounded = false;
    this.scene.onFighterDead(this);
  };

  // ---- animation ----------------------------------------------------------
  Player.prototype.animate = function (dt) {
    var b = this.base, p = this.pose, a = this.act;
    if (this.grounded) {
      var sp = Math.abs(this.vx);
      if (sp > 50 && this.mode === 'free') {
        this.runPh += dt * (9 + (sp / RUN) * 7);
        Pose.run(b, this.runPh, Math.min(1, sp / (RUN * this.speedMul)));
      } else Pose.idle(b, this.time);
    } else Pose.air(b, this.vy);

    switch (this.mode) {
      case 'free':
        Pose.copy(b, p);
        if (this.spin > 0) {
          this.spin -= dt;
          p.rot = 360 * E.inOutCubic(1 - Math.max(0, this.spin) / DJ_SPIN);
        }
        break;
      case 'attack':
        var d = a.d, tmg = this.tm(d), Wd = tmg.Wd, A = tmg.A;
        if (a.t < Wd) Pose.mix(b, d.wind, E.outCubic(Math.min(1, a.t / Wd)), p);
        else if (a.t < A) Pose.mix(d.wind, d.hit, E.outBack(Math.min(1, (a.t - Wd) / (d.active * 0.7))), p);
        else Pose.mix(d.hit, b, E.inOutCubic(Math.min(1, (a.t - A) / (d.recover * this.recMul))), p);
        break;
      case 'dash':
        Pose.mix(b, Pose.DASH, Math.min(1, a.t / 50), p);
        break;
      case 'roll':
        Pose.mix(b, Pose.ROLL, Math.min(1, a.t / 70), p);
        p.rot = 360 * E.inOutCubic(Math.min(1, a.t / ROLL_MS));
        break;
      case 'hurt':
        Pose.mix(b, Pose.HURT, Math.min(1, a.t / 60), p);
        break;
    }
  };

  TG.Player = Player;
})();
