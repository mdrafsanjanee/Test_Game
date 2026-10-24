// REFERENCE AREA. Agent B: copy this file's structure for new areas.
// Everything is baked from a few Graphics calls into 1280x720 tiling textures,
// so an area costs 3-4 scrolling tile sprites + one static ground Graphics.
TG.registerArea('molten_mountain', {
  name: 'The Molten Gate',
  width: 2000,
  height: 720,
  groundY: 620,
  bounds: { left: 70, right: 1930 },
  spawn: { player: 620, boss: 1380 },
  platforms: [
    { x: 330, y: 470, w: 250 },
    { x: 1420, y: 470, w: 250 },
    { x: 875, y: 350, w: 250 }
  ],
  pits: [],

  build: function (scene) {
    var A = TG.Art, U = TG.U, W = TG.W, H = TG.H, self = this;
    scene.cameras.main.setBackgroundColor(0x07020a);

    A.bake(scene, 'mm_sky', W, H, function (g) {
      A.gradient(g, W, H, [[0, 0x07020a], [0.45, 0x2a0a0d], [0.78, 0x7a1d0c], [1, 0xd9531a]]);
      A.glow(g, 640, 560, 520, 0xff6a1a, 0.10);
    });

    A.bake(scene, 'mm_far', W, H, function (g) {
      A.ridge(g, W, 470, [[2, 62, 0.5], [5, 28, 1.2], [9, 12, 2.0]], 0x240809, 1, H);
      var rnd = U.rng(11);
      for (var i = 0; i < 7; i++) {          // glowing lava seams down the far slopes
        var x = 80 + rnd() * (W - 160), y = 430 + rnd() * 70;
        g.lineStyle(2, 0xff5a1a, 0.55);
        g.beginPath(); g.moveTo(x, y);
        g.lineTo(x + rnd() * 30 - 15, y + 40); g.lineTo(x + rnd() * 40 - 20, y + 90);
        g.strokePath();
        A.glow(g, x, y + 50, 38, 0xff5a1a, 0.12);
      }
      A.ridge(g, W, 540, [[3, 40, 2.4], [7, 18, 0.3]], 0x16060a, 1, H);
    });

    A.bake(scene, 'mm_mid', W, H, function (g) {
      var rnd = U.rng(5), i;
      g.fillStyle(0x0b0406, 1);
      g.fillRect(0, 0, W, 70);                // cavern ceiling
      for (i = 0; i < 16; i++) A.spike(g, 60 + i * 76 + rnd() * 30, 60, 30 + rnd() * 40, 60 + rnd() * 120, 0x0b0406, 1, false);
      for (i = 0; i < 4; i++) {               // distant pillars
        var px = 140 + i * 300 + rnd() * 60;
        g.fillStyle(0x0c0507, 0.92);
        g.fillTriangle(px - 46, 640, px + 46, 640, px + 18, 130);
        g.fillTriangle(px - 46, 640, px + 18, 130, px - 26, 150);
        g.lineStyle(2, 0xff6a1a, 0.35);
        g.lineBetween(px + 4, 600, px + 12, 200);
      }
      var hz = g; for (var k = 0; k < 40; k++) { hz.fillStyle(0xff6a1a, 0.012); hz.fillRect(0, 560 - k * 3, W, 3); }
    });

    A.bake(scene, 'mm_near', W, H, function (g) {
      A.ridge(g, W, 706, [[4, 16, 0.2], [11, 7, 1.0]], 0x050204, 1, H);
      var rnd = U.rng(23);
      for (var i = 0; i < 6; i++) A.spike(g, 110 + i * 200 + rnd() * 50, 0, 38, 70 + rnd() * 90, 0x050204, 0.92, false);
    });

    var update = A.layers(scene, [
      { key: 'mm_sky', factor: 0.02, depth: -50 },
      { key: 'mm_far', factor: 0.12, depth: -40 },
      { key: 'mm_mid', factor: 0.38, depth: -30 },
      { key: 'mm_near', factor: 1.35, depth: 40 }
    ]);

    // ground + platforms (world space)
    var g = scene.add.graphics().setDepth(5), gy = this.groundY, rnd2 = U.rng(99), i;
    g.fillStyle(0x0d0506, 1);
    g.fillRect(0, gy, this.width, H - gy + 40);
    g.fillStyle(0xff6a1a, 0.12);
    g.fillRect(0, gy, this.width, 10);
    g.lineStyle(3, 0xff7a2a, 0.75);
    g.lineBetween(0, gy + 1, this.width, gy + 1);
    for (i = 0; i < 26; i++) {               // glowing cracks
      var cx = rnd2() * this.width, cy = gy + 14;
      g.lineStyle(2, 0xff5a1a, 0.5);
      g.beginPath(); g.moveTo(cx, cy);
      g.lineTo(cx + rnd2() * 24 - 12, cy + 22); g.lineTo(cx + rnd2() * 30 - 15, cy + 56);
      g.strokePath();
    }
    this.platforms.forEach(function (p) {
      g.fillStyle(0x120708, 1);
      g.fillRect(p.x, p.y, p.w, 20);
      g.fillTriangle(p.x + 10, p.y + 20, p.x + p.w - 10, p.y + 20, p.x + p.w / 2, p.y + 54);
      g.lineStyle(3, 0xff7a2a, 0.7);
      g.lineBetween(p.x, p.y + 1, p.x + p.w, p.y + 1);
    });

    return function (dt) {
      update(scene.cameras.main);
      if (Math.random() < dt * 9) {
        var cam = scene.cameras.main;
        scene.fx.ember(cam.scrollX + Math.random() * W, cam.scrollY + H - 40 - Math.random() * 120);
      }
    };
  }
});
