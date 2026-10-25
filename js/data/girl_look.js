// The guide girl's look (Agent B). Pink rim light, long flowing hair, a bow with two long ribbons, a sash, a small skirt,
// and a faint pink core at her chest that beats slowly (it is the bomb she carries; nobody knows yet).
// Identity rule: she is the only character with ribbons. Read her silhouette first, her colour second.
// The engine rig has no hair, so it is drawn behind the figure from the rig's joint positions.
// Reuse this in any scene: TG.GirlLook.draw(graphics, x, y, facing, pose, timeSeconds)
TG.GirlLook = {
  cfg: Object.assign({}, TG.Rig.defaults, {
    scale: 1.5, limb: 4.8, torsoW: 7, headR: 9, rim: 0xff9ec4, rimA: 0.65, rimW: 3.5, eye: 0xffe3f0,
    weapon: { len: 16, w: 2, color: 0xffd0e4 }
  }),

  draw: function (g, x, y, f, pose, t, alpha) {
    var C = this.cfg, s = C.scale, a = alpha == null ? 1 : alpha;
    var p = TG.Rig.kin(pose, C, f);
    var hx = x + p.head.x, hy = y + p.head.y, r = C.headR * s, i;
    // secondary motion: hair streams behind her while she moves and settles when she stops
    var dx = this._px == null ? 0 : x - this._px; this._px = x;
    this._v = (this._v || 0) + (dx - (this._v || 0)) * 0.1;
    var drag = TG.U.clamp(this._v * f, -3, 6) * 3.2 * s;

    // skirt (drawn first, so the legs sit in front of it)
    var wy = y + p.P.y - 4 * s, hem = y + (p.knF.y + p.knB.y) / 2 + 4 * s, sway = Math.sin(t * 3) * 2 * s;
    g.fillStyle(0x2a1020, a);
    g.fillTriangle(x + p.P.x - 6 * s, wy, x + p.P.x + 6 * s, wy, x + p.P.x - 19 * s + sway, hem);
    g.fillTriangle(x + p.P.x + 6 * s, wy, x + p.P.x + 19 * s + sway, hem, x + p.P.x - 19 * s + sway, hem);
    g.lineStyle(2, 0xff9ec4, 0.6 * a);
    g.lineBetween(x + p.P.x - 19 * s + sway, hem, x + p.P.x + 19 * s + sway, hem);

    // hair: a cap behind the head and three long strands that sway
    g.fillStyle(0xff8fba, a);
    g.fillCircle(hx - f * r * 0.3, hy - r * 0.1, r * 1.12);
    for (i = 0; i < 3; i++) {
      var sw = Math.sin(t * 3 + i * 1.2) * 5 * s;
      g.lineStyle((7 - i * 1.6) * s * 0.8, 0xff8fba, 0.95 * a);
      g.beginPath();
      g.moveTo(hx - f * r * 0.6, hy - r * 0.3 + i * 4 * s);
      g.lineTo(hx - f * (r * 1.7 + i * 6 * s + drag * 0.5) - sw * 0.4, hy + r * (1.1 + i * 0.5) - Math.abs(drag) * 0.12);
      g.lineTo(hx - f * (r * 2.0 + i * 8 * s + drag) - sw, hy + r * (3.0 + i * 0.9) - Math.abs(drag) * 0.35);
      g.strokePath();
    }

    // ribbons trailing from the bow (they lag behind her like the hair does) and the sash at her waist
    var rb = this._rb || (this._rb = [{}, {}, {}, {}]), bx = hx - f * r * 0.2, by = hy - r * 1.05;
    TG.Rig.trail(g, rb[0], bx, by, f, { n: 6, seg: 9, w: 6.5, color: 0xff6fa6, edge: 0xffd0e4, k: 17, kd: 2.2, back: 0.95, fall: 0.5, wave: 2.4, fork: true }, s, a);
    TG.Rig.trail(g, rb[1], bx - f * 2 * s, by + 2 * s, f, { n: 5, seg: 8, w: 5, color: 0xffe3f0, edge: 0xff9ec4, k: 19, kd: 2.4, back: 0.8, fall: 0.7, wave: 2.8, ph: 1.7, fork: true }, s, a);
    var wx = x + p.P.x - f * 3 * s, wy = y + p.P.y - 5 * s;
    TG.Rig.trail(g, rb[2], wx, wy, f, { n: 4, seg: 8, w: 5.5, color: 0xff6fa6, edge: 0xffd0e4, k: 20, kd: 3, back: 0.7, fall: 0.8, wave: 2, ph: 0.6, fork: true }, s, a);
    TG.Rig.trail(g, rb[3], wx, wy, f, { n: 4, seg: 7, w: 4.5, color: 0xffd0e4, edge: 0xff6fa6, k: 22, kd: 3, back: 0.5, fall: 0.9, wave: 2.4, ph: 2.2, fork: true }, s, a);

    TG.Rig.draw(g, x, y, f, pose, C, a);

    // the core: a small pink light on her chest, beating slowly
    var cx = x + p.sh.x + f * 3 * s, cy = y + p.sh.y + 9 * s, beat = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 2.0)), 5);
    TG.Art.glow(g, cx, cy, 11 * s, 0xff6fa6, 0.25 + 0.3 * beat);
    g.fillStyle(0xffe3f0, 0.9 * a); g.fillCircle(cx, cy, 2.1 * s);

    // bow on top of the head
    g.fillStyle(0xffd0e4, a);
    g.fillTriangle(hx - f * r * 0.2, hy - r * 1.05, hx - f * r * 1.3, hy - r * 1.7, hx - f * r * 1.3, hy - r * 0.5);
    g.fillTriangle(hx - f * r * 0.2, hy - r * 1.05, hx + f * r * 0.8, hy - r * 1.7, hx + f * r * 0.8, hy - r * 0.5);
    g.fillStyle(0xff6fa6, a);
    g.fillCircle(hx - f * r * 0.2, hy - r * 1.05, r * 0.3);
    return p;
  }
};
