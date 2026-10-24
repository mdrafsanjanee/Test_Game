// Lightweight effects drawn into two shared Graphics objects (sparks, dust, smears,
// rings, afterimages). No particle-emitter objects, no per-effect game objects.
TG.FX = function (scene) {
  this.s = scene;
  this.g = scene.add.graphics().setDepth(25);
  this.gg = scene.add.graphics().setDepth(9);
  this.parts = [];
  this.smears = [];
  this.rings = [];
  this.ghosts = [];
};

TG.FX.prototype = {
  _add: function (p) {
    if (this.parts.length > 260) this.parts.shift();
    this.parts.push(p);
  },

  spark: function (x, y, dir, n, color, power) {
    for (var i = 0; i < n; i++) {
      var a = (dir > 0 ? 0 : Math.PI) + TG.U.rand(-1.15, 1.15);
      var sp = TG.U.rand(160, 560) * (power || 1);
      var life = TG.U.rand(0.1, 0.3);
      this._add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: life, max: life,
                  color: color, w: TG.U.rand(1.6, 3.2), grav: 900, drag: 2.4, kind: 'line' });
    }
  },
  dust: function (x, y, n, spread) {
    for (var i = 0; i < n; i++) {
      var life = TG.U.rand(0.25, 0.55);
      this._add({ x: x + TG.U.rand(-(spread || 14), spread || 14), y: y - 2,
                  vx: TG.U.rand(-90, 90), vy: TG.U.rand(-70, -10), life: life, max: life,
                  color: 0x9a8f88, w: TG.U.rand(3, 7), grav: -20, drag: 3, kind: 'dot', a: 0.35 });
    }
  },
  ember: function (x, y, color) {
    var life = TG.U.rand(1.6, 3.2);
    this._add({ x: x, y: y, vx: TG.U.rand(-20, 30), vy: TG.U.rand(-70, -25), life: life, max: life,
                color: color || 0xff7a2a, w: TG.U.rand(1.5, 3), grav: -8, drag: 0.4, kind: 'dot', a: 0.9 });
  },

  // def: {r, a0, a1} degrees, 0 = straight ahead, negative = up. a1 < a0 sweeps upward.
  smear: function (x, y, f, def, color, life) {
    this.smears.push({ x: x, y: y, f: f, r: def.r, a0: def.a0, a1: def.a1, w: def.w || 9,
                       color: color, life: life || 0.2, max: life || 0.2 });
  },
  ring: function (x, y, r0, r1, color, life, w) {
    this.rings.push({ x: x, y: y, r0: r0, r1: r1, color: color, life: life || 0.35, max: life || 0.35, w: w || 3 });
  },
  ghost: function (fighter, color) {
    var p = {};
    for (var k in fighter.pose) p[k] = fighter.pose[k];
    this.ghosts.push({ x: fighter.x, y: fighter.y, f: fighter.facing, pose: p, cfg: fighter.rigCfg,
                       color: color || 0x6f8fd0, life: 0.22, max: 0.22 });
  },

  update: function (dt) {
    var i, p;
    for (i = this.parts.length - 1; i >= 0; i--) {
      p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      var d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (i = this.smears.length - 1; i >= 0; i--) {
      this.smears[i].life -= dt;
      if (this.smears[i].life <= 0) this.smears.splice(i, 1);
    }
    for (i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }
    for (i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].life -= dt;
      if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
    }
    this.draw();
  },

  draw: function () {
    var g = this.g, i, p, D2R = Math.PI / 180;
    g.clear();
    this.gg.clear();

    for (i = 0; i < this.ghosts.length; i++) {
      var gh = this.ghosts[i];
      TG.Rig.draw(this.gg, gh.x, gh.y, gh.f, gh.pose, gh.cfg, 0.32 * (gh.life / gh.max), gh.color, true);
    }

    for (i = 0; i < this.smears.length; i++) {
      var s = this.smears[i];
      var t = 1 - s.life / s.max;
      var reveal = Math.min(1, t / 0.4);
      var fade = 1 - Math.max(0, (t - 0.4) / 0.6);
      var cur = s.a0 + (s.a1 - s.a0) * reveal;
      var ccw = (s.a1 < s.a0) !== (s.f < 0);
      var tails = [0, 0.35, 0.65], widths = [s.w, s.w * 0.65, s.w * 0.32], alphas = [0.3, 0.55, 0.95];
      for (var k = 0; k < 3; k++) {
        var st = s.a0 + (cur - s.a0) * tails[k];
        var A = s.f > 0 ? st : 180 - st, B = s.f > 0 ? cur : 180 - cur;
        g.lineStyle(widths[k], s.color, alphas[k] * fade);
        g.beginPath();
        g.arc(s.x, s.y, s.r, A * D2R, B * D2R, ccw);
        g.strokePath();
      }
    }

    for (i = 0; i < this.rings.length; i++) {
      var r = this.rings[i], rt = 1 - r.life / r.max;
      g.lineStyle(r.w, r.color, 0.8 * (1 - rt));
      g.strokeCircle(r.x, r.y, TG.U.lerp(r.r0, r.r1, TG.U.ease.outCubic(rt)));
    }

    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      var a = (p.a == null ? 1 : p.a) * (p.life / p.max);
      if (p.kind === 'line') {
        g.lineStyle(p.w, p.color, a);
        g.lineBetween(p.x, p.y, p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      } else {
        g.fillStyle(p.color, a);
        g.fillRect(p.x - p.w / 2, p.y - p.w / 2, p.w, p.w);
      }
    }
  }
};
