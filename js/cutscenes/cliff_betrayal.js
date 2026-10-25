// Cutscene: days later, at the cliff, the guide girl pushes the hero into the lava (Agent B).
// Reads Story flag `picked_cursed_item` (set in ring_road). With the ring the hero survives; without it the run ends.
//
// Directed as a scene, not a slideshow (see docs/CINEMATIC.md):
//   - lit only by the lava, so every shadow is long and points one way
//   - the girl's SHADOW raises an arm a few seconds before her body does: the truth arrives before the line does
//   - slow push-in, a low shot of the two shadows, slow-motion on the shove, a hard cut to her face
TG.registerCutscene('cliff_betrayal', function (scene, done) {
  var S = TG.Stage, Pose = TG.Pose, W = TG.W, H = TG.H, D = TG.Dialogue.cliff_betrayal, cine = scene.cine;
  var GROUND = 500, EDGE = 930;
  var t = 0, splashed = false, show = true, picked = TG.Story.has('picked_cursed_item');
  var shadowK = 0, closeup = 0, phase = 'scene', layers = [];

  TG.lavaDeath = false;

  // ---- art: five layers, all baked once, lit by one source (the lava, low and to the right) ----------------------
  var A = TG.Art, U = TG.U;
  A.bake(scene, 'cb_sky', W, H, function (g) {
    var rnd = U.rng(5), i;
    A.gradient(g, W, H, [[0, 0x06030b], [0.45, 0x23101c], [0.78, 0x6a2214], [1, 0xc8481a]]);
    for (i = 0; i < 46; i++) { g.fillStyle(0xffd9c0, 0.15 + rnd() * 0.3); g.fillRect(rnd() * W, rnd() * 260, 2, 2); }
    A.glow(g, 1060, 690, 560, 0xff6a1a, 0.2);
    g.fillStyle(0x12080e, 0.55);                                                  // smoke banks
    for (i = 0; i < 9; i++) g.fillEllipse(80 + i * 150 + rnd() * 60, 150 + rnd() * 160, 260 + rnd() * 140, 50 + rnd() * 30);
  });
  A.bake(scene, 'cb_far', W, H, function (g) {
    var rnd = U.rng(8), i;
    A.ridge(g, W, 500, [[2, 70, 0.7], [5, 26, 1.9]], 0x140910, 1, H);
    g.lineStyle(2, 0xff6a1a, 0.55);                                               // lava rivers on the far slopes
    for (i = 0; i < 5; i++) {
      var x = 120 + i * 250 + rnd() * 60;
      g.beginPath(); g.moveTo(x, 330 + rnd() * 40);
      g.lineTo(x + rnd() * 40 - 20, 400); g.lineTo(x + rnd() * 60 - 30, 460); g.lineTo(x + rnd() * 40 - 20, 520); g.strokePath();
    }
  });
  A.bake(scene, 'cb_lair', W, H, function (g) {                                   // the Monster King's lair, across the lava
    var rnd = U.rng(21), i, X = 1010;
    g.fillStyle(0x0b0508, 1);
    g.fillRect(X, 420, 280, 260);
    for (i = 0; i < 5; i++) {
      var tx = X + 10 + i * 56, th = 90 + rnd() * 90;
      g.fillRect(tx, 420 - th, 34, th + 6);
      g.fillTriangle(tx - 6, 420 - th, tx + 40, 420 - th, tx + 17, 420 - th - 48 - rnd() * 34);
    }
    g.fillStyle(0xff7a2a, 0.9);                                                   // lit windows
    for (i = 0; i < 12; i++) g.fillRect(X + 18 + rnd() * 240, 330 + rnd() * 90, 3, 6);
    g.fillStyle(0x3a0c08, 1); g.fillRect(X + 100, 520, 70, 160);                   // gate, a red glow behind it
    A.glow(g, X + 135, 600, 90, 0xff4a10, 0.5);
    g.lineStyle(3, 0xff6a1a, 0.55); g.lineBetween(X, 421, X + 280, 421);          // rim light
  });
  A.bake(scene, 'cb_lava', W, H, function (g) {
    var rnd = U.rng(33), i;
    g.fillStyle(0x7a2410, 1); g.fillRect(EDGE, 650, W - EDGE, H - 650);
    g.fillStyle(0xd9531a, 1); g.fillRect(EDGE, 650, W - EDGE, 16);
    g.fillStyle(0xff9a3a, 0.9); g.fillRect(EDGE, 650, W - EDGE, 5);
    g.lineStyle(2, 0xffc060, 0.5);
    for (i = 0; i < 18; i++) { var y = 670 + rnd() * 46, x = EDGE + rnd() * 330; g.lineBetween(x, y, x + 20 + rnd() * 50, y); }
    A.glow(g, 1110, 640, 340, 0xff7a2a, 0.22);
  });
  A.bake(scene, 'cb_ground', W, H, function (g) {                                // the cliff top, warmer the nearer the edge
    var i, rnd = U.rng(44);
    g.fillStyle(0x1c0e0f, 1); g.fillRect(0, GROUND, EDGE, H - GROUND);
    for (i = 0; i < 120; i++) {                                                   // lava-light falling across the stone
      g.fillStyle(0xff5a1a, 0.22 * Math.pow(i / 119, 1.8));
      g.fillRect(EDGE - 480 + i * 4, GROUND, 4.5, H - GROUND);
    }
    g.fillStyle(0x0b0608, 1);                                                      // ragged lip
    g.beginPath(); g.moveTo(EDGE - 40, GROUND);
    for (i = 0; i < 8; i++) g.lineTo(EDGE - 30 + i * 6 + rnd() * 6, GROUND + 18 + rnd() * 70);
    g.lineTo(EDGE + 6, 680); g.lineTo(EDGE, GROUND); g.closePath(); g.fillPath();
    g.lineStyle(3, 0xff7a2a, 0.7); g.lineBetween(0, GROUND + 1, EDGE, GROUND + 1);
    g.lineStyle(2, 0x2a1210, 0.8);                                                 // two sets of footprints running to the edge
    for (i = 0; i < 12; i++) { g.fillStyle(0x050304, 0.8); g.fillEllipse(60 + i * 62, GROUND + 9, 16, 4); g.fillEllipse(78 + i * 62, GROUND + 15, 14, 4); }
    g.fillStyle(0x050304, 1);                                                      // the royal banner she planted, already hers
    g.fillRect(836, GROUND - 120, 4, 120);
    g.fillStyle(0x7a1a24, 1); g.fillTriangle(840, GROUND - 120, 888, GROUND - 106, 840, GROUND - 82);
  });
  A.bake(scene, 'cb_fg', W, H, function (g) {
    g.fillStyle(0x040205, 1);
    g.fillTriangle(0, 440, 150, H, 0, H);
    g.fillTriangle(0, 560, 230, H, 0, H);
    g.fillTriangle(W, 600, W - 120, H, W, H);
  });
  layers.push(S.layer(scene, 'cb_sky', 0.04, -50, 1.3));
  layers.push(S.layer(scene, 'cb_far', 0.2, -45, 1.3));
  layers.push(S.layer(scene, 'cb_lair', 0.5, -40, 1.12));
  layers.push(S.layer(scene, 'cb_lava', 1, -20, 1));
  layers.push(S.layer(scene, 'cb_ground', 1, -10, 1));
  layers.push(S.layer(scene, 'cb_fg', 1.25, 30, 1));
  var gx = scene.add.graphics().setDepth(10);
  var glowG = scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD);

  var hero = S.actor(160, 1, S.heroCfg, GROUND), girl = S.actor(260, 1, TG.GirlLook.cfg, GROUND);
  var WIND = Pose.make({ lean: -18, hipF: 20, kneeF: -14, hipB: -30, kneeB: -20, shF: -30, elF: 70, shB: -40, elB: 60, wpn: 0, head: 6 });
  var PUSH = Pose.make({ lean: 40, hipF: 50, kneeF: -30, hipB: -50, kneeB: -20, shF: 85, elF: 5, shB: 80, elB: 5, wpn: 0, head: -8 });
  var RAISED = Pose.make({ lean: 2, hipF: 8, kneeF: -6, hipB: -10, kneeB: -8, shF: 150, elF: 20, shB: -10, elB: 20, wpn: 0, head: 0 });   // what her shadow does first
  var shadowPose = Pose.make();

  scene.updaters.push(function (dt) {
    gx.clear(); glowG.clear();
    if (phase === 'ember') {                                                    // black screen: only the ring is alive
      var beat = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 2.2)), 6);
      TG.Art.glow(glowG, W / 2, 330, 90 + 40 * beat, 0xff7a2a, 0.5);
      gx.lineStyle(3, 0xc8b08a, 0.9); gx.strokeCircle(W / 2, 330, 9);
      t += dt; return;
    }
    if (!show) return;                                                          // after the fall nobody is drawn
    t += dt;
    S.step(hero, dt, t); S.step(girl, dt, t);

    // shadows first: the hero's follows his body, the girl's drifts toward RAISED as shadowK rises
    if (hero.mode !== 'gone') S.shadow(gx, hero, hero.pose, hero.cfg, GROUND, -1, 0.8);
    Pose.mix(girl.pose, RAISED, shadowK, shadowPose);
    S.shadow(gx, girl, shadowK > 0.01 ? shadowPose : girl.pose, girl.cfg, GROUND, -1, 0.8);

    if (hero.mode !== 'gone') {
      var hp = TG.Rig.draw(gx, hero.x, hero.y, hero.f, hero.pose, hero.cfg, 1);
      if (picked) {                                                             // the ring glows on the hero's hand
        TG.Art.glow(glowG, hero.x + hp.hnF.x, hero.y + hp.hnF.y, 16, 0xff7a2a, 0.3);
        gx.fillStyle(0xffb347, 1); gx.fillCircle(hero.x + hp.hnF.x, hero.y + hp.hnF.y, 3);
      }
    }
    TG.GirlLook.draw(gx, girl.x, girl.y, girl.f, girl.pose, t, 1);
    if (closeup > 0) TG.Art.glow(glowG, girl.x + 40, girl.y - 60, 150, 0xff6a1a, 0.35 * closeup);   // lava-light from below, on her face
    TG.Art.glow(glowG, EDGE + 80, 640, 200 + 14 * Math.sin(t * 1.6), 0xff7a2a, 0.10);               // the lava breathes
    if (Math.random() < dt * 10) scene.fx.ember(EDGE + Math.random() * (W - EDGE), 650);
    if (hero.mode === 'fall' && hero.y > 690 && !splashed) { splashed = true; hero.mode = 'gone'; splash(); }
  });

  // ---- direction ----------------------------------------------------------------------------------------------
  scene.fadeIn(1400);
  cine.bars(true, 1100);
  cine.vignette(0.6, 1600);
  cine.grade('lava', 0.12, 2000);
  cine.motes('ember', 24); cine.motes('ash', 20);
  cine.handheld(0.9);
  cine.cut({ x: 420, y: GROUND - 90, z: 1.0 });
  cine.track(function () { return { x: (hero.x + girl.x) / 2 + 50, y: GROUND - 95 }; }, 1.6);
  cine.shot({ z: 1.3 }, 12000);

  S.walk(girl, 600, 110);
  S.walk(hero, 520, 130, function () { scene.say(D.intro, toEdge); });

  function toEdge() {
    S.walk(girl, 760, 130);
    S.walk(hero, 870, 140, function () { scene.say(D.edge[0], reveal); });
  }

  // The tell. She says something warm; the ground says something else.
  function reveal() {
    cine.untrack();
    scene.say(D.edge[1], function () { scene.say(D.edge[2], betray); });
    scene.tweens.add({ targets: { k: 0 }, k: 1, duration: 2600, onUpdate: function (tw, o) { shadowK = o.k; } });
    cine.shot({ x: 700, y: GROUND + 4, z: 2.1 }, 2600);                         // look DOWN at the two shadows
    scene.wait(3500, function () { cine.shot({ x: 820, y: GROUND - 92, z: 1.7 }, 2400); });
  }

  function betray() {
    S.blend(girl, WIND, 500);
    cine.bars(true, 900, 120);
    scene.wait(750, function () {
      girl.x += 40;
      S.blend(girl, PUSH, 140);
      scene.wait(120, function () {
        Pose.copy(Pose.HURT, hero.pose);
        hero.mode = 'fall'; hero.vx = 420; hero.vy = -420; hero.spin = 0;
        cine.slowmo(0.28, 1100);
        cine.hitstop(110); cine.shake(0.012, 380); cine.flash(0xff7a2a, 450, 0.3);
        cine.track(function () { return { x: hero.x - 20, y: Math.min(hero.y - 50, 560) }; }, 5);
        cine.shot({ z: 1.5 }, 1400, 'Cubic.easeOut');
      });
    });
  }

  function splash() {
    scene.fx.ring(hero.x, 650, 10, 220, 0xff7a2a, 0.6, 5);
    scene.fx.dust(hero.x, 650, 12, 40);
    for (var i = 0; i < 24; i++) scene.fx.ember(hero.x + (Math.random() - 0.5) * 80, 650);
    cine.shake(0.02, 500); cine.flash(0xffa040, 600, 0.45);
    cine.untrack();
    girl.mode = 'idle';
    scene.wait(1000, function () {                                              // hard cut: her face, lit from below
      cine.cut({ x: girl.x + 10, y: GROUND - 92, z: 2.6 });
      cine.grade(0xff5a1a, 0.18, 800);
      scene.tweens.add({ targets: { k: 0 }, k: 1, duration: 900, onUpdate: function (tw, o) { closeup = o.k; } });
      cine.shot({ z: 3.0 }, 9000, 'Sine.easeOut');
      scene.wait(600, function () { scene.say(D.betray, aftermath); });
    });
  }

  function aftermath() {
    scene.fadeOut(900, function () {
      show = false; closeup = 0; layers.forEach(function (l) { l.setVisible(false); });
      cine.cut({ x: W / 2, y: H / 2, z: 1 }); cine.clearMotes(); cine.grade('none', 0, 0); cine.vignette(0.9, 0);
      scene.fadeIn(500);
      if (picked) {
        TG.Story.flag('burned_lost_part', true);
        phase = 'ember';
        cine.motes('ash', 14);
        scene.say(D.aftermathTaken, done);
      } else {
        TG.lavaDeath = true;
        scene.say(D.aftermathDead, function () { scene.fadeOut(900, function () { scene.scene.start('Summary'); }); });
      }
    });
  }
});
