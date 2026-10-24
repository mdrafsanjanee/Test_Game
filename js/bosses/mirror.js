// Boss: the Mirror. Same body, same moves, same rules as the hero. Its brain is built
// from the player's last five fights (TG.Record.profile), and it talks like a conscience.
TG.registerBoss('mirror', {
  name: '???',
  area: 'mirror_hall',
  deathText: 'How did I become this?',   // the ONLY boss whose death screen says this

  create: function (scene, x, y) {
    var p = new TG.Player(scene, x, y, { team: 'mirror', hp: 140, ctrl: new TG.Ctrl() });
    var prof = TG.Record.profile(5);
    p.profile = prof;
    p.dmgMul = 1.6;
    p.facing = -1;
    p.brain = new TG.MirrorBrain(p, prof, { react: 0.2, agg: 0.95 });
    p.brain.cool = 2.8;
    p.isBoss = true;
    this._said = {};
    return p;
  },

  onStart: function (scene) {
    scene.say(TG.Dialogue.mirror.intro(TG.Record, scene.boss.profile));
  },

  tick: function (scene) {
    var b = scene.boss, f = b.hp / b.maxHp, said = this._said, D = TG.Dialogue.mirror;
    if (f <= 0.72 && !said.a) { said.a = 1; scene.say(D.habit(TG.Record, b.profile)); }
    if (f <= 0.45 && !said.b) { said.b = 1; scene.say(D.mid); }
    if (f <= 0.2 && !said.c) { said.c = 1; scene.say(D.low); }
  },

  onDefeated: function (scene) { scene.say(TG.Dialogue.mirror.defeat); }
});
