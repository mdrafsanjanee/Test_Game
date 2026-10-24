// The ash basin: where the hero crawls out of the lava. A quiet, cooled-down place for the healing tutorial.
TG.registerArea('ash_basin', {
  name: 'The Ash Basin',
  width: 1500, height: 720, groundY: 620,
  bounds: { left: 70, right: 1430 },
  spawn: { player: 520, boss: 980 },
  platforms: [], pits: [],

  build: function (scene) {
    var A = TG.Art, U = TG.U, W = TG.W, H = TG.H, self = this;
    scene.cameras.main.setBackgroundColor(0x0a0608);
    A.bake(scene, 'ab_sky', W, H, function (g) {
      A.gradient(g, W, H, [[0, 0x0a0608], [0.55, 0x2a1a1c], [1, 0x6a3a2a]]);
      A.glow(g, 1000, 520, 420, 0xff8a4a, 0.08);
    });
    A.bake(scene, 'ab_far', W, H, function (g) {
      A.ridge(g, W, 500, [[2, 56, 0.9], [6, 22, 1.7]], 0x1c1214, 1, H);
    });
    A.bake(scene, 'ab_near', W, H, function (g) {
      A.ridge(g, W, 700, [[4, 14, 0.4], [10, 6, 1.4]], 0x070405, 1, H);
    });
    var update = A.layers(scene, [
      { key: 'ab_sky', factor: 0.02, depth: -50 },
      { key: 'ab_far', factor: 0.15, depth: -40 },
      { key: 'ab_near', factor: 1.3, depth: 40 }
    ]);
    var g = scene.add.graphics().setDepth(5), gy = this.groundY;
    g.fillStyle(0x1a1214, 1); g.fillRect(0, gy, this.width, H - gy + 40);
    g.lineStyle(3, 0x8a6a5a, 0.5); g.lineBetween(0, gy + 1, this.width, gy + 1);
    var rnd = U.rng(7);
    for (var i = 0; i < 18; i++) {             // cooled lava veins, barely glowing
      var cx = rnd() * this.width;
      g.lineStyle(2, 0xff5a1a, 0.18);
      g.beginPath(); g.moveTo(cx, gy + 14); g.lineTo(cx + rnd() * 30 - 15, gy + 40); g.lineTo(cx + rnd() * 30 - 15, gy + 80); g.strokePath();
    }
    return function (dt) {
      update(scene.cameras.main);
      if (Math.random() < dt * 6) {
        var cam = scene.cameras.main;
        scene.fx.ember(cam.scrollX + Math.random() * W, cam.scrollY + H - 40 - Math.random() * 160, 0xcfa890);
      }
    };
  }
});
