// Adaptive boss base class. A boss is a table of attacks plus a brain that
// (1) only picks attacks that fit the current range and (2) biases the pick toward
// whatever counters the player's recent habits, read live from TG.Record.
//
// Attack definition (all times ms, distances px relative to the boss's feet):
//   id, windup, active, recover, dmg, reach, off, top, bot, kb
//   range:[min,max]   distance to the player at which this attack is considered
//   weight, phase     base weight, earliest phase it appears in (default 1)
//   armor             true = hits in windup/active do not interrupt it
//   tags              counter bonuses: {light, evade, air, passive, heavy} each 0..n
//   lunge             forward speed during active          jump: {vx, vy} launches at windup end
//   leap, landBox     leap attack: hitbox only on landing
//   guard, then       guard stance; `then` = id of the riposte attack
//   wind, hit         poses (TG.Pose.make) for windup / strike
//   smear             {r,a0,a1,w} slash arc                 tell: ring colour
//   onStart(b,p)  onActive(b,p)   hooks, e.g. to spawn projectiles
(function () {
  var U = TG.U, E = U.ease, Pose = TG.Pose;

  function Boss(scene, x, y, def, cfg) {
    TG.Fighter.call(this, scene, x, y, { hp: cfg.hp, team: 'foe', rig: cfg.rig, w: cfg.w || 46, h: cfg.h || 120, depth: 11 });
    this.def = def;
    this.attacks = cfg.attacks;
    this.speed = cfg.speed || 220;
    this.pref = cfg.pref || [110, 260];
    this.thinkRange = cfg.think || [0.35, 0.9];
    this.phase = 1;
    this.phaseAt = cfg.phaseAt || 0.5;
    this.poiseMax = cfg.poise || 80;
    this.poise = 0;
    this.mode = 'intro';
    this.introT = 0;
    this.introDur = cfg.intro || 1.6;
    this.cur = null;
    this.think = 0.8;
    this.last = null;
    this.armorNow = false;
    this.guarding = false;
    this.guardHits = 0;
    this.stagger = 0;
    this.runPh = 0;
    this.base = Pose.make();
    this.byId = {};
    for (var i = 0; i < this.attacks.length; i++) this.byId[this.attacks[i].id] = this.attacks[i];
    this.metricsCache = null;
    this.scale = cfg.rig && cfg.rig.scale || 1;
  }
  Boss.prototype = Object.create(TG.Fighter.prototype);
  Boss.prototype.constructor = Boss;

  // how fast things happen: phase 2 is quicker
  Boss.prototype.tempo = function () { return this.phase >= 2 ? 0.85 : 1; };

  Boss.prototype.threat = function () {
    if (this.mode !== 'attack' || !this.cur) return null;
    var a = this.cur.a;
    if (a.guard || a.leap) return this.cur.t < a.windup + a.active + 200 ? { reach: a.reach || 200 } : null;
    if (this.cur.t < (a.windup + a.active) * this.tempo()) return { reach: a.reach + (a.off || 0) };
    return null;
  };

  // ---- what the player has been doing --------------------------------------
  Boss.prototype.metrics = function (dist) {
    var R = TG.Record;
    return {
      light: U.clamp(R.rate('light', 5) / 1.6, 0, 1),
      evade: U.clamp((R.rate('dash', 6) + R.rate('roll', 6)) / 0.55, 0, 1),
      air: U.clamp(R.airFrac() * 1.5, 0, 1),
      heavy: U.clamp(R.rate('heavy', 8) / 0.3, 0, 1),
      passive: U.clamp(1 - (R.rate('light', 6) + R.rate('heavy', 6)) / 0.9, 0, 1) * (dist > 200 ? 1 : 0.4)
    };
  };

  Boss.prototype.choose = function (dist, p) {
    var m = this.metrics(dist), self = this, items = [];
    this.attacks.forEach(function (a) {
      if (a.chainOnly || (a.phase || 1) > self.phase) return;
      if (dist < a.range[0] || dist > a.range[1]) return;
      if (a.cond && !a.cond(self, p)) return;
      var bonus = 0;
      for (var k in (a.tags || {})) bonus += a.tags[k] * (m[k] || 0);
      var w = (a.weight || 1) * (1 + 2.6 * bonus);
      if (a.id === self.last) w *= 0.35;
      items.push({ w: w, a: a });
    });
    var pick = U.weighted(items);
    this.dbg = { m: m, items: items.map(function (i) { return i.a.id + ':' + i.w.toFixed(1); }).join(' ') };
    return pick ? pick.a : null;
  };

  // ---- update ---------------------------------------------------------------
  Boss.prototype.update = function (dt) {
    this.tickTimers(dt);
    var p = this.scene.player;

    if (this.mode === 'dead') {
      this.vx *= Math.pow(0.01, dt);
      this.physics(dt);
      this.deadT += dt * 1000;
      Pose.mix(this.pose, Pose.DEAD, Math.min(1, this.deadT / 500), this.pose);
      return;
    }
    this.poise = Math.max(0, this.poise - 8 * dt);
    if (this.mode === 'intro') {
      this.introT += dt;
      if (this.introT >= this.introDur) this.mode = 'idle';
      this.physics(dt);
      Pose.idle(this.pose, this.time);
      return;
    }

    switch (this.mode) {
      case 'idle': this.idleAI(dt, p); break;
      case 'attack': this.atkUpdate(dt, p); break;
      case 'stagger':
        this.stagger -= dt;
        this.vx *= Math.pow(0.05, dt);
        if (this.stagger <= 0) { this.mode = 'idle'; this.think = 0.25; }
        break;
      case 'roar':
        this.stagger -= dt;
        if (this.stagger <= 0) { this.mode = 'idle'; this.think = 0.3; this.invuln = 0; }
        break;
    }
    this.physics(dt);
    this.animate(dt);
  };

  Boss.prototype.idleAI = function (dt, p) {
    var dx = p.x - this.x, dist = Math.abs(dx), to = dx >= 0 ? 1 : -1;
    if (!p.dead) this.facing = to;
    this.think -= dt;
    var want = 0;
    if (dist > this.pref[1]) want = to;
    else if (dist < this.pref[0]) want = -to * 0.6;
    this.vx = U.approach(this.vx, want * this.speed / this.tempo() * (this.phase >= 2 ? 1 : 0.9), 3200 * dt);
    if (this.think <= 0 && !p.dead) {
      var a = this.choose(dist, p);
      if (a) this.startAttack(a, p); else this.think = 0.12;
    }
  };

  Boss.prototype.startAttack = function (a, p) {
    this.mode = 'attack';
    this.cur = { a: a, t: 0, hit: new Set(), fired: false, landed: false, landMs: 0, ended: false };
    this.last = a.id;
    var dx = p.x - this.x;
    if (!p.dead) this.facing = dx >= 0 ? 1 : -1;
    this.guarding = !!a.guard;
    this.guardHits = 0;
    if (a.onStart) a.onStart(this, p);
    this.scene.fx.ring(this.x + this.facing * 10 * this.scale, this.y - this.h * 0.95, 4, 34, a.tell || 0xff5a2a, 0.3, 3);
  };

  Boss.prototype.atkUpdate = function (dt, p) {
    var c = this.cur, a = c.a, tp = this.tempo(), s = this.scene;
    c.t += dt * 1000;
    var Wd = a.windup * tp, A = Wd + a.active, T = A + a.recover * tp;
    this.armorNow = !!a.armor && c.t < A;

    if (a.guard) {
      this.vx *= Math.pow(0.001, dt);
      if (c.t >= A + 80 || this.guardHits >= 2) {
        this.guarding = false;
        var then = a.then && this.byId[a.then];
        if (then) { this.startAttack(then, p); return; }
        this.endAttack();
      }
      return;
    }

    if (!c.fired && c.t >= Wd) {
      c.fired = true;
      if (a.smear) s.fx.smear(this.x + this.facing * 14 * this.scale, this.y + (a.smearY != null ? a.smearY : -this.h * 0.7), this.facing, a.smear, a.smearColor || 0xff9a5a, 0.26);
      if (a.jump) {
        var tx = p.x - this.x;
        this.vy = a.jump.vy;
        this.vx = U.clamp(tx / (a.jump.air || 0.85), -a.jump.vx, a.jump.vx);
        this.grounded = false;
      }
      if (a.onActive) a.onActive(this, p);
    }

    if (a.leap) {
      if (c.fired && !c.landed && this.grounded && c.t > Wd + 160) {
        c.landed = true; c.landMs = 0; this.vx = 0;
        s.fx.ring(this.x, this.y - 4, 10, 190, 0xff7a2a, 0.4, 4);
        s.fx.dust(this.x, this.y, 12, 40);
        s.shake(0.009, 200);
      }
      if (c.landed) {
        c.landMs += dt * 1000;
        if (c.landMs < 150) s.combat.melee(this, c, a.landBox);
        if (c.landMs >= a.recover * tp) this.endAttack();
      }
      return;
    }

    if (c.t >= Wd && c.t < A) {
      if (a.lunge) this.vx = this.facing * a.lunge;
      if (a.dmg) s.combat.melee(this, c, a);
    } else if (this.grounded) this.vx *= Math.pow(0.0005, dt);

    if (c.t >= T) {
      if (a.then && this.byId[a.then]) this.startAttack(this.byId[a.then], p);
      else this.endAttack();
    }
  };

  Boss.prototype.endAttack = function () {
    this.mode = 'idle';
    this.cur = null;
    this.armorNow = false;
    this.guarding = false;
    this.think = U.rand(this.thinkRange[0], this.thinkRange[1]) * this.tempo();
  };

  // ---- being hit ---------------------------------------------------------------
  Boss.prototype.enterStagger = function (sec) {
    this.mode = 'stagger';
    this.stagger = sec;
    this.cur = null;
    this.armorNow = false;
    this.guarding = false;
    this.scene.fx.ring(this.x, this.y - this.h * 0.6, 10, 80, 0xffffff, 0.3, 3);
  };

  Boss.prototype.receiveHit = function (info) {
    if (this.dead || this.invuln > 0 || this.mode === 'intro') return false;
    var s = this.scene, dmg = info.dmg, blocked = false, dir = info.kbx >= 0 ? 1 : -1;

    if (this.guarding) {
      blocked = true;
      this.guardHits++;
      if (info.poise >= 40) {                       // a heavy swing breaks the guard
        blocked = false;
        dmg = info.dmg * 0.7;
        this.enterStagger(1.5);
      } else dmg = info.dmg * 0.08;
    }

    if (this.mode === 'stagger') dmg *= 1.4;        // punish window
    this.hp -= dmg;
    this.flash = blocked ? 0 : 0.09;

    if (!blocked && this.mode !== 'stagger') {
      this.poise += info.poise * (this.armorNow ? 0.3 : 1);
      if (this.poise >= this.poiseMax) { this.poise = 0; this.enterStagger(1.15); }
      else if (!this.armorNow && info.poise >= 30 && this.mode === 'attack') this.enterStagger(0.35);
    }
    if (!this.armorNow && this.mode !== 'attack') this.vx += info.kbx * 0.3;

    s.fx.spark(this.x - dir * 8, this.y - this.h * 0.6, dir, blocked ? 6 : 12, blocked ? 0xb8c2d8 : (info.stale ? 0xb08a7a : 0xffc070), blocked ? 0.7 : 1);
    s.hitstop(blocked ? 40 : info.hitstop);
    s.shake(info.shake || 0.003, 110);

    if (this.hp <= 0) { this.hp = 0; this.die(); return true; }
    if (this.phase === 1 && this.hp <= this.maxHp * this.phaseAt) this.startPhase2();
    this.blocked = blocked;
    return true;
  };

  Boss.prototype.startPhase2 = function () {
    this.phase = 2;
    this.mode = 'roar';
    this.stagger = 1.3;
    this.invuln = 1.3;
    this.cur = null;
    this.armorNow = false;
    this.guarding = false;
    this.scene.fx.ring(this.x, this.y - 60, 20, 340, 0xff6a2a, 0.7, 5);
    this.scene.fx.ring(this.x, this.y - 60, 10, 220, 0xffd27a, 0.5, 3);
    this.scene.shake(0.01, 420);
    if (this.def.onPhase2) this.def.onPhase2(this);
  };

  Boss.prototype.die = function () {
    this.mode = 'dead';
    this.dead = true;
    this.deadT = 0;
    this.cur = null;
    this.vy = -260;
    this.grounded = false;
    this.scene.onBossDefeated(this);
  };

  // ---- animation ------------------------------------------------------------------
  Boss.prototype.animate = function (dt) {
    var b = this.base, p = this.pose;
    if (this.grounded) {
      var sp = Math.abs(this.vx);
      if (sp > 40) { this.runPh += dt * (6 + sp / this.speed * 5); Pose.run(b, this.runPh, Math.min(1, sp / this.speed) * 0.8); }
      else Pose.idle(b, this.time);
    } else Pose.air(b, this.vy);

    if (this.mode === 'attack' && this.cur) {
      var c = this.cur, a = c.a, tp = this.tempo();
      var Wd = a.windup * tp, A = Wd + a.active;
      var wind = a.wind || Pose.IDLE, hit = a.hit || Pose.IDLE;
      if (a.guard) { Pose.mix(b, wind, E.outCubic(Math.min(1, c.t / Math.max(1, Wd))), p); return; }
      if (a.leap && c.fired) {
        if (!c.landed) Pose.mix(wind, hit, E.outCubic(Math.min(1, (c.t - Wd) / 260)), p);
        else Pose.mix(hit, b, E.inOutCubic(Math.min(1, c.landMs / (a.recover * tp))), p);
        return;
      }
      if (c.t < Wd) Pose.mix(b, wind, E.outCubic(Math.min(1, c.t / Wd)), p);
      else if (c.t < A) Pose.mix(wind, hit, E.outBack(Math.min(1, (c.t - Wd) / Math.max(1, a.active * 0.6))), p);
      else Pose.mix(hit, b, E.inOutCubic(Math.min(1, (c.t - A) / (a.recover * tp))), p);
    } else if (this.mode === 'stagger') {
      Pose.mix(b, Pose.HURT, 0.9, p);
    } else if (this.mode === 'roar') {
      Pose.mix(b, Pose.make({ lean: -22, shF: 175, elF: -12, shB: 170, elB: -8, hipF: 24, hipB: -24, head: 14, wpn: 20 }),
        E.outBack(Math.min(1, (1.3 - this.stagger) / 0.3)), p);
    } else Pose.copy(b, p);
  };

  Boss.prototype.draw = function () {
    TG.Fighter.prototype.draw.call(this);
    if (this.mode === 'stagger') {
      // dazed marker: a small spinning ring over the head
      var g = this.g, t = this.time * 6;
      g.lineStyle(2, 0xffe08a, 0.8);
      g.strokeEllipse(this.x, this.y - this.h - 18, 34, 10);
      g.fillStyle(0xffe08a, 0.9);
      g.fillCircle(this.x + Math.cos(t) * 17, this.y - this.h - 18 + Math.sin(t) * 5, 2.6);
    }
  };

  TG.Boss = Boss;
})();
