// Cheap procedural art helpers. Everything is baked once into textures, so the
// per-frame cost on weak GPUs is just a few scrolling tile sprites.
TG.Art = {
  // Draw with a Graphics callback and bake it into a texture.
  bake: function (scene, key, w, h, fn) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    fn(g, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  },

  // Vertical gradient. stops: [[0,0xRRGGBB],[0.6,0x...],[1,0x...]]
  gradient: function (g, w, h, stops, step) {
    step = step || 4;
    for (var y = 0; y < h; y += step) {
      var t = y / h, i = 0;
      while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
      var a = stops[i], b = stops[i + 1];
      var k = TG.U.clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
      g.fillStyle(TG.U.lerpColor(a[1], b[1], k), 1);
      g.fillRect(0, y, w, step + 1);
    }
  },

  // A seamlessly tiling ridge line. waves: [[cycles, amplitude, phase], ...]
  // `cycles` must be an integer so the layer wraps without a seam.
  ridge: function (g, W, baseY, waves, color, alpha, bottom) {
    g.fillStyle(color, alpha == null ? 1 : alpha);
    g.beginPath();
    g.moveTo(0, bottom);
    for (var x = 0; x <= W; x += 8) {
      var h = 0;
      for (var i = 0; i < waves.length; i++) {
        h += waves[i][1] * Math.sin(2 * Math.PI * waves[i][0] * x / W + waves[i][2]);
      }
      g.lineTo(x, baseY - h);
    }
    g.lineTo(W, bottom);
    g.closePath();
    g.fillPath();
  },

  // Hanging spike (stalactite). Keep x well inside the tile to avoid clipping at the seam.
  spike: function (g, x, y, w, len, color, alpha, up) {
    g.fillStyle(color, alpha == null ? 1 : alpha);
    var d = up ? -1 : 1;
    g.fillTriangle(x - w / 2, y, x + w / 2, y, x + w * 0.08, y + d * len);
  },

  // Soft radial glow. Many thin layers so there is no visible banding (it used to be 5 hard rings).
  glow: function (g, x, y, r, color, a) {
    var N = 18, per = (a || 0.12) * 2.5 / N;
    for (var i = N; i >= 1; i--) {
      var k = i / N;
      g.fillStyle(color, per * (1.35 - k) * 1.0);
      g.fillCircle(x, y, r * k);
    }
  },

  // Creates scrolling parallax layers. layers: [{key, factor, depth, y?, alpha?}]
  // Returns an updater to call each frame: updater(camera)
  layers: function (scene, layers) {
    var list = layers.map(function (L) {
      var ts = scene.add.tileSprite(0, L.y || 0, TG.W, TG.H, L.key)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(L.depth);
      if (L.alpha != null) ts.setAlpha(L.alpha);
      return { ts: ts, f: L.factor, fy: L.factorY == null ? 0 : L.factorY };
    });
    return function (cam) {
      for (var i = 0; i < list.length; i++) {
        list[i].ts.tilePositionX = cam.scrollX * list[i].f;
        list[i].ts.tilePositionY = cam.scrollY * list[i].fy;
      }
    };
  }
};
