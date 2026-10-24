// Cutscene: days later, at the cliff, the guide girl pushes the hero into the lava (Agent B).
// Reads Story flag `picked_cursed_item` (set in ring_road). With the ring the hero survives; without it the run ends.
TG.registerCutscene('cliff_betrayal', function (scene, done) {
  var S = TG.Stage, Pose = TG.Pose, W = TG.W, H = TG.H, D = TG.Dialogue.cliff_betrayal;
  var GROUND = 500, EDGE = 930;
  var t = 0, splashed = false, show = true, picked = TG.Story.has('picked_cursed_item');

  TG.lavaDeath = false;

  TG.Art.bake(scene, 'cb_bg', W, H, function (g) {
    TG.Art.gradient(g, W, H, [[0, 0x0b0714], [0.5, 0x3a1620], [0.8, 0x8a2a14], [1, 0xd9531a]]);
    TG.Art.glow(g, 1000, 660, 460, 0xff6a1a, 0.18);
    TG.Art.ridge(g, W, 470, [[2, 50, 0.6], [5, 20, 1.4]], 0x1a0a10, 1, H);
    g.fillStyle(0x0d0709, 1); g.fillRect(0, GROUND, EDGE, H - GROUND);        // the cliff
    g.fillStyle(0x6a2a1a, 1); g.fillRect(EDGE, 650, W - EDGE, H - 650);       // lava
    g.fillStyle(0xff7a2a, 0.8); g.fillRect(EDGE, 650, W - EDGE, 6);
    g.lineStyle(3, 0xff7a2a, 0.6); g.lineBetween(0, GROUND + 1, EDGE, GROUND + 1);
  });
  var bg = scene.add.image(0, 0, 'cb_bg').setOrigin(0, 0).setDepth(-10);
  var gx = scene.add.graphics().setDepth(10);

  var hero = S.actor(160, 1, S.heroCfg, GROUND), girl = S.actor(260, 1, TG.GirlLook.cfg, GROUND);
  var WIND = Pose.make({ lean: -18, hipF: 20, kneeF: -14, hipB: -30, kneeB: -20, shF: -30, elF: 70, shB: -40, elB: 60, wpn: 0, head: 6 });
  var PUSH = Pose.make({ lean: 40, hipF: 50, kneeF: -30, hipB: -50, kneeB: -20, shF: 85, elF: 5, shB: 80, elB: 5, wpn: 0, head: -8 });

  scene.updaters.push(function (dt) {
    gx.clear();
    if (!show) return;                                                  // after the fall nobody is drawn
    t += dt;
    S.step(hero, dt, t); S.step(girl, dt, t);
    if (hero.mode !== 'gone') {
      var hp = TG.Rig.draw(gx, hero.x, hero.y, hero.f, hero.pose, hero.cfg, 1);
      if (picked) {                                                     // the ring glows on the hero's hand
        TG.Art.glow(gx, hero.x + hp.hnF.x, hero.y + hp.hnF.y, 16, 0xff7a2a, 0.3);
        gx.fillStyle(0xffb347, 1); gx.fillCircle(hero.x + hp.hnF.x, hero.y + hp.hnF.y, 3);
      }
    }
    TG.GirlLook.draw(gx, girl.x, girl.y, girl.f, girl.pose, t, 1);
    if (Math.random() < dt * 10) scene.fx.ember(EDGE + Math.random() * (W - EDGE), 650);
    if (hero.mode === 'fall' && hero.y > 690 && !splashed) { splashed = true; hero.mode = 'gone'; splash(); }
  });

  scene.fadeIn(900);
  S.walk(girl, 600, 110);
  S.walk(hero, 520, 130, function () { scene.say(D.intro, toEdge); });

  function toEdge() {
    S.walk(girl, 760, 130);
    S.walk(hero, 870, 140, function () { scene.say(D.edge, betray); });
  }

  function betray() {
    S.blend(girl, WIND, 500);
    scene.wait(750, function () {
      girl.x += 40;
      S.blend(girl, PUSH, 140);
      scene.wait(120, function () {
        Pose.copy(Pose.HURT, hero.pose);
        hero.mode = 'fall'; hero.vx = 420; hero.vy = -420; hero.spin = 0;
        scene.cameras.main.shake(300, 0.01);
      });
    });
  }

  function splash() {
    scene.fx.ring(hero.x, 650, 10, 220, 0xff7a2a, 0.6, 5);
    scene.fx.dust(hero.x, 650, 12, 40);
    for (var i = 0; i < 24; i++) scene.fx.ember(hero.x + (Math.random() - 0.5) * 80, 650);
    scene.cameras.main.shake(500, 0.02);
    girl.mode = 'idle';
    scene.wait(900, function () { scene.say(D.betray, aftermath); });
  }

  function aftermath() {
    scene.fadeOut(900, function () {
      show = false; bg.setVisible(false);                               // black screen, text only
      scene.fadeIn(500);
      if (picked) {
        TG.Story.flag('burned_lost_part', true);
        scene.say(D.aftermathTaken, done);
      } else {
        TG.lavaDeath = true;
        scene.say(D.aftermathDead, function () { scene.fadeOut(900, function () { scene.scene.start('Summary'); }); });
      }
    });
  }
});
