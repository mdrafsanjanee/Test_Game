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
    // Skip: hold Enter/Space to fast-forward (release stops). A quick tap latches it on; tap again or Esc stops it.
    // Flags and choices still resolve; a choice prompt waits for you.
    this.ff = 1; this.ffLatch = false;
    this.skipTxt = this.add.text(TG.W - 78, 30, 'hold Enter  skip', Object.assign({ fontSize: '14px', color: '#8a85a0' }, st)).setOrigin(1, 0.5).setDepth(299).setAlpha(0.7);
    var setFF = function (n) {
      self.ff = n; self.time.timeScale = n; self.tweens.timeScale = n;
      self.skipTxt.setText(n > 1 ? 'skipping…  (Enter / Esc to stop)' : 'hold Enter  skip');
    };
    this.stopFF = function () { if (self.ff <= 1) return false; self.ffLatch = false; setFF(1); return true; };
    var downAt = 0;
    var onDown = function (ev) {
      if (self.paused || (ev && ev.repeat)) return;
      if (self.ff > 1 && self.ffLatch) { self.stopFF(); downAt = 0; return; }
      downAt = self.game.getTime(); setFF(16);
    };
    var onUp = function () {
      if (!downAt || self.ff <= 1 || self.ffLatch) return;
      if (self.game.getTime() - downAt < 350) self.ffLatch = true; else self.stopFF();
      downAt = 0;
    };
    ['ENTER', 'SPACE'].forEach(function (k) { self.input.keyboard.on('keydown-' + k, onDown); self.input.keyboard.on('keyup-' + k, onUp); });
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
