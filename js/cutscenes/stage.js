// Tiny helpers shared by the cutscenes (Agent B): two actors that walk, idle, blend between poses and fall.
// actor = TG.Stage.actor(x, facing, rigCfg, groundY); call TG.Stage.step(actor, dt, time) every frame.
TG.Stage = {
  heroCfg: Object.assign({}, TG.Rig.defaults, { scale: 1.6, rim: 0xa8c4ff, rimA: 0.6 }),

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
  }
};
