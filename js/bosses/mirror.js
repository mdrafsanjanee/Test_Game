// The Mirror ("The Hero?"). Same body, same moves as the hero, but very fast and evasive.
// BASELINE is identical for everyone. The record only picks its STYLE: slip behind you or meet you
// head-on (TG.Record.flank), plus your dodge habit, combo length and heavy-swing habit.
//
// Phase 1: a protective layer surrounds it. Beat it once and the layer shatters.
// Phase 2: every blow you land comes back to you (70%), and the killing blow is always lethal to you too.
//          It kites and dodges so you hurt yourself less. Stop swinging for ~10s and it yields instead.
// The story is told while you fight: it is your own soul, trapped in the chaos stone.
TG.registerBoss('mirror', {
  name: '???',
  area: 'mirror_hall',
  music: 'mirror',
  deathText: 'How did I become this?',   // the ONLY boss whose death screen says this

  create: function (scene, x, y) {
    var def = this;
    var p = new TG.Player(scene, x, y, { team: 'mirror', hp: 140, ctrl: new TG.Ctrl() });
    var prof = TG.Record.profile(5);
    p.profile = prof;
    p.facing = -1;
    p.isBoss = true;
    p.dmgMul = 1.5;
    // baseline: fast legs, quick recovery, short but READABLE windups (the tell ring marks every swing)
    p.speedMul = 1.42; p.windupMul = 1.9; p.recMul = 0.7; p.cdMul = 0.45;
    p.canHeal = true; p.stuns = true;       // it heals like you do (4 hits, hold 1.25s, can be broken) and its finishers stun
    p.shield = true;
    p.brain = new TG.ShadeBrain(p, prof, { react: 0.1, evade: 0.5 });
    p.brain.cool = 2.6;

    p.onShatter = function (src) { def.shatter(scene, p, src); };

    var baseDraw = p.draw;
    p.draw = function () {
      baseDraw.call(this);
      var g = this.g, t = scene.time.now / 1000, cx = this.x, cy = this.y - 54;
      if (this.shield) {
        g.fillStyle(0x9fd0ff, 0.07); g.fillEllipse(cx, cy, 96, 132);
        g.lineStyle(2.5, 0x9fd0ff, 0.5 + 0.18 * Math.sin(t * 3)); g.strokeEllipse(cx, cy, 96, 132);
        g.lineStyle(1.5, 0xdbe9ff, 0.35); g.beginPath(); g.arc(cx, cy, 56, -2.6, -1.7); g.strokePath();
      }
      if (this.reflect > 0) {
        g.lineStyle(2, 0xffffff, 0.3 + 0.3 * Math.abs(Math.sin(t * 7)));
        g.strokeEllipse(cx, cy, 78 + 6 * Math.sin(t * 9), 124);
        g.lineStyle(1.5, 0xffe0c0, 0.55);
        for (var i = 0; i < 4; i++) {            // hairline cracks across the body
          var a = i * 1.57 + 0.4;
          g.lineBetween(cx + Math.cos(a) * 12, cy + Math.sin(a) * 22, cx + Math.cos(a) * 36, cy + Math.sin(a) * 52);
        }
      }
    };
    return p;
  },

  onStart: function (scene) {
    scene.mstate = { idle: 0, yieldT: 0, said: {}, yielded: false };
    scene.say(TG.Dialogue.mirror.intro(TG.Record, scene.boss.profile, scene.boss.brain.style));
  },

  // The protective layer breaks. Phase 2 begins.
  shatter: function (scene, b, src) {
    var D = TG.Dialogue.mirror, st = scene.mstate;
    b.phase = 2; b.brain.phase = 2;
    b.brain.react = 0.07; b.brain.evade = 0.82; b.brain.cool = 2.6; b.brain.seq = null; b.brain.after = null;
    b.maxHp = 100; b.hp = 100; b.reflect = 0.7; b.shield = false;
    b.windupMul = 1.6; b.speedMul = 1.55; b.cdMul = 0.45; b.healCharge = 0;
    b.rigCfg.rim = 0xfff2d0; b.rigCfg.rimA = 0.9; b.rigCfg.eye = 0xffffff;
    b.mode = 'hurt'; b.act = { t: -1700 }; b.invuln = 2.2; b.vx = 0; b.vy = -420; b.grounded = false;
    b.iframe = false; b.endCombo();
    if (src) { src.hp = Math.min(src.maxHp, src.hp + src.maxHp * 0.3); src.invuln = Math.max(src.invuln, 1.6); }   // a small breath (30%) before the hard part
    st.idle = -2.5;

    for (var i = 0; i < 40; i++) scene.fx.spark(b.x, b.y - 55, Math.random() < 0.5 ? 1 : -1, 1, i % 2 ? 0x9fd0ff : 0xffffff, 1.5);
    scene.fx.ring(b.x, b.y - 55, 10, 420, 0x9fd0ff, 0.8, 6);
    scene.fx.ring(b.x, b.y - 55, 6, 260, 0xffffff, 0.6, 3);
    scene.shake(0.016, 700);
    scene.hitstop(260);
    if (TG.Sfx) TG.Sfx.play('shatter');
    if (TG.Music) TG.Music.phase(2);
    scene.say(D.shatter);
  },

  tick: function (scene, dt) {
    var b = scene.boss, h = scene.player, st = scene.mstate, D = TG.Dialogue.mirror, said = st.said;
    if (!st || scene.over) return;
    var f;
    if (b.phase === 1) {
      f = b.hp / b.maxHp;
      if (f <= 0.82 && !said.a) { said.a = 1; scene.say(D.habit(TG.Record, b.profile, b.brain.style)); }
      if (f <= 0.58 && !said.b) { said.b = 1; scene.say(D.mid); }
      if (f <= 0.3 && !said.c) { said.c = 1; scene.say(D.low); }
      return;
    }
    // ---- phase 2 ----
    f = b.hp / b.maxHp;
    if (f <= 0.78 && !said.p1) { said.p1 = 1; scene.say(D.p2a); }
    if (f <= 0.5 && !said.p2) { said.p2 = 1; scene.say(D.p2b); }
    if (f <= 0.26 && !said.p3) { said.p3 = 1; scene.say(D.p2c); }

    // The way out: stop swinging. Dodge for ten seconds and it lowers its blade.
    if (h.mode === 'attack') this.noteSwing(scene);
    else st.idle += dt;
    if (!b.brain.yielding && st.idle >= 10 && !st.yielded) {
      b.brain.yielding = true; st.yielded = true; st.yieldT = 0;
      b.rigCfg.weapon.len = 6;
      b.mode = 'free'; b.act = null;
      scene.fx.ring(b.x, b.y - 55, 8, 120, 0xfff2d0, 0.6, 3);
      scene.say(D.yield);
    }
    if (b.brain.yielding) {
      st.yieldT += dt;
      if (st.yieldT >= 6.5) scene.finishEncounter('forgiven');
    }
  },

  // called whenever the hero swings or lands a reflected hit
  noteSwing: function (scene) {
    var st = scene.mstate, b = scene.boss;
    st.idle = 0;
    if (b.brain && b.brain.yielding) {
      b.brain.yielding = false; st.yielded = false; b.rigCfg.weapon.len = 46;
      scene.say(TG.Dialogue.mirror.unyield);
    }
  },

  onDefeated: function (scene) { scene.say(TG.Dialogue.mirror.defeat); }
});
