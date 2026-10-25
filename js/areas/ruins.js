// The ruined palace (Agent B). Cold night blues, with the colour of the glowing crystal forest breaking through.
// Four parallax layers plus two baked world images (props and additive glow), all made once at load.
//
// Art direction: the place is empty but not dead. Every prop says someone lived here and is still waiting:
//   a banquet table set for guests who never came, a broom leaning where the Attendant stopped sweeping, a fountain that
//   still glows, a child's shoes and a toy horse by the stairs, a helmet and a banner where the last fight ended.
TG.registerArea('ruins', {
  name: 'The Ruined Palace',
  width: 2200,
  height: 720,
  groundY: 620,
  bounds: { left: 70, right: 2130 },
  spawn: { player: 560, boss: 1500 },
  platforms: [
    { x: 380, y: 480, w: 240 },
    { x: 1560, y: 480, w: 240 },
    { x: 970, y: 360, w: 260 }
  ],
  pits: [],

  build: function (scene) {
    var A = TG.Art, U = TG.U, W = TG.W, H = TG.H, self = this, gy = this.groundY, WW = this.width;
    scene.cameras.main.setBackgroundColor(0x04070e);
    var TEAL = 0x5ee0d0, MAG = 0xd878e8, GOLD = 0xffc27a;

    A.bake(scene, 'ru_sky', W, H, function (g) {
      var rnd = U.rng(3), i;
      A.gradient(g, W, H, [[0, 0x04061a], [0.5, 0x121f3a], [1, 0x35567a]]);
      for (i = 0; i < 70; i++) { g.fillStyle(0xdfeaff, 0.12 + rnd() * 0.4); g.fillRect(rnd() * W, rnd() * 330, 2, 2); }
      for (i = 0; i < 5; i++) {                                                  // a faint aurora: the crystals' light in the sky
        g.fillStyle(i % 2 ? MAG : TEAL, 0.05);
        g.fillEllipse(220 + i * 230 + rnd() * 80, 180 + rnd() * 60, 420, 40 + rnd() * 30);
      }
      A.glow(g, 900, 200, 340, 0x9fc0e8, 0.18);
      g.fillStyle(0xcfe0f4, 0.9); g.fillCircle(900, 200, 46);                  // pale moon
      g.fillStyle(0x101c30, 0.28); g.fillCircle(884, 190, 36);
    });

    A.bake(scene, 'ru_far', W, H, function (g) {                                // distant broken palace, with crystal spires
      var rnd = U.rng(4), i, x;
      A.ridge(g, W, 540, [[2, 30, 0.4], [5, 12, 1.9]], 0x0a1220, 1, H);
      g.fillStyle(0x0a1220, 1);
      for (i = 0; i < 6; i++) {
        x = 90 + i * 200 + rnd() * 40;
        var th = 180 + rnd() * 200;
        g.fillRect(x, 540 - th, 46, th);
        g.fillTriangle(x - 4, 540 - th, x + 50, 540 - th, x + 30, 540 - th - 36 - rnd() * 40);
        g.fillStyle(0x0a1220, 1);
        g.fillRect(x + 46, 540 - th * 0.55, 70, 14);
      }
      for (i = 0; i < 9; i++) {                                                  // crystals growing through the far towers
        x = 40 + i * 140 + rnd() * 60; var ch = 50 + rnd() * 90, c = i % 2 ? MAG : TEAL;
        A.glow(g, x, 540 - ch * 0.5, 54, c, 0.2);
        g.fillStyle(c, 0.55); g.fillTriangle(x - 7, 540, x + 7, 540, x, 540 - ch);
        g.fillStyle(0xffffff, 0.35); g.fillTriangle(x - 2, 540, x + 2, 540, x - 1, 540 - ch * 0.8);
      }
      g.fillStyle(0x7ab8f0, 0.5);
      for (i = 0; i < 9; i++) g.fillRect(100 + i * 130 + rnd() * 30, 380 + rnd() * 120, 3, 5);
    });

    A.bake(scene, 'ru_mid', W, H, function (g) {                                // arches, columns, torn banners, ivy
      var rnd = U.rng(9), i, x;
      for (i = 0; i < 5; i++) {
        x = 60 + i * 250 + rnd() * 40;
        var ty = 150 + rnd() * 80;
        g.fillStyle(0x0c1626, 0.95);
        g.fillRect(x, ty, 38, 520);
        g.fillRect(x - 8, 142 + rnd() * 20, 54, 14);
        g.fillRect(x + 130, 190 + rnd() * 60, 38, 480);
        g.beginPath(); g.arc(x + 93, 230, 74, Math.PI, 2 * Math.PI, false); g.lineTo(x + 130, 230); g.lineTo(x + 38, 230); g.closePath(); g.fillPath();
        g.fillStyle(0x4a1c34, 0.9);                                              // a torn banner on the column, still hanging
        g.fillTriangle(x + 6, ty + 30, x + 32, ty + 30, x + 19, ty + 30 + 120 + rnd() * 40);
        g.fillStyle(0x2a0e1e, 0.8); g.fillTriangle(x + 19, ty + 30, x + 32, ty + 30, x + 28, ty + 30 + 70);
        g.lineStyle(2, 0x1c3a30, 0.9);                                           // ivy
        for (var k = 0; k < 4; k++) {
          var ix = x + 130 + 6 + k * 8; g.beginPath(); g.moveTo(ix, 230 + 40 * k); g.lineTo(ix + rnd() * 10 - 5, 330 + rnd() * 90); g.strokePath();
        }
      }
      for (i = 0; i < 6; i++) {                                                  // small crystal clusters at the column feet
        x = 80 + i * 200 + rnd() * 80; var c = i % 2 ? TEAL : MAG;
        A.glow(g, x, 650, 56, c, 0.22);
        g.fillStyle(c, 0.7); g.fillTriangle(x - 8, 690, x + 4, 690, x - 3, 640 - rnd() * 30);
        g.fillTriangle(x + 2, 690, x + 14, 690, x + 9, 652 - rnd() * 24);
      }
    });

    A.bake(scene, 'ru_near', W, H, function (g) {                               // foreground pillars, dark and close
      var rnd = U.rng(31), i;
      A.ridge(g, W, 708, [[4, 12, 0.3], [10, 6, 1.1]], 0x03050a, 1, H);
      for (i = 0; i < 4; i++) {
        var x = 120 + i * 300 + rnd() * 80, top = 80 + rnd() * 160;
        g.fillStyle(0x03050a, 0.94);
        g.fillRect(x, top, 30, 700 - top);
        g.fillTriangle(x - 4, top, x + 34, top, x + 14, top - 30);
      }
    });

    // ---- world-space props: baked once, 2200 wide, sits behind the fighters -----------------------------------------
    A.bake(scene, 'ru_props', WW, H, function (g) {
      var rnd = U.rng(77), i, x;
      g.fillStyle(0x0a0f1a, 1); g.fillRect(0, gy, WW, H - gy + 40);             // floor
      g.fillStyle(0x7ea6d8, 0.1); g.fillRect(0, gy, WW, 8);
      g.lineStyle(3, 0x8fb4e0, 0.6); g.lineBetween(0, gy + 1, WW, gy + 1);
      for (i = 0; i < 34; i++) {                                                 // cracked tiles
        var cx = rnd() * WW; g.lineStyle(2, 0x3c5a80, 0.5);
        g.beginPath(); g.moveTo(cx, gy + 10); g.lineTo(cx + rnd() * 20 - 10, gy + 30); g.lineTo(cx + rnd() * 26 - 13, gy + 60); g.strokePath();
      }
      for (i = 0; i < 40; i++) {                                                 // a fine sweep of dust on the floor (the Attendant's work)
        g.lineStyle(1.5, 0x5a7aa0, 0.14); var sx = 300 + rnd() * 1500;
        g.beginPath(); g.moveTo(sx, gy + 6 + rnd() * 30); g.lineTo(sx + 40 + rnd() * 60, gy + 6 + rnd() * 30); g.strokePath();
      }

      // the banquet table: set for the court, never cleared
      var tx = 660, tw = 230, ty = gy - 44;
      g.fillStyle(0x060a14, 1);
      g.fillRect(tx, ty, tw, 8); g.fillRect(tx + 10, ty + 8, 8, 36); g.fillRect(tx + tw - 18, ty + 8, 8, 36);
      g.fillStyle(0x16243c, 1); g.fillRect(tx - 6, ty - 3, tw + 12, 5);          // a cloth, long since grey
      g.fillTriangle(tx + 40, ty + 2, tx + 90, ty + 2, tx + 62, ty + 34);
      for (i = 0; i < 4; i++) {                                                  // plates and cups
        g.fillStyle(0xaec4e0, 0.75); g.fillEllipse(tx + 24 + i * 52, ty - 5, 24, 5);
        g.fillStyle(0x7a96b8, 0.8); g.fillRect(tx + 38 + i * 52, ty - 14, 5, 10);
      }
      g.fillStyle(0x060a14, 1);                                                  // chairs: two upright, one overturned, one pulled out
      g.fillRect(tx - 32, gy - 40, 6, 40); g.fillRect(tx - 32, gy - 22, 26, 5); g.fillRect(tx - 32, gy - 40, 16, 4);
      g.fillRect(tx + tw + 14, gy - 40, 6, 40); g.fillRect(tx + tw + 14, gy - 22, 26, 5); g.fillRect(tx + tw + 30, gy - 40, 16, 4);
      g.fillRect(tx + 80, gy - 8, 40, 5); g.fillRect(tx + 80, gy - 22, 5, 17);   // the overturned one
      g.fillStyle(0x0c1626, 1); g.fillRect(tx + 100, gy - 38, 3, 38);            // candlestick
      g.fillRect(tx + 94, gy - 40, 15, 3);

      // the Attendant's broom, leaning on a stump, with the little pile she swept
      var bx = 360;
      g.fillStyle(0x0a1020, 1); g.fillRect(bx - 12, gy - 54, 24, 54);
      g.lineStyle(4, 0x3a2a24, 1); g.beginPath(); g.moveTo(bx + 12, gy - 10); g.lineTo(bx + 26, gy - 92); g.strokePath();
      g.fillStyle(0x4a3a2a, 1); g.fillTriangle(bx + 4, gy, bx + 26, gy, bx + 14, gy - 22);
      g.fillStyle(0x6a7a96, 0.45); g.fillEllipse(bx + 70, gy + 2, 50, 9); g.fillEllipse(bx + 66, gy - 3, 26, 8);

      // the fountain, dry stone with a glowing pool
      var fx = 1300;
      g.fillStyle(0x0b1322, 1); g.fillRect(fx - 80, gy - 30, 160, 30);
      g.fillRect(fx - 12, gy - 78, 24, 50);
      g.fillEllipse(fx, gy - 80, 70, 14);
      g.fillStyle(0x16243c, 1); g.fillRect(fx - 90, gy - 34, 180, 6);
      g.fillStyle(0x0f2a30, 1); g.fillRect(fx - 70, gy - 28, 140, 12);           // the pool (lit on top by the glow layer)

      // a child's shoes and a toy horse by the old stairs
      x = 1900;
      g.fillStyle(0x0a1020, 1);
      for (i = 0; i < 4; i++) g.fillRect(x + i * 36, gy - 12 + (i % 2) * 5, 36, 12);  // three low steps
      g.fillStyle(0x4a1c34, 1); g.fillEllipse(x + 6, gy - 5, 14, 7); g.fillEllipse(x + 24, gy - 5, 14, 7);   // small red shoes, side by side
      g.fillStyle(0x3a2e28, 1); g.fillRect(x + 80, gy - 20, 22, 12); g.fillRect(x + 98, gy - 30, 8, 14);      // a wooden horse on its side
      g.fillRect(x + 82, gy - 8, 3, 8); g.fillRect(x + 96, gy - 8, 3, 8);
      g.fillStyle(0xc8b08a, 0.8); g.fillCircle(x + 104, gy - 28, 2);

      // the last stand: a helmet, a split shield, a sword in the floor, a banner on a broken pole
      x = 2020;
      g.fillStyle(0x16243c, 1); g.fillEllipse(x, gy - 8, 26, 18); g.fillRect(x - 13, gy - 8, 26, 8);
      g.fillStyle(0x0a1020, 1); g.fillRect(x - 4, gy - 4, 8, 6);
      g.fillStyle(0x24385a, 1); g.fillTriangle(x + 30, gy, x + 70, gy, x + 50, gy - 34);
      g.lineStyle(2, 0x0a1020, 1); g.lineBetween(x + 50, gy - 34, x + 48, gy);
      g.lineStyle(4, 0xaec4e0, 0.9); g.lineBetween(x + 100, gy - 56, x + 100, gy); // sword
      g.lineStyle(6, 0xaec4e0, 0.9); g.lineBetween(x + 90, gy - 46, x + 110, gy - 46);
      g.lineStyle(4, 0x3a2e28, 1); g.lineBetween(x - 70, gy - 70, x - 40, gy);   // pole
      g.fillStyle(0x4a1c34, 0.95); g.fillTriangle(x - 70, gy - 70, x - 70 + 40, gy - 60, x - 62, gy - 34);

      // crystals pushing up through the floor (their light is in the glow layer)
      var cl = [[170, TEAL], [560, MAG], [1120, TEAL], [1700, MAG], [2120, TEAL], [1450, MAG]];
      for (i = 0; i < cl.length; i++) {
        x = cl[i][0]; var c = cl[i][1];
        g.fillStyle(c, 0.82); g.fillTriangle(x - 12, gy + 2, x + 6, gy + 2, x - 5, gy - 54 - (i % 3) * 14);
        g.fillTriangle(x - 2, gy + 2, x + 16, gy + 2, x + 9, gy - 40 - (i % 2) * 18);
        g.fillTriangle(x - 20, gy + 2, x - 8, gy + 2, x - 16, gy - 26);
        g.fillStyle(0xffffff, 0.4); g.fillTriangle(x - 8, gy + 2, x - 4, gy + 2, x - 6, gy - 40);
      }
      self.platforms.forEach(function (p) {                                      // fallen stone blocks, with a crystal fringe underneath
        g.fillStyle(0x0d1420, 1);
        g.fillRect(p.x, p.y, p.w, 22);
        g.fillTriangle(p.x + 10, p.y + 22, p.x + p.w - 10, p.y + 22, p.x + p.w / 2, p.y + 50);
        g.lineStyle(3, 0x8fb4e0, 0.55); g.lineBetween(p.x, p.y + 1, p.x + p.w, p.y + 1);
        for (var q = 0; q < 3; q++) { g.fillStyle(q % 2 ? MAG : TEAL, 0.6); g.fillTriangle(p.x + 30 + q * 70, p.y + 22, p.x + 42 + q * 70, p.y + 22, p.x + 36 + q * 70, p.y + 40 + q * 4); }
      });
    });

    A.bake(scene, 'ru_glow', WW, H, function (g) {                              // additive light: crystals, candles, the fountain
      var cl = [[170, TEAL], [560, MAG], [1120, TEAL], [1700, MAG], [2120, TEAL], [1450, MAG]], i;
      for (i = 0; i < cl.length; i++) A.glow(g, cl[i][0], gy - 28, 130, cl[i][1], 0.30);
      A.glow(g, 1300, gy - 26, 190, TEAL, 0.34);                                  // the pool
      g.fillStyle(TEAL, 0.5); g.fillEllipse(1300, gy - 24, 120, 8);
      g.fillStyle(MAG, 0.25); g.fillEllipse(1290, gy - 22, 60, 5);
      A.glow(g, 762, gy - 56, 120, GOLD, 0.22);                                   // candle-glow on the table
      // a second layer of floor reflection under the crystals
      for (i = 0; i < cl.length; i++) { g.fillStyle(cl[i][1], 0.1); g.fillEllipse(cl[i][0], gy + 6, 160, 12); }
    });

    var update = A.layers(scene, [
      { key: 'ru_sky', factor: 0.02, depth: -50 },
      { key: 'ru_far', factor: 0.12, depth: -40 },
      { key: 'ru_mid', factor: 0.38, depth: -30 },
      { key: 'ru_near', factor: 1.35, depth: 40 }
    ]);

    scene.add.image(0, 0, 'ru_props').setOrigin(0, 0).setDepth(5);
    var glowImg = scene.add.image(0, 0, 'ru_glow').setOrigin(0, 0).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    var flame = scene.add.graphics().setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
    var flameT = 0;

    if (scene.cine) {                                                            // mood for fights here: cold light shafts, a few glowing moths
      scene.cine.shafts(0x9fd0ff, 0.16);
      scene.cine.motes('butterfly', 5);
      scene.cine.motes('dust', 14);
    }

    return function (dt) {
      update(scene.cameras.main);
      flameT += dt;
      glowImg.setAlpha(0.82 + 0.18 * Math.sin(flameT * 1.7));                    // the crystals slowly breathe
      flame.clear();                                                             // three candle flames, each flickering on its own
      for (var i = 0; i < 3; i++) {
        var fl = 0.7 + 0.3 * Math.sin(flameT * (9 + i * 2.3) + i * 1.7) + 0.1 * Math.sin(flameT * 23 + i);
        flame.fillStyle(0xffc27a, 0.9 * fl); flame.fillEllipse(756 + i * 6 - 6, gy - 43 - i * 2, 4, 9 * fl);
        flame.fillStyle(0xffffff, 0.8 * fl); flame.fillEllipse(756 + i * 6 - 6, gy - 41 - i * 2, 2, 4 * fl);
      }
      if (Math.random() < dt * 4) {                                              // slow cold motes
        var cam = scene.cameras.main;
        scene.fx.ember(cam.scrollX + Math.random() * W, cam.scrollY + H - 60 - Math.random() * 300, Math.random() < 0.4 ? 0x5ee0d0 : 0x9fc0e8);
      }
    };
  }
});
