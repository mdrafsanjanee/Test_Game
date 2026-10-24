// The guide girl's look (Agent B). Pink rim light, long flowing hair, a bow, a small skirt.
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
      g.lineTo(hx - f * (r * 1.7 + i * 6 * s) - sw * 0.4, hy + r * (1.1 + i * 0.5));
      g.lineTo(hx - f * (r * 2.0 + i * 8 * s) - sw, hy + r * (3.0 + i * 0.9));
      g.strokePath();
    }

    TG.Rig.draw(g, x, y, f, pose, C, a);

    // bow on top of the head
    g.fillStyle(0xffd0e4, a);
    g.fillTriangle(hx - f * r * 0.2, hy - r * 1.05, hx - f * r * 1.3, hy - r * 1.7, hx - f * r * 1.3, hy - r * 0.5);
    g.fillTriangle(hx - f * r * 0.2, hy - r * 1.05, hx + f * r * 0.8, hy - r * 1.7, hx + f * r * 0.8, hy - r * 0.5);
    g.fillStyle(0xff6fa6, a);
    g.fillCircle(hx - f * r * 0.2, hy - r * 1.05, r * 0.3);
    return p;
  }
};
