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
