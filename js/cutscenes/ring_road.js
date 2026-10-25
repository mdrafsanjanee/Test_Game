// Cutscene: a quiet road, days before the cliff. A ring lies on a stone (Agent B).
// The choice is made here, far from any danger. Sets Story flag `picked_cursed_item`.
// Debug: bot=1 auto-picks the ring, add item=0 to leave it.
//
// Direction: this is the calm before. Warm dusk, drifting petals (they come back in the last scene), and one wrong note:
// the guide stands perfectly still with her back to the ring, watching the road behind them. She never looks at it.
TG.registerCutscene('ring_road', function (scene, done) {
  var S = TG.Stage, Pose = TG.Pose, W = TG.W, H = TG.H, D = TG.Dialogue.ring_road, cine = scene.cine;
  var GROUND = 520, RING_X = 740;
  var st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
  var t = 0, ringTaken = false, ringHint = 0;

  TG.Story.flag('burned_lost_part', false);                                    // a fresh run: the hero has not been burned yet
  TG.Story.flag('picked_cursed_item', false);

  var A = TG.Art, U = TG.U;
  A.bake(scene, 'rr_sky', W, H, function (g) {
    var rnd = U.rng(12), i;
    A.gradient(g, W, H, [[0, 0x1a1630], [0.34, 0x58395a], [0.62, 0xd9885a], [1, 0xf6c98c]]);
    A.glow(g, 330, 330, 360, 0xffd9a0, 0.34);
    g.fillStyle(0xfff0d0, 1); g.fillCircle(330, 330, 50);                       // low sun, left
    for (i = 0; i < 7; i++) {                                                   // long streak clouds, lit from below
      var y = 120 + i * 48 + rnd() * 20;
      g.fillStyle(0xf2a98a, 0.22 + rnd() * 0.18); g.fillEllipse(180 + rnd() * 900, y, 340 + rnd() * 260, 9 + rnd() * 9);
      g.fillStyle(0x3a2646, 0.25); g.fillEllipse(220 + rnd() * 900, y - 12, 300 + rnd() * 200, 8);
    }
  });
  A.bake(scene, 'rr_far', W, H, function (g) {
    A.ridge(g, W, 450, [[2, 46, 0.3], [5, 18, 1.2]], 0x6a4a66, 1, H);
    A.ridge(g, W, 490, [[3, 34, 1.1], [7, 12, 0.4]], 0x4a3556, 1, H);
    g.fillStyle(0xf2b890, 0.18); g.fillRect(0, 430, W, 70);                      // haze
  });
  A.bake(scene, 'rr_mid', W, H, function (g) {                                   // a hillside village: roofs, a torii, lanterns, pines
    var rnd = U.rng(31), i, x;
    g.fillStyle(0x2a2038, 1);
    A.ridge(g, W, 515, [[2, 18, 0.9], [6, 7, 0.2]], 0x2a2038, 1, H);
    for (i = 0; i < 9; i++) {                                                    // houses with swept roofs
      x = 560 + i * 78 + rnd() * 20; var y = 500 - Math.sin(i * 0.7) * 16, w = 40 + rnd() * 22;
      g.fillStyle(0x1e1830, 1); g.fillRect(x, y - 24, w, 26);
      g.fillTriangle(x - 10, y - 22, x + w + 10, y - 22, x + w / 2, y - 48);
      g.fillStyle(0xffc27a, 0.9); g.fillRect(x + 8, y - 14, 4, 6); if (w > 52) g.fillRect(x + w - 14, y - 14, 4, 6);   // lamplight in the windows
    }
    g.fillStyle(0x4a1c26, 1);                                                    // torii at the village edge
    g.fillRect(500, 440, 6, 70); g.fillRect(548, 440, 6, 70); g.fillRect(490, 436, 74, 7); g.fillRect(496, 450, 62, 5);
    for (i = 0; i < 16; i++) {                                                   // pines
      x = 30 + i * 80 + rnd() * 40; var h = 80 + rnd() * 90;
      if (x > 480 && x < 960) continue;
      g.fillStyle(0x1a1428, 1); g.fillTriangle(x - 20, 520, x + 20, 520, x, 520 - h);
      g.fillTriangle(x - 15, 520 - h * 0.45, x + 15, 520 - h * 0.45, x, 520 - h * 1.08);
    }
  });
  A.bake(scene, 'rr_ground', W, H, function (g) {
    var rnd = U.rng(77), i, y;
    for (y = 0; y < H - GROUND; y += 4) {                                        // the road, lit warm at its far edge
      var k = y / (H - GROUND);
      g.fillStyle(U.lerpColor(0x7a5656, 0x241a2a, Math.min(1, k * 1.3)), 1);
      g.fillRect(0, GROUND + y, W, 5);
    }
    g.lineStyle(2, 0xffd0a0, 0.55); g.lineBetween(0, GROUND + 1, W, GROUND + 1);
    g.fillStyle(0x2a1c30, 0.5);                                                  // two wheel ruts
    g.fillRect(0, GROUND + 38, W, 5); g.fillRect(0, GROUND + 72, W, 4);
    for (i = 0; i < 90; i++) {                                                   // grass tufts along the verge
      var x = rnd() * W; g.lineStyle(1.6, 0x2a2038, 0.9);
      g.beginPath(); g.moveTo(x, GROUND + 2); g.lineTo(x - 3 - rnd() * 3, GROUND - 10 - rnd() * 12); g.moveTo(x, GROUND + 2); g.lineTo(x + 3 + rnd() * 3, GROUND - 8 - rnd() * 14); g.strokePath();
    }
    g.fillStyle(0x2a2030, 1);                                                    // a small roadside jizo, red bib, offerings
    g.fillRoundedRect(300, GROUND - 38, 26, 38, 6); g.fillCircle(313, GROUND - 44, 11);
    g.fillStyle(0xa03a3a, 1); g.fillTriangle(303, GROUND - 32, 323, GROUND - 32, 313, GROUND - 20);
    g.fillStyle(0xf2e0c0, 1); g.fillCircle(296, GROUND - 4, 4); g.fillCircle(332, GROUND - 4, 4);
    g.fillStyle(0x2a3038, 1); g.fillRect(RING_X - 26, GROUND - 22, 52, 22);      // the stone the ring lies on
    g.fillStyle(0x3a424c, 1); g.fillRect(RING_X - 26, GROUND - 22, 52, 5);
  });
  A.bake(scene, 'rr_fg', W, H, function (g) {                                    // a blossom branch hanging in from the top-left
    var rnd = U.rng(5), i;
    g.lineStyle(7, 0x120c1a, 1); g.beginPath(); g.moveTo(-10, 90); g.lineTo(140, 120); g.lineTo(280, 90); g.lineTo(380, 130); g.strokePath();
    g.lineStyle(4, 0x120c1a, 1); g.beginPath(); g.moveTo(140, 120); g.lineTo(170, 190); g.moveTo(280, 90); g.lineTo(300, 40); g.strokePath();
    for (i = 0; i < 60; i++) { g.fillStyle([0xffd0dc, 0xffb8cc, 0xffe6ee][i % 3], 0.85); g.fillCircle(rnd() * 400, 60 + rnd() * 120, 3 + rnd() * 5); }
    for (i = 0; i < 70; i++) {                                                   // blades of grass, dark and close
      var x = rnd() * W; g.lineStyle(3, 0x0e0a14, 1);
      g.beginPath(); g.moveTo(x, H); g.lineTo(x + rnd() * 20 - 10, H - 26 - rnd() * 40); g.strokePath();
    }
  });
  var layers = [
    S.layer(scene, 'rr_sky', 0.04, -50, 1.3), S.layer(scene, 'rr_far', 0.2, -45, 1.3), S.layer(scene, 'rr_mid', 0.5, -40, 1.12),
    S.layer(scene, 'rr_ground', 1, -10, 1), S.layer(scene, 'rr_fg', 1.35, 30, 1)
  ];
  var gx = scene.add.graphics().setDepth(10);
  var glowG = scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD);

  var hero = S.actor(120, 1, S.heroCfg, GROUND), girl = S.actor(220, 1, TG.GirlLook.cfg, GROUND);
  var REACH = Pose.make({ lean: 20, hipF: 20, kneeF: -14, hipB: -24, kneeB: -14, shF: 80, elF: 20, shB: -12, elB: 25, wpn: -20, head: 4 });
  // Her pose while the hero decides: nothing moves, not even a breath. Everyone else in the world breathes.
  var STILL = Pose.make({ lean: 2, hipF: 4, kneeF: -3, hipB: -6, kneeB: -3, shF: 10, elF: 60, shB: 6, elB: 62, wpn: -20, head: 0, dy: 0 });

  scene.updaters.push(function (dt) {
    t += dt;
    S.step(hero, dt, t); S.step(girl, dt, t);
    gx.clear(); glowG.clear();
    S.shadow(gx, hero, hero.pose, hero.cfg, GROUND, 1, 0.5, 0x180f24);        // sun is low on the left: shadows fall right
    S.shadow(gx, girl, girl.pose, girl.cfg, GROUND, 1, 0.5, 0x180f24);
    if (!ringTaken) {
      var pulse = 0.5 + 0.5 * Math.sin(t * 2);
      TG.Art.glow(glowG, RING_X, GROUND - 28, 34 + 6 * pulse, 0xffb347, 0.2 + 0.1 * pulse + ringHint * 0.25);
      gx.lineStyle(3, 0xc8b08a, 1); gx.strokeCircle(RING_X, GROUND - 28, 7);
    }
    var hp = TG.Rig.draw(gx, hero.x, hero.y, hero.f, hero.pose, hero.cfg, 1);
    if (ringTaken) {                                                          // it never leaves his hand again
      TG.Art.glow(glowG, hero.x + hp.hnF.x, hero.y + hp.hnF.y, 18, 0xff7a2a, 0.28);
      gx.fillStyle(0xffb347, 1); gx.fillCircle(hero.x + hp.hnF.x, hero.y + hp.hnF.y, 3);
    }
    TG.GirlLook.draw(gx, girl.x, girl.y, girl.f, girl.pose, t, 1);
  });

  // ---- direction ----------------------------------------------------------------------------------------------------
  scene.fadeIn(1400);
  cine.bars(true, 1200);
  cine.grade('dusk', 0.1, 2000);
  cine.vignette(0.5, 1600);
  cine.shafts(0xffd9a0, 0.28);
  cine.motes('petal', 16); cine.motes('dust', 26);
  cine.handheld(0.6);
  cine.cut({ x: 380, y: GROUND - 80, z: 1.0 });
  cine.track(function () { return { x: (hero.x + girl.x) / 2 + 90, y: GROUND - 80 }; }, 1.2);
  cine.shot({ z: 1.12 }, 9000);

  S.walk(girl, 560, 100);
  S.walk(hero, 640, 120, function () {
    cine.untrack();
    cine.shot({ x: RING_X - 30, y: GROUND - 62, z: 1.7 }, 3600);              // the camera finds the ring before the hero does
    girl.f = -1; S.blend(girl, STILL, 500);                                    // she turns away and goes quiet
    scene.say(D.relic, ask);
  });

  function ask() {
    var prompt = scene.add.text(W / 2, 128, 'J   take the ring          L   leave it', Object.assign({ fontSize: '22px' }, st))
      .setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0).setShadow(0, 2, '#000', 8);
    scene.tweens.add({ targets: prompt, alpha: 1, duration: 600 });
    scene.tweens.add({ targets: { k: 0 }, k: 1, duration: 2400, onUpdate: function (tw, o) { ringHint = o.k; } });
    cine.shot({ x: RING_X - 10, y: GROUND - 44, z: 2.1 }, 4000);
    var kb = scene.input.keyboard, chosen = false;
    function choose(v) {
      if (chosen) return;
      chosen = true;
      kb.off('keydown-J', onJ); kb.off('keydown-L', onL);
      prompt.destroy();
      TG.Story.flag('picked_cursed_item', v);
      if (v) {
        ringTaken = true;
        S.blend(hero, REACH, 250);
        cine.slowmo(0.4, 700); cine.flash(0xffb347, 600, 0.28); cine.shake(0.003, 200);
        scene.fx.ring(RING_X, GROUND - 28, 8, 80, 0xffb347, 0.5, 3);
        cine.grade('ember', 0.16, 900);
        scene.wait(800, function () { cine.shot({ x: 700, y: GROUND - 80, z: 1.25 }, 3200); });
        scene.say(D.taken, finish);
      } else {
        cine.shot({ x: 700, y: GROUND - 80, z: 1.2 }, 3000);
        scene.say(D.skipped, finish);
      }
    }
    function onJ() { choose(true); }
    function onL() { choose(false); }
    kb.on('keydown-J', onJ); kb.on('keydown-L', onL);
    if (TG.debug.bot) scene.wait(1500, function () { choose(new URLSearchParams(location.search).get('item') !== '0'); });
  }

  function finish() { cine.grade('none', 0, 1200); cine.shafts(0xffd9a0, 0); scene.wait(500, done); }
});
