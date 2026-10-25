// Boss 1: The Ashen Warden. A mutated defender of the Molten Gate.
// Reference boss for Agent B: copy the shape of this file for new bosses.
(function () {
  var W = TG.Pose.make;

  // shared poses
  var OVER_WIND = W({ lean: -26, hipF: 18, kneeF: -14, hipB: -30, kneeB: -20, shF: 172, elF: -10, shB: 150, elB: -6, wpn: 28, head: 12 });
  var OVER_HIT  = W({ lean: 44, hipF: 52, kneeF: -40, hipB: -52, kneeB: -12, shF: 46, elF: 6, shB: 30, elB: 10, wpn: -8, head: -12 });
  var SWEEP_WIND = W({ lean: -30, hipF: 40, kneeF: -50, hipB: -34, kneeB: -44, shF: -80, elF: 6, shB: -50, elB: 8, wpn: -12, head: 8, dy: -3 });
  var SWEEP_HIT  = W({ lean: 36, hipF: 62, kneeF: -50, hipB: -60, kneeB: -30, shF: 86, elF: 0, shB: 40, elB: 12, wpn: 0, head: -10 });

  TG.registerBoss('warden', {
    name: 'The Ashen Warden',
    area: 'molten_mountain',
    music: 'warden',
    deathText: 'The mountain keeps its own.',

    decision: {
      prompt: 'The Warden kneels. Around him, the others watch from the dark of the Gate.',
      spare: 'Lower the blade',
      kill: 'Finish it',
      after: {
        spare: 'The Warden lowers his head. Something in the dark exhales.',
        kill: 'The embers go out one by one. No one in the Gate speaks.'
      }
    },

    create: function (scene, x, y) {
      var b = new TG.Boss(scene, x, y, this, {
        hp: 460, speed: 235, pref: [110, 220], phaseAt: 0.5, poise: 90, intro: 2.6, w: 56, h: 150,
        think: [0.22, 0.65],
        rig: { scale: 1.58, horns: 17, limb: 7.5, torsoW: 13, rim: 0xff6a2a, rimA: 0.6, rimW: 4, eye: 0xffb347,
               trails: TG.Rig.presets.cape(0x5a1c10, 0xff6a2a),      // a heavy tattered cape, edged by the mountain's glow
               weapon: { len: 78, w: 6, color: 0xff8a3a } },
        attacks: [
          { id: 'cleave', windup: 540, active: 120, recover: 520, dmg: 18, reach: 152, off: 10, top: -156, bot: 0, kb: 360,
            range: [0, 190], weight: 1.2, tags: { light: 1.1 }, lunge: 170, tell: 0xff5a2a,
            wind: OVER_WIND, hit: OVER_HIT, smear: { r: 132, a0: -140, a1: 70, w: 18 } },

          { id: 'sweep', windup: 480, active: 140, recover: 480, dmg: 14, reach: 214, off: 0, top: -54, bot: 0, kb: 300,
            range: [0, 240], weight: 0.9, tags: { passive: 0.3, light: 0.3 }, tell: 0xff9a2a,
            wind: SWEEP_WIND, hit: SWEEP_HIT, smear: { r: 140, a0: -35, a1: 30, w: 14 }, smearY: -42 },

          { id: 'thrust', windup: 430, active: 260, recover: 600, dmg: 16, reach: 136, off: 24, top: -126, bot: -10, kb: 420, lunge: 980,
            range: [180, 440], weight: 1, tags: { passive: 1.0, evade: 0.2 }, tell: 0xff3a2a,
            wind: W({ lean: -14, hipF: 26, kneeF: -22, hipB: -36, kneeB: -30, shF: -50, elF: 130, shB: -30, elB: 40, wpn: 0, head: 6 }),
            hit: W({ lean: 40, hipF: 70, kneeF: -26, hipB: -66, kneeB: -50, shF: 78, elF: 5, shB: -50, elB: 10, wpn: 0, head: -16 }),
            smear: { r: 120, a0: -12, a1: 12, w: 12 } },

          { id: 'leap', windup: 440, active: 0, recover: 700, leap: true, jump: { vx: 720, vy: -1150, air: 0.98 },
            landBox: { id: 'leap', dmg: 20, poise: 0, reach: 270, off: -135, top: -76, bot: 0, kb: 480, hitstop: 100, shake: 0.008 },
            range: [260, 680], weight: 0.9, tags: { evade: 1.2, passive: 0.6 }, tell: 0xffd27a,
            wind: W({ lean: 20, hipF: 44, kneeF: -74, hipB: -30, kneeB: -76, shF: 150, elF: -10, shB: 120, elB: -8, wpn: 20, head: 8, dy: -6 }),
            hit: W({ lean: 30, hipF: 40, kneeF: -50, hipB: -30, kneeB: -50, shF: 52, elF: 4, shB: 40, elB: 6, wpn: -6, head: -10 }) },

          // Counter to button-mashing: braces, then punishes. A heavy swing breaks the guard.
          { id: 'guard', windup: 150, active: 650, recover: 60, guard: true, then: 'riposte',
            range: [0, 175], weight: 0.4, tags: { light: 2.8 }, tell: 0x9ab4d8,
            cond: function () { return TG.Record.rate('light', 4) > 0.6; },
            wind: W({ lean: 8, hipF: 22, kneeF: -22, hipB: -22, kneeB: -26, shF: 62, elF: 40, shB: 55, elB: 40, wpn: 92, head: 6 }) },
          { id: 'riposte', chainOnly: true, windup: 170, active: 130, recover: 560, dmg: 22, reach: 172, off: 10, top: -156, bot: 0, kb: 480,
            armor: true, lunge: 430, tell: 0xffd27a,
            wind: OVER_WIND, hit: OVER_HIT, smear: { r: 136, a0: -140, a1: 70, w: 20 } },

          // Armoured and slow: ignores light hits. Rewards dodging, punishes greedy heavy swings.
          { id: 'smash', windup: 800, active: 150, recover: 780, dmg: 28, reach: 176, off: 12, top: -160, bot: 0, kb: 520,
            armor: true, range: [0, 210], weight: 0.7, tags: { heavy: 1.7 }, tell: 0xffd27a,
            wind: W({ lean: -34, hipF: 24, kneeF: -26, hipB: -36, kneeB: -34, shF: 178, elF: -4, shB: 170, elB: -4, wpn: 34, head: 14, dy: -5 }),
            hit: OVER_HIT, smear: { r: 140, a0: -150, a1: 80, w: 24 },
            onActive: function (b) {
              b.scene.shake(0.011, 260);
              b.scene.fx.ring(b.x + b.facing * 150, b.y - 6, 10, 150, 0xffa040, 0.4, 4);
              b.scene.fx.dust(b.x + b.facing * 150, b.y, 10, 40);
            } },

          // Anti-air: used when the player keeps jumping.
          { id: 'upper', windup: 400, active: 140, recover: 520, dmg: 15, reach: 130, off: 0, top: -270, bot: -24, kb: 380,
            range: [0, 180], weight: 0.25, tags: { air: 2.6 }, tell: 0x9ad0ff,
            cond: function (b, p) { return !p.grounded || TG.Record.airFrac() > 0.3; },
            wind: W({ lean: 14, hipF: 34, kneeF: -40, hipB: -30, kneeB: -40, shF: -64, elF: 0, shB: -40, elB: 10, wpn: -20, head: 6 }),
            hit: W({ lean: -10, hipF: 20, kneeF: -10, hipB: -20, kneeB: -14, shF: 176, elF: -8, shB: 150, elB: 0, wpn: 8, head: -14 }),
            smear: { r: 140, a0: 75, a1: -135, w: 16 } },

          // Phase 2 ------------------------------------------------------------------
          // Armoured spin: fired automatically when anyone gets behind the Warden (see Boss.rearGuard).
          { id: 'spin', chainOnly: true, both: true, spin: true, armor: true, windup: 200, active: 170, recover: 340,
            dmg: 17, reach: 175, off: 0, top: -150, bot: 0, kb: 480, tell: 0xffd27a,
            wind: W({ lean: 24, hipF: 34, kneeF: -40, hipB: -30, kneeB: -44, shF: 80, elF: 0, shB: 70, elB: 0, wpn: 0, head: 4, dy: -3 }),
            hit: SWEEP_HIT, smear: { r: 150, a0: -90, a1: 90, w: 16 } },

          // Fast gap-closer into the fury chain.
          { id: 'rush', phase: 2, then: 'fury2', windup: 210, active: 200, recover: 70, dmg: 14, reach: 138, off: 20, top: -130, bot: -6, kb: 380, lunge: 1500,
            range: [220, 620], weight: 1.4, tags: { passive: 1.2, evade: 0.6 }, tell: 0xff3a2a,
            wind: W({ lean: -12, hipF: 26, kneeF: -24, hipB: -36, kneeB: -30, shF: -50, elF: 130, shB: -30, elB: 40, wpn: 0, head: 6 }),
            hit: W({ lean: 44, hipF: 72, kneeF: -26, hipB: -68, kneeB: -50, shF: 78, elF: 5, shB: -50, elB: 10, wpn: 0, head: -16 }),
            smear: { r: 124, a0: -14, a1: 14, w: 12 } },

          { id: 'wave', phase: 2, windup: 520, active: 60, recover: 560, dmg: 0, range: [250, 820], weight: 1.1,
            tags: { passive: 1.5, air: 0.4 }, tell: 0xff6a1a,
            wind: W({ lean: -20, hipF: 20, kneeF: -20, hipB: -28, kneeB: -26, shF: 150, elF: -6, shB: 120, elB: 8, wpn: 40, head: 10 }),
            hit: W({ lean: 40, hipF: 50, kneeF: -44, hipB: -50, kneeB: -14, shF: 30, elF: 5, shB: 20, elB: 6, wpn: -6, head: -10 }),
            onActive: function (b) {
              b.scene.shake(0.005, 160);
              b.scene.addProjectile({ x: b.x + b.facing * 70, y: b.y, vx: b.facing * 600, w: 96, h: 58, life: 1.6, dmg: 14, team: 'foe', kind: 'flame' });
            } },

          { id: 'fury', phase: 2, then: 'fury2', windup: 300, active: 100, recover: 40, dmg: 12, reach: 146, off: 10, top: -150, bot: 0, kb: 240, lunge: 300,
            range: [0, 210], weight: 1.3, tags: { light: 0.6, passive: 0.2 }, tell: 0xff4a2a,
            wind: SWEEP_WIND, hit: SWEEP_HIT, smear: { r: 120, a0: 40, a1: -110, w: 14 } },
          { id: 'fury2', chainOnly: true, then: 'fury3', windup: 170, active: 100, recover: 40, dmg: 12, reach: 150, off: 10, top: -150, bot: 0, kb: 240, lunge: 320,
            wind: OVER_HIT, hit: SWEEP_WIND, smear: { r: 122, a0: -120, a1: 50, w: 14 } },
          { id: 'fury3', chainOnly: true, windup: 280, active: 130, recover: 620, dmg: 20, reach: 160, off: 10, top: -156, bot: 0, kb: 460, lunge: 380, tell: 0xffd27a,
            wind: OVER_WIND, hit: OVER_HIT, smear: { r: 134, a0: -145, a1: 75, w: 20 } }
        ]
      });
      b.facing = -1;
      return b;
    },

    onStart: function (scene) { scene.say(TG.Dialogue.warden.intro); },
    onPhase2: function (b) { b.scene.say(TG.Dialogue.warden.phase2); },
    onDefeated: function (scene) { scene.say(TG.Dialogue.warden.defeat); }
  });
})();
