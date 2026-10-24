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

    // 0) heal when charged and hurt (hero bot only)
    if (this.healT > 0) {
      this.healT -= dt; c.hold('heal', true);
      if (f.mode === 'hurt') this.healT = 0;
      return;
    }
    c.hold('heal', false);
    if (f.isHero && f.mode === 'free' && g && f.healCharge >= 4 && f.hp < f.maxHp * 0.6 && !(foe.threat && foe.threat())) {
      c.press('heal'); c.hold('heal', true); this.healT = 1.5; return;
    }

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

  // A combo: usually three lights (the third is the stunning finisher), sometimes a heavy.
  startCombo: function (kind) {
    var p = this.p, U = TG.U;
    var pHeavy = U.clamp(p.heavy / (p.heavy + p.light * 0.25 + 0.001), 0, 0.4);
    if (kind !== 'punish' && Math.random() < pHeavy) this.seq = { key: 'heavy', n: 1, gap: 0, end: 'away' };
    else this.seq = { key: 'light', n: Math.random() < 0.7 ? 3 : 2, gap: 0.15, end: U.chance(0.55) ? 'away' : 'again' };
    this.seqT = 0;
    this.cool = this.phase === 2 ? U.rand(0.6, 1.2) : U.rand(0.2, 0.55);
  },

  dodge: function (dist, to, g) {
    var c = this.c, p = this.p, U = TG.U, f = this.f;
    var opts = g ? [
      { w: 0.2 + this.flank * 2.4, k: 'through' },
      { w: 0.2 + (1 - this.flank) * 2.0, k: 'back' },
      { w: 0.4 + p.jump * 1.4, k: 'jump' },
      { w: 0.2 + p.roll * 2.2, k: 'roll' }
    ] : [
      { w: 0.3 + this.flank * 2, k: 'through' },
      { w: 0.3 + (1 - this.flank) * 2, k: 'back' }
    ];
    var k = U.weighted(opts).k;
    if (k === 'through') { c.move = to; c.press('dash'); this.after = { t: 0.26, kind: 'punish' }; }
    else if (k === 'back') { c.move = -to; c.press('dash'); this.after = { t: 0.3, kind: this.phase === 2 ? 'punish' : 'rush' }; }
    else if (k === 'roll') { c.move = to; c.press('roll'); this.after = { t: 0.46, kind: 'punish' }; }
    else { c.move = U.chance(0.5) ? to : -to; c.press('up'); this.after = { t: 0.18, kind: 'air' }; }
  },

  // it never rests: if it has stayed in one spot for ~0.8s it moves somewhere else
  hop: function (dist, to, g) {
    var c = this.c, f = this.f, U = TG.U;
    var k = U.weighted([{ w: 1.2, k: 'dash' }, { w: 1.4, k: 'jump' }, { w: 0.8, k: 'over' }, { w: 0.6, k: 'roll' }]).k;
    var dir = U.chance(0.5) ? 1 : -1;
    if (k === 'dash') { c.move = dir; c.press('dash'); }
    else if (k === 'jump') { c.move = dir; c.press('up'); if (U.chance(0.5)) this.after = { t: 0.2, kind: 'air' }; }
    else if (k === 'over') { c.move = to; c.press('up'); this.after = { t: 0.2, kind: 'air' }; }
    else if (g) { c.move = dir; c.press('roll'); }
    if (dist < 220 && U.chance(0.45)) this.after = this.after || { t: 0.3, kind: 'punish' };
  },

  update: function (dt) {
    var f = this.f, c = this.c, s = f.scene, U = TG.U, p = this.p;
    c.now = s.nowMs; c.move = 0; c.hold('up', false); c.hold('down', false);
    var foe = this.foe();
    if (f.dead || !foe || this.yielding) { c.hold('heal', false); return; }
    var dx = foe.x - f.x, dist = Math.abs(dx), to = dx >= 0 ? 1 : -1, g = f.grounded, w = s.world;
    var dy = foe.y - f.y;

    // 0) channelling a heal: it commits for the full time (that is your window to break it)
    if (this.healT > 0) {
      this.healT -= dt; c.hold('heal', true);
      if (f.mode === 'hurt' || (f.mode === 'free' && this.healT < 1.35)) { this.healT = 0; c.hold('heal', false); }
      else { f.facing = to; return; }
    } else c.hold('heal', false);

    // restlessness bookkeeping
    if (Math.abs(f.x - (this.lx || 0)) > 34 || Math.abs(f.y - (this.ly || 0)) > 10) { this.lx = f.x; this.ly = f.y; this.stillT = 0; }
    else this.stillT = (this.stillT || 0) + dt;

    // 1) read the player's attacks and avoid them
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
        else if (f.mode === 'free') {
          var end = this.seq.end; this.seq = null;
          if (end === 'away') this.after = { t: 0.12, kind: 'away' };
          else if (end === 'again' && dist < 130) this.startCombo('punish');
        }
      }
      return;
    }

    // 3) the follow-up to a dodge / combo
    if (this.after) {
      this.after.t -= dt;
      if (this.after.t <= 0) {
        var a = this.after; this.after = null;
        if (f.mode === 'free' || f.mode === 'dash') {
          if (a.kind === 'punish') { f.facing = to; this.startCombo('punish'); }
          else if (a.kind === 'rush' && dist > 90) { c.move = to; c.press('dash'); this.after = { t: 0.24, kind: 'punish' }; }
          else if (a.kind === 'air') { c.move = to; c.press('up'); }
          else if (a.kind === 'away') { c.move = -to; c.press(U.chance(0.5) ? 'dash' : 'up'); }
          else if (a.kind === 'heal' && g) { this.beginHeal(to); }
        }
      }
      return;
    }
    if (f.mode !== 'free') return;
    f.facing = to;
    this.cool -= dt;

    // 4) heal when hurt and charged: first get clear of the player, then channel
    if (f.canHeal && g && f.healCharge >= 4 && f.hp < f.maxHp * 0.62 && !(foe.mode === 'attack' && dist < 160)) {
      if (dist < 230) { c.move = -to; c.press('dash'); this.after = { t: 0.34, kind: 'heal' }; }
      else this.beginHeal(to);
      return;
    }

    // 5) punish a player who just swung and missed
    if (foe.mode === 'attack' && foe.act && foe.act.t > foe.act.d.windup + foe.act.d.active && dist < 150 && Math.abs(dy) < 90 && g && this.cool < 0.5) {
      this.startCombo('punish'); return;
    }

    // 6) never stand still for long
    if (this.stillT > 0.8) { this.stillT = 0; this.hop(dist, to, g); return; }

    // 7) in the air: swing at anything close
    if (!g) {
      if (dist < 150 && Math.abs(dy) < 120 && U.chance(dt * 6)) c.press('light');
      c.move = dist > 70 ? to : 0;
      if (f.vy > -100 && f.airJumps > 0 && foe.y < f.y - 60 && U.chance(dt * 5)) c.press('up');   // chase upward
      return;
    }

    // 8) the player is on higher ground: jump after them. On a platform with the player below: drop.
    if (foe.grounded && dy < -70) {
      c.move = dist > 40 ? to : 0;
      if (dist < 280 && U.chance(dt * 6)) { c.press('up'); this.after = { t: 0.22, kind: 'air' }; }
      return;
    }
    if (f.onPlatform && dy > 70) {
      c.hold('down', true); c.press('up'); c.move = dist > 60 ? to : 0; return;
    }
    if (foe.grounded === false && dist < 200 && U.chance(dt * 2.5)) { c.move = to; c.press('up'); return; }

    // 9) neutral game
    if (this.phase === 2) { this.kite(dt, dist, to, foe, w); return; }

    if (this.cool > 0) {            // between strikes it circles and hops instead of waiting
      this.strafeT = (this.strafeT || 0) - dt;
      if (this.strafeT <= 0) { this.strafeT = U.rand(0.25, 0.6); this.strafeDir = U.chance(0.5) ? 1 : -1; }
      if (dist > 210) c.move = to;
      else if (dist < 110) c.move = -to;
      else c.move = this.strafeDir;
      if (U.chance(dt * 1.5)) c.press('up');
      if (U.chance(dt * 0.9)) c.press('dash');
      return;
    }
    var foeFacesMe = foe.facing * (f.x - foe.x) > 0;
    if (dist <= 112) { this.startCombo('direct'); return; }
    if (dist < 360 && foeFacesMe && Math.random() < this.flank * 0.9) {
      if (Math.random() < 0.55) { c.move = to; c.press('dash'); this.after = { t: 0.26, kind: 'punish' }; }
      else { c.move = to; c.press('up'); this.after = { t: 0.28, kind: 'air' }; }
      this.cool = 0.4; return;
    }
    if (dist > 170) { c.move = to; c.press('dash'); this.after = { t: 0.24, kind: 'punish' }; this.cool = 0.4; return; }
    c.move = to;
  },

  beginHeal: function (to) {
    this.f.facing = to; this.f.ctrl.press('heal'); this.healT = 1.55; this.seq = null;
  },

  // phase 2: it moves constantly, dodges, and strikes when the opening is safe
  kite: function (dt, dist, to, foe, w) {
    var c = this.c, f = this.f, U = TG.U;
    var wallBehind = (-to < 0 && f.x - w.left < 130) || (-to > 0 && w.right - f.x < 130);
    this.strafeT = (this.strafeT || 0) - dt;
    if (this.strafeT <= 0) { this.strafeT = U.rand(0.3, 0.7); this.strafeDir = U.chance(0.5) ? 1 : -1; }
    if (dist < 170) {
      if (wallBehind) {
        if (U.chance(dt * 4)) { c.move = to; c.press('dash'); this.after = { t: 0.26, kind: 'punish' }; }
      } else { c.move = -to; if (U.chance(dt * 2)) c.press('dash'); }
    } else if (dist > 300) c.move = to;
    else c.move = this.strafeDir;
    if (U.chance(dt * 1.6)) c.press('up');
    if (this.cool <= 0 && dist < 135) this.startCombo('direct');
    else if (this.cool <= 0 && dist < 330 && U.chance(dt * 1.5)) { c.move = to; c.press('dash'); this.after = { t: 0.24, kind: 'punish' }; }
  }
};
