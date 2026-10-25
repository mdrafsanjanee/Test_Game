// Cinematic toolkit: the "feel" layer. No video, no shaders, a handful of shared Graphics objects.
//   var cine = TG.Cine.attach(scene);          // cutscenes get this automatically; the arena uses a reduced set
//   cine.bars(true)                            letterbox in/out
//   cine.shot({x, y, z}, ms)                   slow push / pull / pan (cutscenes only)
//   cine.track(fn, lerp)                       camera follows fn() -> {x, y}
//   cine.grade(color, alpha, ms)               full-screen colour tint (tween it, never cut)
//   cine.vignette(alpha, ms)                   dark edges
//   cine.shafts(color, alpha)                  slanted additive light shafts
//   cine.motes('petal'|'butterfly'|'ash'|'ember'|'dust'|'snow', n)   drifting particles (cap 90)
//   cine.slowmo(scale, ms)   cine.hitstop(ms)  cine.shake(i, ms)   cine.flash(color, ms)
//   cine.title('Name', 'sub')                  location card
//   cine.timeline([[ms, fn], ...])             run beats in order
// Everything tweens through scene.tweens / scene.time, so pause and fast-forward keep working.
(function () {
  var W = TG.W, H = TG.H, BAR = 78, D2R = Math.PI / 180;
  var MOODS = {
    none:   [0x000000, 0.0],
    lava:   [0xff4a10, 0.16],
    ember:  [0xff7a2a, 0.12],
    cold:   [0x1a3a6a, 0.22],
    ash:    [0x2a1a14, 0.28],
    dusk:   [0xff9a4a, 0.14],
    crystal:[0x2a8a9a, 0.12],
    grey:   [0x20202a, 0.40],
    white:  [0xfff4e6, 0.55]
  };

  function bakeOnce(scene, key, w, h, fn) {
    if (!scene.textures.exists(key)) TG.Art.bake(scene, key, w, h, fn);
  }

  function Cine(scene, opts) {
    opts = opts || {};
    this.s = scene;
    this.zoomOK = opts.zoom !== false;
    this.v = { bar: 0, tint: 0, vig: 0, flash: 0, shaft: 0, zoom: 1, cx: W / 2, cy: H / 2, title: 0 };
    this.barH = BAR;
    this.tintColor = 0x000000;
    this.flashColor = 0xffffff;
    this.shotOn = false;
    this.trackFn = null; this.trackK = 3;
    this.handheldAmp = 0;
    this.parts = [];
    this.t = 0;
    var self = this;

    bakeOnce(scene, 'cine_vig', 640, 360, function (g) {
      for (var k = 0; k < 52; k++) {
        var t = k / 51, r = 0.5 + 1.0 * t;
        g.lineStyle(9, 0x000000, 0.95 * Math.pow(t, 2.3));
        g.strokeEllipse(320, 180, 640 * r, 360 * r);
      }
    });
    bakeOnce(scene, 'cine_shaft', 256, 720, function (g) {
      var i, y, bands = 18;
      var shafts = [[20, 34, 120], [92, 22, 90], [150, 40, 150], [212, 18, 70]];
      for (i = 0; i < shafts.length; i++) {
        var x0 = shafts[i][0], w = shafts[i][1], skew = shafts[i][2];
        for (y = 0; y < bands; y++) {
          var y0 = y * 720 / bands, y1 = (y + 1) * 720 / bands + 1, a = 0.5 * (1 - y / bands);
          var xa = x0 + skew * (y0 / 720), xb = x0 + skew * (y1 / 720);
          g.fillStyle(0xffffff, a * 0.5);
          g.fillTriangle(xa, y0, xa + w, y0, xb, y1);
          g.fillTriangle(xa + w, y0, xb + w, y1, xb, y1);
        }
      }
    });

    this.vig = scene.add.image(W / 2, H / 2, 'cine_vig').setScale(2).setScrollFactor(0).setDepth(85).setAlpha(0);
    this.tintR = scene.add.rectangle(W / 2, H / 2, W + 8, H + 8, 0x000000, 0).setScrollFactor(0).setDepth(80);
    this.shaft = [];
    for (var i = 0; i < 3; i++) {
      var im = scene.add.image(W * (0.18 + i * 0.32), H / 2, 'cine_shaft').setScale(1.9, 1).setScrollFactor(0)
        .setDepth(79).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff0d0);
      this.shaft.push(im);
    }
    this.pg = scene.add.graphics().setScrollFactor(0).setDepth(78);
    this.barG = scene.add.graphics().setScrollFactor(0).setDepth(90);
    this.flashR = scene.add.rectangle(W / 2, H / 2, W + 8, H + 8, 0xffffff, 0).setScrollFactor(0).setDepth(89);   // under the bars
    var st = { fontFamily: 'Georgia, serif', color: '#f2eee6' };
    this.titleT = scene.add.text(W / 2, H / 2 - 18, '', Object.assign({ fontSize: '40px', fontStyle: 'italic', letterSpacing: 6 }, st))
      .setOrigin(0.5).setScrollFactor(0).setDepth(92).setAlpha(0).setShadow(0, 2, '#000', 10);
    this.titleS = scene.add.text(W / 2, H / 2 + 28, '', Object.assign({ fontSize: '16px', letterSpacing: 4, color: '#c9c4dc' }, st))
      .setOrigin(0.5).setScrollFactor(0).setDepth(92).setAlpha(0).setShadow(0, 2, '#000', 8);
    this.shaftColor = 0xfff0d0; this.shaftA = 0;
    this.comp = false;
  }

  Cine.prototype = {
    // ---- tween plumbing -------------------------------------------------------
    to: function (prop, val, ms, ease, cb) {
      var s = this.s, v = this.v;
      this.tw = this.tw || {};
      if (this.tw[prop]) { this.tw[prop].stop(); this.tw[prop] = null; }       // one live tween per property
      if (!ms) { v[prop] = val; if (cb) cb(); return; }
      var cfg = { targets: v, duration: ms, ease: ease || 'Sine.easeInOut', onComplete: cb };
      cfg[prop] = val;
      this.tw[prop] = s.tweens.add(cfg);
    },

    // ---- letterbox ------------------------------------------------------------
    bars: function (on, ms, h) {
      if (h) this.barH = h;
      this.to('bar', on ? 1 : 0, ms == null ? 700 : ms, 'Cubic.easeInOut');
    },

    // ---- colour ---------------------------------------------------------------
    grade: function (color, alpha, ms) {
      if (typeof color === 'string') { var m = MOODS[color] || MOODS.none; color = m[0]; alpha = alpha == null ? m[1] : alpha; }
      this.tintColor = color;
      this.tintR.setFillStyle(color, 1);
      this.to('tint', alpha, ms == null ? 1200 : ms);
    },
    vignette: function (a, ms) { this.to('vig', a, ms == null ? 1000 : ms); },
    flash: function (color, ms, peak) {
      this.flashColor = color == null ? 0xffffff : color;
      this.v.flash = peak == null ? 0.9 : peak;
      this.to('flash', 0, (ms || 500) * (this.s.tscale || 1), 'Quad.easeOut');      // stays a quick pulse even inside slow motion
    },
    shafts: function (color, a) {
      this.shaftColor = color == null ? 0xfff0d0 : color;
      for (var i = 0; i < this.shaft.length; i++) this.shaft[i].setTint(this.shaftColor);
      this.to('shaft', a == null ? 0.35 : a, 1400);
    },

    // ---- camera ---------------------------------------------------------------
    // Cutscene only (the arena's parallax layers do not survive a zoom).
    shot: function (p, ms, ease) {
      if (!this.zoomOK) return;
      this.shotOn = true;
      var cfg = { targets: this.v, duration: ms || 2000, ease: ease || 'Sine.easeInOut' };   // only tween what the caller named,
      if (p.z != null) cfg.zoom = p.z;                                                         // so track() can keep steering x / y
      if (p.x != null) cfg.cx = p.x;
      if (p.y != null) cfg.cy = p.y;
      this.s.tweens.add(cfg);
    },
    cut: function (p) {                       // hard cut to a framing
      if (!this.zoomOK) return;
      this.shotOn = true; var v = this.v;
      v.zoom = p.z == null ? v.zoom : p.z; v.cx = p.x == null ? v.cx : p.x; v.cy = p.y == null ? v.cy : p.y;
    },
    track: function (fn, k) { this.trackFn = fn; this.trackK = k || 3; this.shotOn = true; },
    untrack: function () { this.trackFn = null; },
    handheld: function (amp) { this.handheldAmp = amp || 0; if (amp) this.shotOn = true; },
    shake: function (i, ms) { this.s.cameras.main.shake(ms || 300, i || 0.006); },

    // ---- time -----------------------------------------------------------------
    slowmo: function (scale, ms) {
      var s = this.s;
      if (s.slow !== undefined) {                       // arena: simulation scale
        s.slow = scale; s.time.delayedCall(ms * scale, function () { s.slow = 1; });
      } else {                                          // cutscene: everything on the scene clock
        s.tscale = scale; if (s.applyTime) s.applyTime();
        s.time.delayedCall(ms * scale, function () { s.tscale = 1; if (s.applyTime) s.applyTime(); });
      }
    },
    hitstop: function (ms) {
      var s = this.s;
      if (s.hitstop) s.hitstop(ms); else s.freeze = Math.max(s.freeze || 0, ms / 1000);
    },

    // ---- text -----------------------------------------------------------------
    title: function (main, sub, hold) {
      var s = this.s, tt = this.titleT, ts = this.titleS;
      tt.setText(main || ''); ts.setText(sub || '');
      s.tweens.add({ targets: [tt, ts], alpha: 1, duration: 900, ease: 'Sine.easeIn',
        onComplete: function () { s.tweens.add({ targets: [tt, ts], alpha: 0, duration: 1200, delay: hold || 1600, ease: 'Sine.easeOut' }); } });
    },

    timeline: function (beats) {
      var s = this.s, self = this;
      beats.forEach(function (b) { s.time.delayedCall(b[0], function () { b[1](self); }); });
    },

    // ---- drifting particles ---------------------------------------------------
    motes: function (kind, n) {
      var i, P = this.parts, cap = 90;
      for (i = 0; i < n && P.length < cap; i++) P.push(this._mote(kind, true));
    },
    clearMotes: function () { this.parts.length = 0; },
    _mote: function (kind, scatter) {
      var U = TG.U, r = U.rand, p = { k: kind, x: r(0, W), y: scatter ? r(0, H) : -10, ph: r(0, 6.28), sz: r(2, 4.5) };
      if (kind === 'petal') {
        p.vx = r(30, 80); p.vy = r(25, 60); p.sz = r(3, 5.5); p.c = [0xffd0dc, 0xffe4ea, 0xffffff, 0xffc4d4][(Math.random() * 4) | 0]; p.a = r(0.55, 0.95);
        if (!scatter) { p.x = r(-200, W * 0.7); }
      } else if (kind === 'butterfly') {
        p.vx = r(-26, 26); p.vy = r(-18, 10); p.sz = r(5, 8); p.c = [0x9fe8ff, 0xffd0f0, 0xfff0a0][(Math.random() * 3) | 0]; p.a = 0.95;
        p.y = scatter ? r(H * 0.15, H * 0.75) : H * 0.8;
      } else if (kind === 'ash') {
        p.vx = r(-14, 10); p.vy = r(14, 42); p.sz = r(1.6, 3.4); p.c = 0xcab8a8; p.a = r(0.3, 0.7);
      } else if (kind === 'ember') {
        p.vx = r(-10, 24); p.vy = r(-70, -24); p.sz = r(1.6, 3.2); p.c = [0xff7a2a, 0xffb347, 0xff4a10][(Math.random() * 3) | 0]; p.a = r(0.6, 1);
        p.y = scatter ? r(0, H) : H + 8;
      } else if (kind === 'snow') {
        p.vx = r(-12, 12); p.vy = r(18, 46); p.sz = r(1.5, 3); p.c = 0xe8f0ff; p.a = r(0.4, 0.85);
      } else {                                           // dust: slow, lit
        p.vx = r(4, 16); p.vy = r(-6, 6); p.sz = r(1.2, 2.6); p.c = 0xfff0d0; p.a = r(0.2, 0.55);
      }
      return p;
    },

    // ---- per-frame ------------------------------------------------------------
    update: function (dt) {
      var s = this.s, v = this.v, cam = s.cameras.main, i, p, g = this.pg;
      this.t += dt;

      // zoom / pan (cutscenes)
      if (this.zoomOK && this.shotOn) {
        if (this.trackFn) {
          var q = this.trackFn(), k = Math.min(1, dt * this.trackK);
          v.cx += (q.x - v.cx) * k; v.cy += (q.y - v.cy) * k;
        }
        var z = v.zoom, hx = Math.sin(this.t * 1.7) * this.handheldAmp, hy = Math.cos(this.t * 1.3) * this.handheldAmp * 0.7;
        var mx = W / 2 / z, my = H / 2 / z;
        var cx = TG.U.clamp(v.cx + hx, mx, W - mx), cy = TG.U.clamp(v.cy + hy, my, H - my);
        cam.setZoom(z);
        cam.centerOn(cx, cy);
        this.compensate(z);
      }

      // overlays
      this.tintR.setFillStyle(this.tintColor, v.tint);
      this.vig.setAlpha(v.vig);
      this.flashR.setFillStyle(this.flashColor, v.flash);
      var sa = v.shaft * (0.8 + 0.2 * Math.sin(this.t * 0.9));
      for (i = 0; i < this.shaft.length; i++) this.shaft[i].setAlpha(sa * (0.7 + 0.3 * Math.sin(this.t * 0.7 + i * 2.1)));

      var bh = this.barH * v.bar, bg = this.barG;
      bg.clear();
      if (bh > 0.5) {
        bg.fillStyle(0x000000, 1);
        bg.fillRect(0, 0, W, bh); bg.fillRect(0, H - bh, W, bh);
      }

      // motes
      g.clear();
      for (i = this.parts.length - 1; i >= 0; i--) {
        p = this.parts[i];
        p.ph += dt * (p.k === 'butterfly' ? 9 : 2);
        if (p.k === 'butterfly') { p.vx += Math.sin(p.ph * 0.31) * 18 * dt; p.vy += Math.cos(p.ph * 0.23) * 14 * dt; p.vx *= 0.99; p.vy *= 0.99; }
        p.x += (p.vx + Math.sin(p.ph) * (p.k === 'petal' ? 26 : 6)) * dt;
        p.y += p.vy * dt;
        if (p.x > W + 20 || p.x < -40 || p.y > H + 20 || p.y < -30) {
          var np = this._mote(p.k, false);
          if (p.k === 'butterfly') { np.x = p.x > W ? -10 : (p.x < 0 ? W + 10 : p.x); np.y = TG.U.clamp(p.y, 60, H - 100); }
          else if (p.k === 'ember') np.y = H + 8;
          this.parts[i] = p = np;
        }
        if (p.k === 'butterfly') {
          var f = Math.abs(Math.sin(p.ph)), wv = p.sz * (0.25 + 0.75 * f);
          g.fillStyle(p.c, 0.07); g.fillCircle(p.x, p.y, p.sz * 1.7);
          g.fillStyle(p.c, p.a);
          g.fillTriangle(p.x, p.y, p.x - wv * 1.5, p.y - p.sz * 0.9, p.x - wv * 1.1, p.y + p.sz * 0.6);
          g.fillTriangle(p.x, p.y, p.x + wv * 1.5, p.y - p.sz * 0.9, p.x + wv * 1.1, p.y + p.sz * 0.6);
        } else if (p.k === 'petal') {
          var sq = 0.4 + 0.6 * Math.abs(Math.sin(p.ph * 1.3));
          g.fillStyle(p.c, p.a); g.fillEllipse(p.x, p.y, p.sz * 1.7, p.sz * sq);
        } else {
          g.fillStyle(p.c, p.a * (0.7 + 0.3 * Math.sin(p.ph * 2)));
          g.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
        }
      }
    },

    // Keep screen-space UI (scrollFactor 0) the same size and place while the camera zooms.
    compensate: function (z) {
      var list = this.s.children.list, i, o, cx = W / 2, cy = H / 2;
      if (z === 1 && !this.comp) return;
      for (i = 0; i < list.length; i++) {
        o = list[i];
        if (o.scrollFactorX !== 0 || o.scrollFactorY !== 0 || !o.setScale) continue;
        if (o.__ox === undefined) { o.__ox = o.x; o.__oy = o.y; o.__sx = o.scaleX; o.__sy = o.scaleY; }
        o.x = cx + (o.__ox - cx) / z; o.y = cy + (o.__oy - cy) / z;
        o.setScale(o.__sx / z, o.__sy / z);
      }
      this.comp = z !== 1;
    }
  };

  TG.Cine = {
    MOODS: MOODS,
    BAR: BAR,
    attach: function (scene, opts) {
      var c = new Cine(scene, opts);
      scene.cine = c;
      scene.events.once('shutdown', function () { scene.cine = null; });
      return c;
    }
  };
})();
