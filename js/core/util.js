TG.U = {
  clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  approach: function (v, target, d) {
    return v < target ? Math.min(v + d, target) : Math.max(v - d, target);
  },
  rand: function (a, b) { return a + Math.random() * (b - a); },
  chance: function (p) { return Math.random() < p; },
  sign: function (v) { return v < 0 ? -1 : 1; },
  overlap: function (a, b) {
    return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  },
  // pick one item by weight; items: [{w:number, ...}]
  weighted: function (items) {
    var sum = 0, i;
    for (i = 0; i < items.length; i++) sum += items[i].w;
    if (sum <= 0) return null;
    var r = Math.random() * sum;
    for (i = 0; i < items.length; i++) { r -= items[i].w; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  },
  lerpColor: function (c1, c2, t) {
    var r = Math.round(((c1 >> 16) & 255) * (1 - t) + ((c2 >> 16) & 255) * t);
    var g = Math.round(((c1 >> 8) & 255) * (1 - t) + ((c2 >> 8) & 255) * t);
    var b = Math.round((c1 & 255) * (1 - t) + (c2 & 255) * t);
    return (r << 16) | (g << 8) | b;
  },
  // deterministic RNG so baked art is stable between runs
  rng: function (seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  ease: {
    lin: function (t) { return t; },
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return 1 - (1 - t) * (1 - t); },
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inCubic: function (t) { return t * t * t; },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outBack: function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  }
};
