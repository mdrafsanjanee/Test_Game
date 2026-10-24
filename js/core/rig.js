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

  TG.Rig = {
    defaults: {
      scale: 1, thigh: 19, shin: 19, torso: 30, upper: 16, fore: 16, headR: 9.5, limb: 6.5, torsoW: 10,
      body: 0x07070d, rim: 0x9fb4d8, rimA: 0.5, rimW: 4, eye: 0xffffff,
      weapon: { len: 46, w: 3.2, color: 0xdfe6f2 }
    },

    kin: kin,

    // Draw a figure. `ghost` mode draws a flat single-colour silhouette (for afterimages).
    draw: function (g, x, y, f, pose, cfg, alpha, tint, ghost) {
      var p = kin(pose, cfg, f);
      p.f = f;
      alpha = alpha == null ? 1 : alpha;
      var body = tint != null ? tint : cfg.body;
      if (!ghost && cfg.rim != null) pass(g, p, cfg, cfg.rim, cfg.rimW * cfg.scale, cfg.rimA * alpha, x, y, true);
      pass(g, p, cfg, body, 0, alpha, x, y, !!ghost);
      if (!ghost) {
        var hx = p.head.x + x, hy = p.head.y + y, s = cfg.scale;
        g.fillStyle(cfg.eye, 0.25 * alpha);
        g.fillCircle(hx + f * 3.8 * s, hy - 0.6 * s, 4.6 * s);
        g.fillStyle(cfg.eye, alpha);
        g.fillCircle(hx + f * 3.8 * s, hy - 0.6 * s, 2.1 * s);
      }
      return p;
    }
  };
})();
