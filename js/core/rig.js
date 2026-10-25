// Procedural shadow-stickman rig (Alan Becker style: smooth, anticipation + overshoot).
// A pose is a bag of joint angles in DEGREES. 0 = limb hanging straight down,
// positive = swinging toward the facing direction, 180 = straight up.
//   lean  torso tilt (forward +)         head  head tilt relative to torso
//   hipF/kneeF  front leg                hipB/kneeB  back leg  (knee negative = bends back)
//   shF/elF     front (weapon) arm       shB/elB     back arm
//   wpn   blade angle relative to forearm
//   rot   whole-body rotation (rolls/flips)   dy  lift the body off the ground
(function () {
  var D2R = Math.PI / 180;
  var KEYS = ['lean', 'hipF', 'kneeF', 'hipB', 'kneeB', 'shF', 'elF', 'shB', 'elB', 'wpn', 'head', 'rot', 'dy'];

  var IDLE = { lean: 6, hipF: 10, kneeF: -8, hipB: -12, kneeB: -10, shF: 35, elF: 35, shB: -12, elB: 25,
               wpn: -20, head: 0, rot: 0, dy: 0 };

  function make(p) { return Object.assign({}, IDLE, p || {}); }

  var Pose = TG.Pose = {
    KEYS: KEYS,
    IDLE: IDLE,
    make: make,

    mix: function (a, b, t, out) {
      for (var i = 0; i < KEYS.length; i++) {
        var k = KEYS[i];
        out[k] = a[k] + (b[k] - a[k]) * t;
      }
      return out;
    },
    copy: function (src, out) {
      for (var i = 0; i < KEYS.length; i++) out[KEYS[i]] = src[KEYS[i]];
      return out;
    },

    // locomotion
    idle: function (out, time) {
      var b = Math.sin(time * 2.4);
      Pose.copy(IDLE, out);
      out.dy = b * 0.9; out.lean = 6 + b * 1.2; out.shF = 35 + b * 2.5; out.shB = -12 - b * 2; out.head = b * 1.5;
      return out;
    },
    run: function (out, ph, k) {
      var s = Math.sin(ph), c = Math.cos(ph);
      Pose.copy(IDLE, out);
      out.lean = 8 + 14 * k;
      out.dy = Math.abs(c) * 2.5 * k;
      out.hipF = 50 * s * k + 10 * (1 - k);
      out.kneeF = -(16 + 62 * Math.max(0, c)) * k - 8 * (1 - k);
      out.hipB = -50 * s * k - 12 * (1 - k);
      out.kneeB = -(16 + 62 * Math.max(0, -c)) * k - 10 * (1 - k);
      out.shF = 40 - 22 * s * k; out.elF = 45; out.shB = -14 + 42 * s * k; out.elB = 35;
      out.wpn = -30; out.head = -5 * k;
      return out;
    },
    air: function (out, vy) {
      var t = TG.U.clamp((vy + 700) / 1400, 0, 1); // 0 = rising fast, 1 = falling fast
      var up = { lean: 8, hipF: 62, kneeF: -78, hipB: -18, kneeB: -50, shF: 120, elF: 25, shB: 70, elB: 30,
                 wpn: -10, head: -4, rot: 0, dy: 0 };
      var dn = { lean: 4, hipF: 24, kneeF: -16, hipB: -16, kneeB: -14, shF: 70, elF: 20, shB: -45, elB: 15,
                 wpn: -15, head: 4, rot: 0, dy: 0 };
      return Pose.mix(up, dn, t, out);
    },

    DASH: make({ lean: 58, hipF: 72, kneeF: -22, hipB: -64, kneeB: -58, shF: -62, elF: 8, shB: -80, elB: 6, wpn: 0, head: -22 }),
    ROLL: make({ lean: 74, hipF: 104, kneeF: -126, hipB: 92, kneeB: -126, shF: 62, elF: 105, shB: 54, elB: 100, wpn: 40, head: 30 }),
    HURT: make({ lean: -26, hipF: 18, kneeF: -14, hipB: -26, kneeB: -8, shF: 120, elF: -20, shB: 80, elB: -10, wpn: 30, head: -22 }),
    DEAD: make({ lean: -84, hipF: 34, kneeF: -50, hipB: -18, kneeB: -30, shF: 110, elF: 20, shB: 60, elB: 20, wpn: 0, head: -20, dy: -8 })
  };

  // ---- kinematics -------------------------------------------------------
  function rot(pt, c, cs, sn) {
    var dx = pt.x - c.x, dy = pt.y - c.y;
    pt.x = c.x + dx * cs - dy * sn;
    pt.y = c.y + dx * sn + dy * cs;
  }

  function kin(pose, cfg, f) {
    var s = cfg.scale, L1 = cfg.thigh * s, L2 = cfg.shin * s, T = cfg.torso * s, A1 = cfg.upper * s, A2 = cfg.fore * s;
    var hF = pose.hipF * D2R, kF = hF + pose.kneeF * D2R, hB = pose.hipB * D2R, kB = hB + pose.kneeB * D2R;
    var dropF = L1 * Math.cos(hF) + L2 * Math.cos(kF);
    var dropB = L1 * Math.cos(hB) + L2 * Math.cos(kB);
    var py = -Math.max(dropF, dropB) - pose.dy * s;

    var P = { x: 0, y: py };
    var knF = { x: Math.sin(hF) * L1 * f, y: py + Math.cos(hF) * L1 };
    var ftF = { x: knF.x + Math.sin(kF) * L2 * f, y: knF.y + Math.cos(kF) * L2 };
    var knB = { x: Math.sin(hB) * L1 * f, y: py + Math.cos(hB) * L1 };
    var ftB = { x: knB.x + Math.sin(kB) * L2 * f, y: knB.y + Math.cos(kB) * L2 };

    var ln = pose.lean * D2R;
    var neck = { x: Math.sin(ln) * T * f, y: py - Math.cos(ln) * T };
    var hd = (pose.lean + pose.head) * D2R, hr = cfg.headR * s;
    var head = { x: neck.x + Math.sin(hd) * hr * 1.45 * f, y: neck.y - Math.cos(hd) * hr * 1.45 };
    var sh = { x: Math.sin(ln) * T * 0.9 * f, y: py - Math.cos(ln) * T * 0.9 };

    var sF = pose.shF * D2R, eF = sF + pose.elF * D2R;
    var elF = { x: sh.x + Math.sin(sF) * A1 * f, y: sh.y + Math.cos(sF) * A1 };
    var hnF = { x: elF.x + Math.sin(eF) * A2 * f, y: elF.y + Math.cos(eF) * A2 };
    var sB = pose.shB * D2R, eB = sB + pose.elB * D2R;
    var elB = { x: sh.x + Math.sin(sB) * A1 * f, y: sh.y + Math.cos(sB) * A1 };
    var hnB = { x: elB.x + Math.sin(eB) * A2 * f, y: elB.y + Math.cos(eB) * A2 };

    var wl = cfg.weapon.len * s, wA = eF + pose.wpn * D2R;
    var dir = { x: Math.sin(wA) * f, y: Math.cos(wA) };
    var tip = { x: hnF.x + dir.x * wl, y: hnF.y + dir.y * wl };

    var r = {
      P: P, knF: knF, ftF: ftF, knB: knB, ftB: ftB, neck: neck, head: head, sh: sh,
      elF: elF, hnF: hnF, elB: elB, hnB: hnB, tip: tip, dir: dir
    };

    if (pose.rot) {
      var c = { x: 0, y: py - T * 0.45 };
      var a = pose.rot * D2R * f, cs = Math.cos(a), sn = Math.sin(a);
      for (var k in r) if (k !== 'dir') rot(r[k], c, cs, sn);
      var dx = r.dir.x, dy = r.dir.y;
      r.dir = { x: dx * cs - dy * sn, y: dx * sn + dy * cs };
    }
    return r;
  }

  function limb(g, a, b, c) {
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
    if (c) g.lineTo(c.x, c.y);
    g.strokePath();
  }

  function pass(g, p, cfg, color, extra, alpha, ox, oy, noWeapon) {
    var s = cfg.scale, w = cfg.limb * s + extra, tw = cfg.torsoW * s + extra, i;
    function pt(q) { return { x: q.x + ox, y: q.y + oy }; }
    var P = pt(p.P), knF = pt(p.knF), ftF = pt(p.ftF), knB = pt(p.knB), ftB = pt(p.ftB), neck = pt(p.neck),
        head = pt(p.head), sh = pt(p.sh), elF = pt(p.elF), hnF = pt(p.hnF), elB = pt(p.elB), hnB = pt(p.hnB);

    g.fillStyle(color, alpha);
    g.lineStyle(w, color, alpha);
    limb(g, P, knB, ftB);                      // back leg
    limb(g, sh, elB, hnB);                     // back arm
    g.lineStyle(tw, color, alpha);
    limb(g, P, neck);                          // torso
    g.lineStyle(w, color, alpha);
    limb(g, P, knF, ftF);                      // front leg
    limb(g, sh, elF, hnF);                     // front arm
    var pts = [knB, ftB, elB, hnB, knF, ftF, elF, hnF];
    for (i = 0; i < pts.length; i++) g.fillCircle(pts[i].x, pts[i].y, w / 2);
    g.fillCircle(P.x, P.y, tw / 2);
    g.fillCircle(neck.x, neck.y, tw / 2);
    g.fillCircle(head.x, head.y, cfg.headR * s + extra / 2);

    if (cfg.horns) {                           // optional silhouette horns
      var hs = cfg.horns * s, hx = head.x, hy = head.y, f = p.f;
      g.lineStyle(Math.max(2, w * 0.45), color, alpha);
      limb(g, { x: hx - f * 2 * s, y: hy - cfg.headR * s * 0.6 }, { x: hx - f * 6 * s, y: hy - hs }, { x: hx - f * 1 * s, y: hy - hs * 1.55 });
      limb(g, { x: hx + f * 4 * s, y: hy - cfg.headR * s * 0.7 }, { x: hx + f * 9 * s, y: hy - hs * 0.9 }, { x: hx + f * 5 * s, y: hy - hs * 1.5 });
    }

    if (!noWeapon) {
      var tip = pt(p.tip), d = p.dir, bw = cfg.weapon.w * s, nx = -d.y, ny = d.x;
      g.fillStyle(cfg.weapon.color, alpha);
      g.fillTriangle(hnF.x + nx * bw, hnF.y + ny * bw, hnF.x - nx * bw, hnF.y - ny * bw, tip.x, tip.y);
    }
  }


  // ---- secondary motion: cloth that trails behind the body --------------------------------------------------
  // One system for scarves, ribbons, hair tufts, coat tails and capes. A `trail` is a short chain whose points chase the
  // anchor with a delay that grows toward the tip, so it streams behind a run, swings on a turn and settles when still.
  //   cfg.trails = [{ at, dx, dy, n, seg, w, color, edge, k, kd, back, fall, wave, wf, fork, front }]
  //     at     'neck' | 'head' | 'sh' | 'hip' | 'hand'   which joint it grows from      dx,dy  offset in rig px (dx flips with facing)
  //     n, seg number of points and their spacing (rig px)   w  width at the root   color / edge  fill and a lighter outline
  //     k, kd  how quickly points follow, and how much lazier each further point is     back, fall  resting direction (fractions of seg)
  //     wave, wf  idle flutter amplitude and speed        fork  swallow-tail on the tip      front  draw over the body instead of behind it
  // State lives on cfg._cl, so every fighter (one rig config each) owns its own cloth. TG.Rig.trail() can also be called directly.
  function nowSec() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; }

  function trail(g, st, ax, ay, f, o, s, alpha) {
    var n = o.n || 5, seg = (o.seg || 9) * s, t = nowSec(), i;
    if (!st.pts || st.pts.length !== n || Math.abs(st.pts[0].x - ax) > 240 || Math.abs(st.pts[0].y - ay) > 240) {
      st.pts = []; st.t = t;
      for (i = 0; i < n; i++) st.pts.push({ x: ax - f * seg * i * 0.9, y: ay + seg * i * 0.3 });
    }
    var dt = Math.min(0.05, Math.max(0, t - st.t)); st.t = t;
    var pts = st.pts, back = o.back == null ? 0.92 : o.back, fall = o.fall == null ? 0.34 : o.fall;
    var wave = (o.wave == null ? 1.3 : o.wave) * s, wf = o.wf || 3.1, ph = o.ph || 0;
    pts[0].x = ax; pts[0].y = ay;
    for (i = 1; i < n; i++) {
      var tx = pts[i - 1].x - f * seg * back, ty = pts[i - 1].y + seg * fall + Math.sin(t * wf + i * 0.9 + ph) * wave;
      var k = 1 - Math.exp(-((o.k || 24) - i * (o.kd == null ? 3.2 : o.kd)) * dt);
      pts[i].x += (tx - pts[i].x) * k; pts[i].y += (ty - pts[i].y) * k;
      var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > seg) { pts[i].x = pts[i - 1].x + dx / d * seg; pts[i].y = pts[i - 1].y + dy / d * seg; }
    }
    var w0 = (o.w || 6) * s, col = o.color, edge = o.edge, al = (o.a == null ? 0.95 : o.a) * alpha;
    var flat = o.flat != null ? o.flat : (o.w || 6) >= 5;
    if (flat) {
      // flat cloth: a strip that twists as it flutters (its apparent width breathes), outlined in the edge colour
      var Ls = [], Rs = [];
      for (i = 0; i < n; i++) {
        var a0 = pts[Math.max(0, i - 1)], a1 = pts[Math.min(n - 1, i + 1)], tx2 = a1.x - a0.x, ty2 = a1.y - a0.y, tl = Math.sqrt(tx2 * tx2 + ty2 * ty2) || 1;
        var nx = -ty2 / tl, ny = tx2 / tl;
        var hw = w0 * (1 - i / (n - 1) * 0.72) * (0.55 + 0.45 * Math.abs(Math.cos(t * (o.tw || 1.7) + i * 0.8 + ph))) / 2;
        Ls.push({ x: pts[i].x + nx * hw, y: pts[i].y + ny * hw, e: { x: pts[i].x + nx * (hw + 1.5 * s), y: pts[i].y + ny * (hw + 1.5 * s) } });
        Rs.push({ x: pts[i].x - nx * hw, y: pts[i].y - ny * hw, e: { x: pts[i].x - nx * (hw + 1.5 * s), y: pts[i].y - ny * (hw + 1.5 * s) } });
      }
      for (var ps = edge != null ? 0 : 1; ps < 2; ps++) {
        g.fillStyle(ps === 0 ? edge : col, al);
        for (i = 1; i < n; i++) {
          var l0 = ps === 0 ? Ls[i - 1].e : Ls[i - 1], l1 = ps === 0 ? Ls[i].e : Ls[i], r0 = ps === 0 ? Rs[i - 1].e : Rs[i - 1], r1 = ps === 0 ? Rs[i].e : Rs[i];
          g.fillTriangle(l0.x, l0.y, r0.x, r0.y, l1.x, l1.y);
          g.fillTriangle(r0.x, r0.y, r1.x, r1.y, l1.x, l1.y);
        }
      }
    } else {
      for (var pass = edge != null ? 0 : 1; pass < 2; pass++) {
        for (i = n - 1; i >= 1; i--) {
          var w = w0 * (1 - (i - 1) / n * 0.7) + (pass === 0 ? 1.8 * s : 0);
          var c = pass === 0 ? edge : col;
          g.lineStyle(w, c, al);
          g.beginPath(); g.moveTo(pts[i - 1].x, pts[i - 1].y); g.lineTo(pts[i].x, pts[i].y); g.strokePath();
          g.fillStyle(c, al); g.fillCircle(pts[i].x, pts[i].y, w / 2);
        }
      }
    }
    if (o.fork) {                                                              // swallow-tail: a small notch cut into the tip
      var e = pts[n - 1], q = pts[n - 2], ang = Math.atan2(e.y - q.y, e.x - q.x), L = w0 * 0.7;
      g.fillStyle(col, al);
      g.fillTriangle(e.x + Math.cos(ang) * L * 0.1, e.y + Math.sin(ang) * L * 0.1,
                     e.x + Math.cos(ang + 0.8) * L, e.y + Math.sin(ang + 0.8) * L,
                     e.x + Math.cos(ang - 0.8) * L, e.y + Math.sin(ang - 0.8) * L);
    }
    if (!flat) { g.fillStyle(col, al); g.fillCircle(ax, ay, w0 * 0.55); }
  }

  function trails(g, p, cfg, x, y, f, alpha, front) {
    var list = cfg.trails || (cfg.scarf ? [Object.assign({ at: 'neck', dx: -2, dy: 2 }, cfg.scarf)] : null), s = cfg.scale, i;
    if (!list) return;
    var cl = cfg._cl || (cfg._cl = []);
    for (i = 0; i < list.length; i++) {
      var o = list[i];
      if (!!o.front !== !!front) continue;
      var base = o.at === 'head' ? p.head : o.at === 'sh' ? p.sh : o.at === 'hip' ? p.P : o.at === 'hand' ? p.hnB : p.neck;
      trail(g, cl[i] || (cl[i] = {}), x + base.x + f * (o.dx || 0) * s, y + base.y + (o.dy || 0) * s, f, o, s, alpha);
    }
  }

  // ---- ember cracks (the cursed ring's price) ------------------------------------------------
  function burn(g, p, cfg, x, y, alpha) {
    var s = cfg.scale, t = nowSec(), a = (0.55 + 0.3 * Math.sin(t * 5.3) + 0.1 * Math.sin(t * 13)) * alpha, i;
    var A = { x: p.P.x + x, y: p.P.y + y }, B = { x: p.neck.x + x, y: p.neck.y + y };
    g.lineStyle(1.7 * s, 0xff7a2a, a);
    g.beginPath(); g.moveTo(A.x, A.y);
    for (i = 1; i <= 4; i++) {
      var u = i / 4, j = (i % 2 ? 1 : -1) * 2.6 * s;
      g.lineTo(A.x + (B.x - A.x) * u + j, A.y + (B.y - A.y) * u);
    }
    g.strokePath();
    var E = { x: p.elF.x + x, y: p.elF.y + y }, H = { x: p.hnF.x + x, y: p.hnF.y + y };
    g.beginPath(); g.moveTo(E.x, E.y);
    g.lineTo((E.x + H.x) / 2 + 2 * s, (E.y + H.y) / 2 - 1.5 * s); g.lineTo(H.x, H.y);
    g.strokePath();
    g.fillStyle(0xffb347, a * 0.9); g.fillCircle(H.x, H.y, 1.8 * s);
  }

  TG.Rig = {
    defaults: {
      scale: 1, thigh: 19, shin: 19, torso: 30, upper: 16, fore: 16, headR: 9.5, limb: 6.5, torsoW: 10,
      body: 0x07070d, rim: 0x9fb4d8, rimA: 0.5, rimW: 4, eye: 0xffffff,
      weapon: { len: 46, w: 3.2, color: 0xdfe6f2 }
    },

    kin: kin,
    trail: trail,

    // Reusable looks. Each returns a fresh trails array.
    presets: {
      // the hero: a warm scarf (the one colour on him), two hair tufts and short coat tails that all lag behind a run
      hero: function (scarf, edge) {
        return [
          { at: 'hip', dx: -3, dy: 4, n: 4, seg: 9, w: 9, color: 0x0b0b16, edge: edge, k: 20, kd: 3, back: 0.7, fall: 0.5, wave: 1.6, ph: 1.0 },
          { at: 'neck', dx: -2, dy: 2, n: 6, seg: 9, w: 10, color: scarf, k: 24, kd: 3.4, wave: 1.6, fork: true },
          { at: 'head', dx: -4, dy: -6, n: 3, seg: 6, w: 4.2, color: 0x07070d, edge: edge, k: 30, kd: 5, back: 0.8, fall: 0.15, wave: 0.8, wf: 4.2 },
          { at: 'head', dx: 0, dy: -8, n: 3, seg: 5, w: 3.6, color: 0x07070d, edge: edge, k: 28, kd: 5, back: 0.55, fall: -0.2, wave: 0.8, wf: 3.6, ph: 2 }
        ];
      },
      // a short cloak: two broad panels from the shoulders
      cape: function (color, edge) {
        return [
          { at: 'sh', dx: -2, dy: 2, n: 5, seg: 12, w: 20, color: color, edge: edge, k: 17, kd: 2.4, back: 0.95, fall: 0.5, wave: 2.2 },
          { at: 'sh', dx: -4, dy: 6, n: 4, seg: 11, w: 16, color: color, edge: edge, k: 15, kd: 2.4, back: 0.85, fall: 0.62, wave: 2.6, ph: 1.4 }
        ];
      }
    },

    // Draw a figure. `ghost` mode draws a flat single-colour silhouette (for afterimages).
    // Optional cfg fields (all off by default):
    //   trails: [...]           cloth that lags behind the body: scarf, ribbons, hair, coat tails, cape (see trail() above)
    //   faceless: true          a soft white glow instead of an eye (the face is withheld)
    //   burn: true              glowing ember cracks across torso and front arm
    draw: function (g, x, y, f, pose, cfg, alpha, tint, ghost) {
      var p = kin(pose, cfg, f);
      p.f = f;
      alpha = alpha == null ? 1 : alpha;
      var body = tint != null ? tint : cfg.body;
      if (!ghost && cfg.rim != null) pass(g, p, cfg, cfg.rim, cfg.rimW * cfg.scale, cfg.rimA * alpha, x, y, true);
      if (!ghost) trails(g, p, cfg, x, y, f, alpha, false);
      pass(g, p, cfg, body, 0, alpha, x, y, !!ghost);
      if (!ghost) trails(g, p, cfg, x, y, f, alpha, true);
      if (!ghost) {
        var hx = p.head.x + x, hy = p.head.y + y, s = cfg.scale;
        if (cfg.burn) burn(g, p, cfg, x, y, alpha);
        if (cfg.faceless) {
          g.fillStyle(0xffffff, 0.16 * alpha); g.fillCircle(hx + f * 5 * s, hy + 1 * s, 9.5 * s);
          g.fillStyle(0xffffff, 0.34 * alpha); g.fillCircle(hx + f * 5 * s, hy + 1 * s, 6.2 * s);
          g.fillStyle(0xffffff, 0.95 * alpha); g.fillCircle(hx + f * 5.4 * s, hy + 0.6 * s, 3.8 * s);
        } else {
          g.fillStyle(cfg.eye, 0.25 * alpha);
          g.fillCircle(hx + f * 3.8 * s, hy - 0.6 * s, 4.6 * s);
          g.fillStyle(cfg.eye, alpha);
          g.fillCircle(hx + f * 3.8 * s, hy - 0.6 * s, 2.1 * s);
        }
      }
      return p;
    }
  };
})();
