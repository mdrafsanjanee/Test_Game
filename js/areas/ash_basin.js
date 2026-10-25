// The ash basin: where the hero crawls out of the lava (Agent B). A quiet, cooled-down place for the healing tutorial.
//
// Art direction: the hero woke up alone and the world is already moving on without him. Read it left to right:
//   a long drag-mark where something was hauled out of the lava, a scorched handprint, a ring-shaped scar in the stone,
//   and on the far ridge a thin line of torches: the royal army marching home, led by the one who pushed him.
TG.registerArea('ash_basin', {
  name: 'The Ash Basin',
  width: 1500, height: 720, groundY: 620,
  bounds: { left: 70, right: 1430 },
  spawn: { player: 520, boss: 980 },
  platforms: [], pits: [],

  build: function (scene) {
    var A = TG.Art, U = TG.U, W = TG.W, H = TG.H, self = this, gy = this.groundY, WW = this.width;
    scene.cameras.main.setBackgroundColor(0x0a0608);

    A.bake(scene, 'ab_sky', W, H, function (g) {
      var rnd = U.rng(2), i;
      A.gradient(g, W, H, [[0, 0x0a0608], [0.5, 0x2a1a1c], [1, 0x7a4030]]);
      A.glow(g, 1000, 560, 480, 0xff8a4a, 0.16);
      g.fillStyle(0x140a0c, 0.5);
      for (i = 0; i < 7; i++) g.fillEllipse(100 + i * 190 + rnd() * 60, 120 + rnd() * 160, 300 + rnd() * 160, 40);   // low smoke
    });
    A.bake(scene, 'ab_far', W, H, function (g) {
      var rnd = U.rng(6), i;
      A.ridge(g, W, 500, [[2, 56, 0.9], [6, 22, 1.7]], 0x1c1214, 1, H);
      // the army, miles away, walking home: a thin line of torches along the ridge
      function ridgeY(x) { return 500 - (56 * Math.sin(2 * Math.PI * 2 * x / W + 0.9) + 22 * Math.sin(2 * Math.PI * 6 * x / W + 1.7)); }
      for (i = 0; i < 26; i++) {
        var x = 170 + i * 15 + rnd() * 6, y = ridgeY(x) - 6;                       // each torch rides the ridge line
        g.fillStyle(0xffb347, 0.9); g.fillRect(x, y, 2, 3);
        A.glow(g, x + 1, y + 1, 7, 0xff9a3a, 0.35);
      }
      g.fillStyle(0xffe0a0, 1); g.fillRect(163, ridgeY(163) - 9, 3, 4);               // the one at the front
      A.glow(g, 164, ridgeY(163) - 7, 12, 0xffd080, 0.5);
    });
    A.bake(scene, 'ab_near', W, H, function (g) {
      A.ridge(g, W, 700, [[4, 14, 0.4], [10, 6, 1.4]], 0x070405, 1, H);
    });
    var update = A.layers(scene, [
      { key: 'ab_sky', factor: 0.02, depth: -50 },
      { key: 'ab_far', factor: 0.15, depth: -40 },
      { key: 'ab_near', factor: 1.3, depth: 40 }
    ]);

    A.bake(scene, 'ab_world', WW, H, function (g) {
      var rnd = U.rng(7), i;
      g.fillStyle(0x1a1214, 1); g.fillRect(0, gy, WW, H - gy + 40);
      g.lineStyle(3, 0x8a6a5a, 0.5); g.lineBetween(0, gy + 1, WW, gy + 1);
      for (i = 0; i < 20; i++) {                                                  // cooled lava veins, barely glowing
        var cx = rnd() * WW;
        g.lineStyle(2, 0xff5a1a, 0.2);
        g.beginPath(); g.moveTo(cx, gy + 14); g.lineTo(cx + rnd() * 30 - 15, gy + 40); g.lineTo(cx + rnd() * 30 - 15, gy + 80); g.strokePath();
      }
      // the drag-mark: a long groove with scorched edges, wavering where he lost strength
      g.lineStyle(9, 0x0a0607, 0.95);
      g.beginPath(); g.moveTo(40, gy + 14);
      for (i = 1; i <= 14; i++) g.lineTo(40 + i * 33, gy + 14 + Math.sin(i * 0.9) * 4 + (i > 9 ? (i - 9) * 1.2 : 0));
      g.strokePath();
      g.lineStyle(2, 0xff6a2a, 0.35);
      g.beginPath(); g.moveTo(40, gy + 10);
      for (i = 1; i <= 14; i++) g.lineTo(40 + i * 33, gy + 10 + Math.sin(i * 0.9) * 4 + (i > 9 ? (i - 9) * 1.2 : 0));
      g.strokePath();
      // handprints pressed into the ash, getting fainter, four fingers and a thumb
      for (i = 0; i < 4; i++) {
        var hx = 190 + i * 70, hy = gy + 24 + (i % 2) * 6, a = 0.75 - i * 0.14;
        g.fillStyle(0x070405, a); g.fillEllipse(hx, hy, 15, 8);
        for (var f = 0; f < 4; f++) g.fillEllipse(hx + 8 + f * 3, hy - 4 + f * 2.4, 7, 2.6);
        g.lineStyle(1.5, 0xff7a2a, 0.3 * a); g.strokeEllipse(hx, hy, 15, 8);
      }
      // a ring-shaped scar where he first lay
      g.lineStyle(4, 0xff6a1a, 0.25); g.strokeEllipse(480, gy + 20, 90, 14);
      g.lineStyle(1.5, 0xffb347, 0.4); g.strokeEllipse(480, gy + 20, 90, 14);
      // the lost piece: a bit of scorched armour and a charred scrap of the guide's ribbon
      g.fillStyle(0x0a0607, 1); g.fillTriangle(300, gy, 330, gy, 316, gy - 14);
      g.fillStyle(0x7a2a44, 0.8); g.fillTriangle(350, gy, 372, gy - 3, 360, gy - 9);
    });
    scene.add.image(0, 0, 'ab_world').setOrigin(0, 0).setDepth(5);

    if (scene.cine) { scene.cine.motes('ash', 34); scene.cine.motes('ember', 8); scene.cine.shafts(0xffa070, 0.10); }

    return function (dt) {
      update(scene.cameras.main);
      if (Math.random() < dt * 6) {
        var cam = scene.cameras.main;
        scene.fx.ember(cam.scrollX + Math.random() * W, cam.scrollY + H - 40 - Math.random() * 160, 0xcfa890);
      }
    };
  }
});
