// Cutscene: a quiet road, days before the cliff. A ring lies on a stone (Agent B).
// The choice is made here, far from any danger. Sets Story flag `picked_cursed_item`.
// Debug: bot=1 auto-picks the ring, add item=0 to leave it.
TG.registerCutscene('ring_road', function (scene, done) {
  var S = TG.Stage, Pose = TG.Pose, W = TG.W, H = TG.H, D = TG.Dialogue.ring_road;
  var GROUND = 520, RING_X = 740;
  var st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
  var t = 0, ringTaken = false;

  TG.Art.bake(scene, 'rr_bg', W, H, function (g) {
    var A = TG.Art, rnd = TG.U.rng(12), i;
    A.gradient(g, W, H, [[0, 0x0a1020], [0.55, 0x2a3a52], [1, 0x6a7a84]]);
    A.glow(g, 300, 260, 300, 0xffd9a0, 0.12);
    g.fillStyle(0xf2e6cc, 0.9); g.fillCircle(300, 260, 38);                       // low pale sun
    A.ridge(g, W, 470, [[2, 40, 0.3], [6, 14, 1.2]], 0x101a28, 1, H);
    for (i = 0; i < 22; i++) {                                                  // distant pines
      var x = 20 + i * 58 + rnd() * 20, h = 70 + rnd() * 80;
      g.fillStyle(0x0b121c, 1);
      g.fillTriangle(x - 18, 500, x + 18, 500, x, 500 - h);
    }
    g.fillStyle(0x0c1018, 1); g.fillRect(0, GROUND, W, H - GROUND);              // the road
    g.lineStyle(2, 0x8a98a4, 0.5); g.lineBetween(0, GROUND + 1, W, GROUND + 1);
    g.fillStyle(0x2a3038, 1); g.fillRect(RING_X - 26, GROUND - 22, 52, 22);      // stone
  });
  scene.add.image(0, 0, 'rr_bg').setOrigin(0, 0).setDepth(-10);
  var gx = scene.add.graphics().setDepth(10);

  var hero = S.actor(120, 1, S.heroCfg, GROUND), girl = S.actor(220, 1, TG.GirlLook.cfg, GROUND);
  var REACH = Pose.make({ lean: 20, hipF: 20, kneeF: -14, hipB: -24, kneeB: -14, shF: 80, elF: 20, shB: -12, elB: 25, wpn: -20, head: 4 });

  scene.updaters.push(function (dt) {
    t += dt;
    S.step(hero, dt, t); S.step(girl, dt, t);
    gx.clear();
    if (!ringTaken) {
      TG.Art.glow(gx, RING_X, GROUND - 28, 30, 0xffb347, 0.14 + 0.06 * Math.sin(t * 2));
      gx.lineStyle(3, 0xc8b08a, 1); gx.strokeCircle(RING_X, GROUND - 28, 7);
    }
    TG.Rig.draw(gx, hero.x, hero.y, hero.f, hero.pose, hero.cfg, 1);
    TG.GirlLook.draw(gx, girl.x, girl.y, girl.f, girl.pose, t, 1);
  });

  scene.fadeIn(900);
  S.walk(girl, 560, 100);
  S.walk(hero, 640, 120, function () { scene.say(D.relic, ask); });

  function ask() {
    var prompt = scene.add.text(W / 2, 120, 'J   take the ring          L   leave it', Object.assign({ fontSize: '22px' }, st))
      .setOrigin(0.5).setDepth(100);
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
        scene.fx.ring(RING_X, GROUND - 28, 8, 80, 0xffb347, 0.5, 3);
        scene.say(D.taken, done);
      } else scene.say(D.skipped, done);
    }
    function onJ() { choose(true); }
    function onL() { choose(false); }
    kb.on('keydown-J', onJ); kb.on('keydown-L', onL);
    if (TG.debug.bot) scene.wait(1500, function () { choose(new URLSearchParams(location.search).get('item') !== '0'); });
  }
});
