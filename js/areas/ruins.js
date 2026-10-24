// The ruined palace. Cold blues, broken towers, silhouettes (Agent B).
// Four scrolling layers, all baked once. Copy of the molten_mountain structure.
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
    var A = TG.Art, U = TG.U, W = TG.W, H = TG.H;
    scene.cameras.main.setBackgroundColor(0x04070e);

    A.bake(scene, 'ru_sky', W, H, function (g) {
      A.gradient(g, W, H, [[0, 0x04070e], [0.55, 0x101c30], [1, 0x35506f]]);
      A.glow(g, 900, 200, 280, 0x9fc0e8, 0.14);
      g.fillStyle(0xcfe0f4, 0.85); g.fillCircle(900, 200, 46);          // pale moon
      g.fillStyle(0x101c30, 0.3); g.fillCircle(884, 190, 36);
    });

    A.bake(scene, 'ru_far', W, H, function (g) {                        // distant broken palace
      var rnd = U.rng(4), i, x;
      A.ridge(g, W, 540, [[2, 30, 0.4], [5, 12, 1.9]], 0x0a1220, 1, H);
      g.fillStyle(0x0a1220, 1);
      for (i = 0; i < 6; i++) {
        x = 90 + i * 200 + rnd() * 40;
        var th = 180 + rnd() * 200;
        g.fillRect(x, 540 - th, 46, th);                                // tower
        g.fillTriangle(x - 4, 540 - th, x + 50, 540 - th, x + 30, 540 - th - 36 - rnd() * 40);
        g.fillStyle(0x0a1220, 1);
        g.fillRect(x + 46, 540 - th * 0.55, 70, 14);                    // bridge
      }
      g.fillStyle(0x4f7ab0, 0.4);
      for (i = 0; i < 9; i++) g.fillRect(100 + i * 130 + rnd() * 30, 380 + rnd() * 120, 3, 5);   // a few lit windows
    });

    A.bake(scene, 'ru_mid', W, H, function (g) {                        // arches and columns
      var rnd = U.rng(9), i, x;
      for (i = 0; i < 5; i++) {
        x = 60 + i * 250 + rnd() * 40;
        g.fillStyle(0x0c1626, 0.95);
        g.fillRect(x, 150 + rnd() * 80, 38, 520);                       // column
        g.fillRect(x - 8, 142 + rnd() * 20, 54, 14);
        g.fillRect(x + 130, 190 + rnd() * 60, 38, 480);                 // second column
        g.fillStyle(0x0c1626, 0.95);                                    // arch
        g.beginPath(); g.arc(x + 93, 230, 74, Math.PI, 2 * Math.PI, false); g.lineTo(x + 130, 230); g.lineTo(x + 38, 230); g.closePath(); g.fillPath();
      }
      g.lineStyle(2, 0x6f9bd0, 0.18);
      for (i = 0; i < 8; i++) g.lineBetween(40 + i * 150, 60, 40 + i * 150 + 60, 600);   // pale light shafts
    });

    A.bake(scene, 'ru_near', W, H, function (g) {                       // broken foreground pillars
      var rnd = U.rng(31), i;
      A.ridge(g, W, 708, [[4, 12, 0.3], [10, 6, 1.1]], 0x03050a, 1, H);
      for (i = 0; i < 4; i++) {
        var x = 120 + i * 300 + rnd() * 80, top = 80 + rnd() * 160;
        g.fillStyle(0x03050a, 0.94);
        g.fillRect(x, top, 30, 700 - top);
        g.fillTriangle(x - 4, top, x + 34, top, x + 14, top - 30);
      }
    });

    var update = A.layers(scene, [
      { key: 'ru_sky', factor: 0.02, depth: -50 },
      { key: 'ru_far', factor: 0.12, depth: -40 },
      { key: 'ru_mid', factor: 0.38, depth: -30 },
      { key: 'ru_near', factor: 1.35, depth: 40 }
    ]);

    // ground and platforms (world space)
    var g = scene.add.graphics().setDepth(5), gy = this.groundY, rnd2 = U.rng(77), i;
    g.fillStyle(0x0a0f1a, 1);
    g.fillRect(0, gy, this.width, H - gy + 40);
    g.fillStyle(0x7ea6d8, 0.1);
    g.fillRect(0, gy, this.width, 8);
    g.lineStyle(3, 0x8fb4e0, 0.6);
    g.lineBetween(0, gy + 1, this.width, gy + 1);
    for (i = 0; i < 30; i++) {                                          // cracked tiles
      var cx = rnd2() * this.width;
      g.lineStyle(2, 0x3c5a80, 0.5);
      g.beginPath(); g.moveTo(cx, gy + 10);
      g.lineTo(cx + rnd2() * 20 - 10, gy + 30); g.lineTo(cx + rnd2() * 26 - 13, gy + 60);
      g.strokePath();
    }
    this.platforms.forEach(function (p) {                               // fallen stone blocks
      g.fillStyle(0x0d1420, 1);
      g.fillRect(p.x, p.y, p.w, 22);
      g.fillTriangle(p.x + 10, p.y + 22, p.x + p.w - 10, p.y + 22, p.x + p.w / 2, p.y + 50);
      g.lineStyle(3, 0x8fb4e0, 0.55);
      g.lineBetween(p.x, p.y + 1, p.x + p.w, p.y + 1);
    });

    return function (dt) {
      update(scene.cameras.main);
      if (Math.random() < dt * 4) {                                     // slow cold motes
        var cam = scene.cameras.main;
        scene.fx.ember(cam.scrollX + Math.random() * W, cam.scrollY + H - 60 - Math.random() * 300, 0x9fc0e8);
      }
    };
  }
});
