// Brain that drives a Player-class fighter through the same Ctrl interface a human uses.
// Used by the Mirror boss (profile = the player's own habits) and by ?bot=1 smoke tests.
TG.MirrorBrain = function (fighter, profile, opts) {
  opts = opts || {};
  this.f = fighter;
  this.p = profile;
  this.c = fighter.ctrl;
  this.reactT = opts.react != null ? opts.react : 0.22;   // reaction delay before dodging a threat
  this.agg = opts.agg != null ? opts.agg : 1;             // 1 = copy the player's tempo exactly
  this.cool = 1.0;
  this.seq = null;
  this.seqT = 0;
  this.threatT = 0;
  this.dodged = false;
  this.lastAction = '';
};

TG.MirrorBrain.prototype = {
  foe: function () {
    var f = this.f, list = f.scene.fighters;
    for (var i = 0; i < list.length; i++) if (list[i].team !== f.team && !list[i].dead) return list[i];
    return null;
  },

  update: function (dt) {
    var f = this.f, c = this.c, s = f.scene, foe = this.foe(), U = TG.U, p = this.p;
    c.now = s.nowMs;
    c.move = 0;
    c.hold('up', false);
    c.hold('down', false);
    if (f.dead || !foe) return;

    var dx = foe.x - f.x, dist = Math.abs(dx), to = dx >= 0 ? 1 : -1, g = f.grounded;

    // 1) react to an incoming attack (after a human-ish delay)
    var th = foe.threat ? foe.threat() : null;
    if (th && dist < th.reach + 70) this.threatT += dt; else { this.threatT = 0; this.dodged = false; }
    if (th && this.threatT >= this.reactT && !this.dodged && f.mode === 'free') {
      this.dodged = true;
      var pick = U.weighted([
        { w: 0.25 + p.roll * 3, k: 'roll' }, { w: 0.25 + p.dash * 3, k: 'dash' },
        { w: 0.2 + p.jump * 2, k: 'jump' }, { w: 0.35, k: 'stay' }
      ]);
      if (pick.k === 'roll' && g) { c.move = to; c.press('roll'); this.lastAction = 'roll'; return; }
      if (pick.k === 'dash') { c.move = -to; c.press('dash'); this.lastAction = 'dash'; return; }
      if (pick.k === 'jump') { c.press('up'); this.lastAction = 'jump'; }
    }

    // 2) continue a planned attack sequence
    if (this.seq) {
      if (f.mode === 'free') f.facing = to;
      this.seqT -= dt;
      if (this.seqT <= 0) {
        if (this.seq.n > 0) { c.press(this.seq.key); this.seq.n--; this.seqT = this.seq.gap; }
        else if (f.mode === 'free') this.seq = null;
      }
      return;
    }
    if (f.mode !== 'free') return;
    f.facing = to;
    this.cool -= dt;

    // 3) positioning
    var pref = this.cool <= 0 ? 78 : U.clamp(p.dist, 90, 280);   // close in when ready to strike
    if (dist > pref + 25) c.move = to;
    else if (dist < pref - 50 && this.cool > 0 && U.chance(dt * 1.2)) c.move = -to;
    if (dist > 320 && g && U.chance(dt * (0.4 + p.dash * 3))) { c.move = to; c.press('dash'); this.lastAction = 'dash'; return; }

    // 4) habits: jumping, air attacks
    if (g && U.chance(dt * p.jump * 0.9)) c.press('up');
    if (!g) {
      if (f.vy > -100 && f.airJumps > 0 && U.chance(dt * p.djump * 4)) c.press('up');
      if (dist < 120 && U.chance(dt * 3)) c.press('light');
    }

    // 5) attack, using the player's own light/heavy ratio and combo length
    if (this.cool <= 0 && dist < 112 && g) {
      var pHeavy = p.heavy / (p.heavy + p.light * 0.25 + 0.001);
      if (Math.random() < pHeavy) this.seq = { key: 'heavy', n: 1, gap: 0 };
      else this.seq = { key: 'light', n: U.clamp(Math.round(p.combo + U.rand(-0.6, 0.6)), 1, 3), gap: 0.19 };
      this.seqT = 0;
      this.cool = U.clamp(1.1 / (p.light + 0.25), 0.4, 2.4) / this.agg + U.rand(0, 0.3);
      this.lastAction = this.seq.key;
    }
  }
};

// ---------------------------------------------------------------------------------------------
// The Mirror's brain. BASELINE is the same for every player: very fast, evasive, reads attacks.
// The ONLY thing the record changes is STYLE: slip behind you (flank) or meet you head-on (direct),
// plus your preferred dodge, combo length and heavy-swing habit.
//   phase 1: aggressive. phase 2 (after the shield shatters): it kites and dodges, because every blow
//   it takes comes back to you. It tries not to be hit, so you do not hurt yourself.
TG.ShadeBrain = function (fighter, profile, opts) {
  opts = opts || {};
  this.f = fighter; this.p = profile; this.c = fighter.ctrl;
  this.flank = opts.flank != null ? opts.flank : TG.Record.flank(profile);
  this.react = opts.react != null ? opts.react : 0.1;
  this.evade = opts.evade != null ? opts.evade : 0.55;
  this.cool = 2.2;
  this.seq = null; this.seqT = 0;
  this.threatT = 0; this.dodged = false;
  this.after = null;
  this.yielding = false;
  this.phase = 1;
  this.hold = 0;           // brief stand-still after a failed approach, keeps movement from looking robotic
  this.style = this.flank > 0.55 ? 'flank' : (this.flank < 0.36 ? 'direct' : 'mixed');
};

TG.ShadeBrain.prototype = {
  foe: TG.MirrorBrain.prototype.foe,

  startCombo: function (kind) {
    var p = this.p, U = TG.U;
    var pHeavy = U.clamp(p.heavy / (p.heavy + p.light * 0.25 + 0.001), 0, 0.45);
    if (kind !== 'punish' && Math.random() < pHeavy) this.seq = { key: 'heavy', n: 1, gap: 0 };
    else this.seq = { key: 'light', n: U.clamp(Math.round(p.combo + U.rand(-0.4, 0.9)), 2, 3), gap: 0.15 };
    this.seqT = 0;
    var base = this.phase === 2 ? U.rand(1.0, 1.7) : U.rand(0.35, 0.8);
    this.cool = base;
  },

  dodge: function (dist, to, g) {
    var c = this.c, p = this.p, U = TG.U, f = this.f;
    var opts = g ? [
      { w: 0.2 + this.flank * 2.4, k: 'through' },
      { w: 0.2 + (1 - this.flank) * 2.0, k: 'back' },
      { w: 0.25 + p.jump * 1.4, k: 'jump' },
      { w: 0.2 + p.roll * 2.2, k: 'roll' }
    ] : [
      { w: 0.3 + this.flank * 2, k: 'through' },
      { w: 0.3 + (1 - this.flank) * 2, k: 'back' }
    ];
    var k = U.weighted(opts).k;
    if (k === 'through') { c.move = to; c.press('dash'); this.after = { t: 0.26, kind: 'punish' }; }
    else if (k === 'back') { c.move = -to; c.press('dash'); this.after = { t: 0.34, kind: this.phase === 2 ? 'none' : 'rush' }; }
    else if (k === 'roll') { c.move = to; c.press('roll'); this.after = { t: 0.46, kind: 'punish' }; }
    else { c.press('up'); if (f.airJumps > 0 && dist < 150) this.after = { t: 0.05, kind: 'air' }; }
  },

  update: function (dt) {
    var f = this.f, c = this.c, s = f.scene, U = TG.U, p = this.p;
    c.now = s.nowMs; c.move = 0; c.hold('up', false); c.hold('down', false);
    var foe = this.foe();
    if (f.dead || !foe || this.yielding) return;
    var dx = foe.x - f.x, dist = Math.abs(dx), to = dx >= 0 ? 1 : -1, g = f.grounded, w = s.world;

    // 1) read the player's attacks and avoid them (phase 2 avoids harder: every hit it takes hurts you)
    var th = foe.threat ? foe.threat() : null;
    if (th && dist < th.reach + 100) this.threatT += dt; else { this.threatT = 0; this.dodged = false; }
    if (th && !this.dodged && this.threatT >= this.react && (f.mode === 'free' || f.mode === 'attack')) {
      this.dodged = true;
      if (Math.random() < this.evade) { this.seq = null; this.dodge(dist, to, g); return; }
    }

    // 2) a combo in progress
    if (this.seq) {
      if (f.mode === 'free') f.facing = to;
      this.seqT -= dt;
      if (this.seqT <= 0) {
        if (this.seq.n > 0) { c.press(this.seq.key); this.seq.n--; this.seqT = this.seq.gap; }
        else if (f.mode === 'free') this.seq = null;
      }
      return;
    }

    // 3) the follow-up to a dodge
    if (this.after) {
      this.after.t -= dt;
      if (this.after.t <= 0) {
        var a = this.after; this.after = null;
        if (f.mode === 'free' || f.mode === 'dash') {
          if (a.kind === 'punish') { f.facing = to; this.startCombo('punish'); }
          else if (a.kind === 'rush' && dist > 90) { c.move = to; c.press('dash'); this.after = { t: 0.24, kind: 'punish' }; }
          else if (a.kind === 'air') { c.press('up'); }
        }
      }
      return;
    }
    if (f.mode !== 'free') return;
    f.facing = to;
    this.cool -= dt;

    // 4) punish a player who just swung and missed
    if (foe.mode === 'attack' && foe.act && foe.act.t > foe.act.d.windup + foe.act.d.active && dist < 150 && g && this.cool < 0.4) {
      this.startCombo('punish'); return;
    }

    // 5) air habits
    if (!g) {
      if (dist < 130 && U.chance(dt * 4)) c.press('light');
      return;
    }
    if (foe.grounded === false && dist < 160 && U.chance(dt * 2)) { c.press('up'); return; }

    // 6) neutral game
    if (this.phase === 2) { this.kite(dt, dist, to, foe, w); return; }

    if (this.cool > 0) {
      if (dist > 200) c.move = to;
      else if (dist < 105 && U.chance(dt * 2.5)) c.move = -to;
      return;
    }
    // ready to strike: choose the approach from the player's style
    var foeFacesMe = foe.facing * (f.x - foe.x) > 0;
    if (dist <= 108) { this.startCombo('direct'); return; }
    if (dist < 340 && foeFacesMe && Math.random() < this.flank * 0.9 && g) {
      if (Math.random() < 0.55) { c.move = to; c.press('dash'); this.after = { t: 0.26, kind: 'punish' }; }
      else { c.move = to; c.press('up'); this.after = { t: 0.28, kind: 'air' }; }
      this.cool = 0.5; return;
    }
    if (dist > 175) { c.move = to; c.press('dash'); this.after = { t: 0.24, kind: 'punish' }; this.cool = 0.5; return; }
    c.move = to;
  },

  // phase 2: keep out of reach, dodge, only hit when it is safe
  kite: function (dt, dist, to, foe, w) {
    var c = this.c, f = this.f, U = TG.U;
    var wallBehind = (-to < 0 && f.x - w.left < 130) || (-to > 0 && w.right - f.x < 130);
    if (dist < 185) {
      if (wallBehind) {
        if (U.chance(dt * 3)) { c.move = to; c.press('dash'); this.after = { t: 0.26, kind: 'none' }; }
      } else {
        c.move = -to;
        if (U.chance(dt * 1.6)) c.press('dash');
      }
    } else if (dist > 290) c.move = to;
    if (this.cool <= 0 && dist < 125) this.startCombo('direct');
  }
};
