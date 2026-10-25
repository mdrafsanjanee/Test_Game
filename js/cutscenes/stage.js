// Tiny helpers shared by the cutscenes (Agent B): two actors that walk, idle, blend between poses and fall.
// actor = TG.Stage.actor(x, facing, rigCfg, groundY); call TG.Stage.step(actor, dt, time) every frame.
TG.Stage = {
  heroCfg: Object.assign({}, TG.Rig.defaults, { scale: 1.6, rim: 0xa8c4ff, rimA: 0.6, trails: TG.Rig.presets.hero(0xc4553a, 0x6f86b8) }),

  actor: function (x, f, cfg, y) {
    return { x: x, y: y, f: f, cfg: cfg, pose: TG.Pose.make(), mode: 'idle', ph: 0, vx: 0, vy: 0, spin: 0,
             tx: null, speed: 0, cb: null, from: TG.Pose.make(), to: null, k: 0, dur: 1 };
  },

  walk: function (a, tx, speed, cb) { a.tx = tx; a.speed = speed; a.cb = cb || null; a.mode = 'walk'; },

  // Smoothly change to another pose over `ms` (with a little overshoot).
  blend: function (a, pose, ms) { TG.Pose.copy(a.pose, a.from); a.to = pose; a.k = 0; a.dur = ms; a.mode = 'blend'; },

  step: function (a, dt, t) {
    var Pose = TG.Pose;
    if (a.mode === 'walk') {
      var d = a.tx - a.x;
      if (Math.abs(d) < 4) {
        a.mode = 'idle';
        if (a.cb) { var c = a.cb; a.cb = null; c(); }
      } else {
        a.f = d > 0 ? 1 : -1; a.x += a.f * a.speed * dt; a.ph += dt * 8;
        Pose.run(a.pose, a.ph, 0.55);
      }
    }
    if (a.mode === 'idle') Pose.idle(a.pose, t);
    else if (a.mode === 'blend') { a.k = Math.min(1, a.k + dt * 1000 / a.dur); Pose.mix(a.from, a.to, TG.U.ease.outBack(a.k), a.pose); }
    else if (a.mode === 'fall') { a.vy += 1700 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.spin += 520 * dt; a.pose.rot = a.spin; }
  },

  // A parallax layer from a baked texture. factor < 1 sits behind the action and drifts less when the camera moves;
  // grow > 1 oversizes it so the zoomed or panned camera never reveals an edge.
  layer: function (scene, key, factor, depth, grow) {
    var im = scene.add.image(TG.W / 2, TG.H / 2, key).setScrollFactor(factor).setDepth(depth);
    if (grow && grow !== 1) im.setScale(grow);
    return im;
  },

  // Cast shadow of an actor on the ground, lit from one side. The shadow can wear a DIFFERENT pose than the body,
  // which is how the girl's intent shows before anything is said.
  //   light: -1 = light comes from the right (shadow falls left), +1 = from the left
  shadow: function (g, a, pose, cfg, groundY, light, alpha, color) {
    var p = TG.Rig.kin(pose, cfg, a.f), s = cfg.scale, dir = light < 0 ? -1 : 1;
    function pr(q) { var h = -q.y; return { x: a.x + q.x + dir * h * 1.05, y: groundY + 3 + h * 0.13 }; }
    var P = pr(p.P), kF = pr(p.knF), fF = pr(p.ftF), kB = pr(p.knB), fB = pr(p.ftB), nk = pr(p.neck), hd = pr(p.head),
        sh = pr(p.sh), eF = pr(p.elF), hF = pr(p.hnF), eB = pr(p.elB), hB = pr(p.hnB), tp = pr(p.tip);
    g.lineStyle(cfg.limb * s * 0.9, color == null ? 0x000000 : color, alpha);
    function ln(a1, b1, c1) { g.beginPath(); g.moveTo(a1.x, a1.y); g.lineTo(b1.x, b1.y); if (c1) g.lineTo(c1.x, c1.y); g.strokePath(); }
    ln(P, kB, fB); ln(P, kF, fF); ln(sh, eB, hB); ln(sh, eF, hF);
    g.lineStyle(cfg.torsoW * s * 0.9, color == null ? 0x000000 : color, alpha); ln(P, nk);
    g.fillStyle(color == null ? 0x000000 : color, alpha); g.fillCircle(hd.x, hd.y, cfg.headR * s * 0.8);
    if (cfg.weapon.len > 20) { g.lineStyle(2.5, color == null ? 0x000000 : color, alpha); ln(hF, tp); }
  }
};
