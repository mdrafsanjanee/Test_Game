// Pause overlay shared by the arena and cutscenes.  Esc / P (or the II button) toggles it; Q leaves to the menu.
// TG.Pause.attach(scene, { onQuit: fn })  ->  sets scene.paused. The scene's update() must return early while paused.
TG.Pause = {
  attach: function (scene, opts) {
    var W = TG.W, H = TG.H, st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
    var dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.66).setScrollFactor(0).setDepth(300).setVisible(false);
    var t1 = scene.add.text(W / 2, H / 2 - 50, 'PAUSED', Object.assign({ fontSize: '46px', letterSpacing: 10 }, st)).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);
    var t2 = scene.add.text(W / 2, H / 2 + 20, 'Esc / P   resume          Q   leave to menu',
      Object.assign({ fontSize: '20px', color: '#c9c4dc' }, st)).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);
    var btn = scene.add.text(W - 36, 30, 'II', Object.assign({ fontSize: '20px', fontStyle: 'bold', backgroundColor: '#00000066', padding: { x: 10, y: 4 } }, st))
      .setOrigin(0.5).setScrollFactor(0).setDepth(299).setAlpha(0.6).setInteractive({ useHandCursor: true });
    var qb = scene.add.text(W / 2, H / 2 + 80, 'LEAVE TO MENU', Object.assign({ fontSize: '18px', backgroundColor: '#ffffff22', padding: { x: 14, y: 6 } }, st))
      .setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false).setInteractive({ useHandCursor: true });
    if (document.body.classList.contains('touch-on')) btn.setVisible(false);
    scene.paused = false;

    function toggle(force) {
      if (force === undefined && scene.stopFF && scene.stopFF()) return;   // Esc first stops a fast-forward
      var on = force === undefined ? !scene.paused : force;
      if (on === scene.paused || (on && scene.over)) return;
      scene.paused = on;
      scene.time.paused = on;
      if (on) scene.tweens.pauseAll(); else scene.tweens.resumeAll();
      [dim, t1, t2, qb].forEach(function (o) { o.setVisible(on); });
      if (TG.Music) TG.Music.pause(on);
      if (!on && scene.ctrl) { scene.ctrl.update(scene.nowMs || 0); scene.ctrl.clear(); }   // drop keys pressed while paused
    }
    function quit() {
      if (!scene.paused) return;
      if (TG.Music) { TG.Music.pause(false); TG.Music.fadeOut(400); }
      scene.time.paused = false; scene.tweens.resumeAll();
      if (opts && opts.onQuit) opts.onQuit();
      scene.scene.start('Menu');
    }
    var kb = scene.input.keyboard;
    kb.on('keydown-ESC', function () { toggle(); });
    kb.on('keydown-P', function () { toggle(); });
    kb.on('keydown-Q', quit);
    btn.on('pointerdown', function () { toggle(); });
    qb.on('pointerdown', quit);
    scene.events.once('shutdown', function () { if (scene.paused && TG.Music) TG.Music.pause(false); scene.time.paused = false; });
    scene.togglePause = toggle;
  }
};
