// Generic cutscene runner. Agent B registers cutscenes with TG.registerCutscene(id, fn).
// fn(scene, done): `scene` is this Phaser scene (draw with scene.add.*), call done() to continue the sequence.
// Helpers on the scene:  scene.say(lines, cb)   scene.wait(ms, cb)   scene.fadeIn(ms)   scene.fadeOut(ms, cb)
TG.CutsceneScene = class extends Phaser.Scene {
  constructor() { super('Cutscene'); }

  init(data) { this.d = data; }

  create() {
    var self = this, st = { fontFamily: 'Georgia, serif', color: '#e8e6f0' };
    this.cameras.main.setBackgroundColor(0x000000);
    this.fx = new TG.FX(this);
    this.subWho = this.add.text(TG.W / 2, 590, '', Object.assign({ fontSize: '15px', color: '#b8b2d0', fontStyle: 'italic' }, st)).setOrigin(0.5, 1).setDepth(100);
    this.subTxt = this.add.text(TG.W / 2, 630, '', Object.assign({ fontSize: '23px', align: 'center', wordWrap: { width: 960 } }, st)).setOrigin(0.5, 1).setDepth(100);
    this.updaters = [];

    var fn = TG.cutscenes[this.d.id];
    if (!fn) { console.warn('Missing cutscene', this.d.id); TG.Flow.next(this, this.d.idx); return; }

    TG.Pause.attach(this, {});
    // Skip: fast-forward the whole timeline (flags and choices still resolve; a choice waits for you)
    this.ff = 1;
    this.skipTxt = this.add.text(TG.W - 78, 30, 'Enter  skip', Object.assign({ fontSize: '14px', color: '#8a85a0' }, st)).setOrigin(1, 0.5).setDepth(299).setAlpha(0.7);
    var skip = function () { if (self.paused || self.ff > 1) return; self.ff = 16; self.time.timeScale = 16; self.tweens.timeScale = 16; self.skipTxt.setText('skipping…'); };
    this.input.keyboard.on('keydown-ENTER', skip);
    this.input.keyboard.on('keydown-SPACE', skip);
    var finished = false;
    fn(this, function () {
      if (finished) return;
      finished = true;
      self.cameras.main.fadeOut(500, 0, 0, 0);
      self.time.delayedCall(520, function () { TG.Flow.next(self, self.d.idx); });
    });
  }

  say(lines, cb) {
    var self = this, q = (Array.isArray(lines) ? lines : [lines]).map(TG.Story.line);
    (function next() {
      var l = q.shift();
      if (!l) { self.subWho.setText(''); self.subTxt.setText(''); if (cb) cb(); return; }
      self.subWho.setText(l.who); self.subTxt.setText(l.text);
      self.time.delayedCall(l.ms, next);
    })();
  }
  wait(ms, cb) { this.time.delayedCall(ms, cb); }
  fadeIn(ms) { this.cameras.main.fadeIn(ms || 600, 0, 0, 0); }
  fadeOut(ms, cb) { this.cameras.main.fadeOut(ms || 600, 0, 0, 0); if (cb) this.time.delayedCall((ms || 600) + 20, cb); }

  update(time, delta) {
    if (this.paused) return;
    var real = Math.min(delta, 50) / 1000, n = this.ff || 1, i, k;
    for (k = 0; k < n; k++) {                      // small fixed steps so fast-forward never overshoots a walk target
      for (i = 0; i < this.updaters.length; i++) this.updaters[i](real);
      this.fx.update(real);
    }
  }
};
