// Cold, empty counterpart to the molten mountain: the place where the hero faces himself.
TG.registerArea('mirror_hall', {
  name: 'The Hall of Reflection',
  width: 1700,
  height: 720,
  groundY: 620,
  bounds: { left: 70, right: 1630 },
  spawn: { player: 520, boss: 1180 },
  platforms: [
    { x: 300, y: 460, w: 230 },
    { x: 1170, y: 460, w: 230 }
  ],
  pits: [],

  build: function (scene) {
    var A = TG.Art, U = TG.U, W = TG.W, H = TG.H;
    scene.cameras.main.setBackgroundColor(0x04060f);

    A.bake(scene, 'mh_sky', W, H, function (g) {
      A.gradient(g, W, H, [[0, 0x03040b], [0.55, 0x0b1428], [1, 0x28456f]]);
      A.glow(g, 640, 250, 300, 0x9db8ff, 0.16);
      g.fillStyle(0xdbe6ff, 0.9); g.fillCircle(640, 250, 70);       // a cold, pale moon
      g.fillStyle(0x0b1428, 0.35); g.fillCircle(618, 236, 54);
    });
    A.bake(scene, 'mh_far', W, H, function (g) {
      A.ridge(g, W, 560, [[2, 40, 0.8], [6, 14, 2.1]], 0x0a1224, 1, H);
    });
    A.bake(scene, 'mh_mid', W, H, function (g) {
      var rnd = U.rng(7);
      for (var i = 0; i < 14; i++) {         // hanging mirror shards
        var x = 40 + i * 88 + rnd() * 30, y = 40 + rnd() * 260, s = 12 + rnd() * 26;
        g.fillStyle(0x9db8ff, 0.10 + rnd() * 0.12);
        g.fillTriangle(x, y, x + s, y + s * 0.5, x + s * 0.2, y + s * 1.6);
        g.lineStyle(1, 0xdbe6ff, 0.35);
        g.lineBetween(x, y, x + s * 0.2, y + s * 1.6);
      }
    });
    var update = A.layers(scene, [
      { key: 'mh_sky', factor: 0.02, depth: -50 },
      { key: 'mh_far', factor: 0.1, depth: -40 },
      { key: 'mh_mid', factor: 0.3, depth: -30 }
    ]);

    var g = scene.add.graphics().setDepth(5), gy = this.groundY;
    g.fillStyle(0x070a14, 1);
    g.fillRect(0, gy, this.width, H - gy + 40);
    g.fillStyle(0x9db8ff, 0.10);
    g.fillRect(0, gy, this.width, 8);
    g.lineStyle(2, 0xbcd0ff, 0.7);
    g.lineBetween(0, gy + 1, this.width, gy + 1);
    for (var i = 0; i < 18; i++) {           // ripples in the floor
      g.lineStyle(1, 0x7f9ee0, 0.18);
      g.strokeEllipse(60 + i * 100, gy + 24 + (i % 3) * 14, 90, 10);
    }
    this.platforms.forEach(function (p) {
      g.fillStyle(0x0a1020, 1);
      g.fillRect(p.x, p.y, p.w, 18);
      g.lineStyle(2, 0xbcd0ff, 0.6);
      g.lineBetween(p.x, p.y + 1, p.x + p.w, p.y + 1);
    });

    return function (dt) {
      update(scene.cameras.main);
      if (Math.random() < dt * 3) {
        var cam = scene.cameras.main;
        scene.fx.ember(cam.scrollX + Math.random() * W, cam.scrollY + H - 60, 0xbcd0ff);
      }
    };
  }
});
