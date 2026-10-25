// Heal tutorial: an ash husk, a slow, weak echo of the people the mountain burned.
// The hero starts hurt. The husk will not fall until the player has healed once, and the hero cannot die here.
TG.registerBoss('ash_husk', {
  name: 'Ash Husk',
  area: 'ash_basin',
  music: 'menu',
  deathText: 'Get up.',

  create: function (scene, x, y) {
    var P = TG.Pose.make;
    return new TG.Boss(scene, x, y, this, {
      hp: 120, speed: 120, pref: [80, 140], poise: 400, intro: 1.4, w: 44, h: 112, think: [0.9, 1.6],
      rig: { scale: 1.2, limb: 6.5, torsoW: 11, rim: 0xb08a6a, rimA: 0.4, rimW: 3, eye: 0xffb347, weapon: { len: 0, w: 0, color: 0x000000 },
             burn: true,                                              // still glowing where the lava was
             trails: [                                                // ash and smoke rising off its shoulders instead of cloth
               { at: 'sh', dx: -3, dy: 0, n: 6, seg: 9, w: 11, color: 0x4a3a36, a: 0.5, k: 9, kd: 1.2, back: 0.35, fall: -0.8, wave: 3.6, tw: 1.1 },
               { at: 'sh', dx: 3, dy: 2, n: 5, seg: 8, w: 8, color: 0x4a3a36, a: 0.4, k: 8, kd: 1.2, back: 0.2, fall: -0.9, wave: 4, ph: 2, tw: 1.3 }
             ] },
      attacks: [
        { id: 'swipe', windup: 650, active: 140, recover: 900, dmg: 7, reach: 96, off: 4, top: -96, bot: 0, kb: 220,
          range: [0, 130], weight: 1, tags: {}, tell: 0xb08a6a, lunge: 120,
          wind: P({ lean: -14, shF: 160, elF: -20, shB: 40, wpn: 0, head: 8 }),
          hit: P({ lean: 30, hipF: 30, kneeF: -20, hipB: -30, shF: 40, elF: 8, shB: 20, wpn: 0, head: -10 }),
          smear: { r: 70, a0: -110, a1: 40, w: 8 } }
      ],
      phaseAt: 0.0001
    });
  },

  onStart: function (scene) {
    var h = scene.player;
    h.hp = Math.round(h.maxHp * 0.42);
    scene.tut = { step: 0, t: 0 };
    scene.say([{ who: '', text: 'The lava let you go. Something rises from the ash.', ms: 3200 }]);
  },

  tick: function (scene, dt) {
    var h = scene.player, b = scene.boss, t = scene.tut, hint = scene.tutHint;
    if (scene.over) return;
    if (h.hp < 18) h.hp = 18;                                              // this place cannot kill you
    if (!h.healed && b.hp < b.maxHp * 0.3) b.hp = b.maxHp * 0.3;          // it will not fall until you have healed
    t.t += dt;
    var say = function (txt) { if (scene.tutTxt) scene.tutTxt.setText(txt); };
    if (!scene.tutTxt) scene.tutTxt = scene.add.text(TG.W / 2, 560, '', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#fff2d0', align: 'center' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101).setShadow(0, 2, '#000', 8);

    if (h.healed) {
      if (t.step < 3) { t.step = 3; t.t = 0; }
      say(b.dead ? '' : 'Whole again. Now end it.');
    } else if (h.healCharge >= 8) {
      t.step = 2;
      say(h.mode === 'heal' ? 'Keep holding…' : 'Hold  H  to heal.  Stay still. A hit will break it.');
    } else {
      t.step = 1;
      say('You are hurt. Charge a heal: 8 hits, or 4 heavy swings (K).   (' + h.healCharge + ' / 8)');
    }
  },

  onDefeated: function (scene) { if (scene.tutTxt) scene.tutTxt.setText(''); scene.say({ who: '', text: 'Then the ash is only ash. Ahead, the ruins.', ms: 3200 }); }
});
