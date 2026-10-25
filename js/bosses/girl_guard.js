// Mid-boss for the ruins: the Hollow Attendant (Agent B).
// A court servant who kept sweeping the palace after it fell. Nothing like the Warden:
// fast, light, no big weapon. Twin claws, blink steps behind you, retreat-and-pounce, a spin.
// Counters: slip (spamming J: it vanishes behind you), quick counter (spamming K), rise (jump spam),
// pounce and blink (standing still), whirl (stays active on both sides, punishes rolling in), blink (dodging).
(function () {
  var W = TG.Pose.make, U = TG.U;

  var CLAW_A = W({ lean: -12, hipF: 18, kneeF: -12, hipB: -26, kneeB: -18, shF: -60, elF: 40, shB: -30, elB: 30, wpn: 0, head: 4 });
  var CLAW_A_HIT = W({ lean: 30, hipF: 40, kneeF: -20, hipB: -50, kneeB: -14, shF: 90, elF: 4, shB: 60, elB: 20, wpn: -6, head: -10 });
  var CLAW_B = W({ lean: 14, hipF: 30, kneeF: -26, hipB: -30, kneeB: -24, shF: 130, elF: -10, shB: -60, elB: 20, wpn: 20, head: 6 });
  var CLAW_B_HIT = W({ lean: 36, hipF: 54, kneeF: -34, hipB: -56, kneeB: -20, shF: 60, elF: 6, shB: 90, elB: 10, wpn: -8, head: -12 });
  var CROUCH = W({ lean: 24, hipF: 46, kneeF: -70, hipB: -26, kneeB: -64, shF: 40, elF: 70, shB: 20, elB: 80, wpn: -30, head: 10, dy: -2 });
  var DIVE = W({ lean: 56, hipF: 60, kneeF: -30, hipB: -70, kneeB: -50, shF: 100, elF: 4, shB: 80, elB: 6, wpn: 0, head: -18, rot: 28 });
  var ARMS_OUT = W({ lean: -6, hipF: 20, kneeF: -18, hipB: -20, kneeB: -18, shF: -85, elF: 10, shB: 85, elB: -10, wpn: -10, head: 0 });
  var ARMS_SPIN = W({ lean: 10, hipF: 28, kneeF: -24, hipB: -28, kneeB: -24, shF: 92, elF: 0, shB: 92, elB: 0, wpn: 0, head: 0 });
  var FADE = W({ lean: -4, hipF: 10, kneeF: -8, hipB: -12, kneeB: -10, shF: 10, elF: 20, shB: 10, elB: 20, wpn: 0, head: 0 });
  var RISE_WIND = W({ lean: 14, hipF: 34, kneeF: -40, hipB: -30, kneeB: -40, shF: -64, elF: 0, shB: -40, elB: 10, wpn: -20, head: 6 });
  var RISE_HIT = W({ lean: -10, hipF: 20, kneeF: -10, hipB: -20, kneeB: -14, shF: 176, elF: -8, shB: 150, elB: 0, wpn: 8, head: -14 });

  // Vanish and reappear on the other side of the player (used by blink and slip).
  function teleport(b, p) {
    var w = b.scene.world, side = b.x < p.x ? 1 : -1, nx = p.x + side * 120;
    if (nx > w.right || nx < w.left) { side = -side; nx = p.x + side * 120; }
    b.scene.fx.ring(b.x, b.y - 60, 6, 70, 0xcfe4ff, 0.3, 3);
    b.x = U.clamp(nx, w.left, w.right);
    b.facing = -side;
    b.vx = 0;
    b.scene.fx.ring(b.x, b.y - 60, 40, 8, 0xcfe4ff, 0.3, 3);
  }

  // Tattered ribbons trailing from the shoulders. Pure decoration, drawn after the body.
  function ribbons(b) {
    var s = b.rigCfg.scale, f = b.facing, g = b.g, t = b.time, p = TG.Rig.kin(b.pose, b.rigCfg, f), i;
    var sx = b.x + p.sh.x, sy = b.y + p.sh.y;
    for (i = 0; i < 3; i++) {
      var ex = sx - f * (30 + i * 14) * s + Math.sin(t * 4 + i) * 5 * s - b.vx * 0.04;
      var ey = sy + (12 + i * 15) * s + Math.cos(t * 3 + i) * 4 * s;
      g.fillStyle(0x0a1018, 0.95);
      g.fillTriangle(sx, sy, sx, sy + 12 * s, ex, ey);
      g.lineStyle(2, 0x9fd0e0, 0.5);
      g.lineBetween(sx, sy, ex, ey);
    }
    g.lineStyle(3, 0xd8e8f0, 0.9);                               // the back-hand claw
    g.lineBetween(b.x + p.hnB.x, b.y + p.hnB.y, b.x + p.hnB.x + f * 20 * s, b.y + p.hnB.y + 18 * s);
  }

  TG.registerBoss('girl_guard', {
    name: 'The Hollow Attendant',
    area: 'ruins',
    deathText: 'The ruins keep their own.',

    decision: {
      prompt: 'The Attendant folds to the floor like a dropped ribbon. Behind a broken door, someone is humming.',
      spare: 'Step back',
      kill: 'End it',
      after: {
        spare: 'The humming stops, then starts again, softer.',
        kill: 'The halls are quiet now. Nobody sweeps them.'
      }
    },

    create: function (scene, x, y) {
      var b = new TG.Boss(scene, x, y, this, {
        hp: 360, speed: 330, pref: [90, 200], phaseAt: 0.5, poise: 70, intro: 2.2, w: 40, h: 124,
        think: [0.25, 0.6],
        rig: { scale: 1.25, limb: 4.8, torsoW: 8.5, rim: 0x9fd0e0, rimA: 0.55, rimW: 3.5, eye: 0xcfeeff,
               trails: [                                                          // a servant's look: kerchief knotted at the head, apron strings at the back
                 { at: 'head', dx: -5, dy: -4, n: 4, seg: 8, w: 9, color: 0x8fb0c4, edge: 0x4a6a80, k: 18, kd: 2.6, back: 0.9, fall: 0.5, wave: 2, fork: true },
                 { at: 'head', dx: -3, dy: -6, n: 3, seg: 7, w: 8, color: 0x6a8aa0, edge: 0x4a6a80, k: 20, kd: 2.6, back: 0.7, fall: 0.8, wave: 2.4, ph: 1.5, fork: true },
                 { at: 'hip', dx: -3, dy: -5, n: 4, seg: 9, w: 8, color: 0xb8d0dc, edge: 0x4a6a80, k: 16, kd: 2.4, back: 0.9, fall: 0.6, wave: 2.2, ph: 0.8, fork: true },
                 { at: 'hip', dx: -2, dy: -3, n: 4, seg: 8, w: 7, color: 0x8fb0c4, edge: 0x4a6a80, k: 18, kd: 2.4, back: 0.6, fall: 0.9, wave: 2.6, ph: 2.4, fork: true }
               ],
               weapon: { len: 52, w: 3.4, color: 0xd8e8f0 } },
        attacks: [
          // Three quick claws. The last one is slower and committed: the opening to hit back.
          { id: 'claw', windup: 240, active: 90, recover: 150, dmg: 9, reach: 112, off: 6, top: -120, bot: -6, kb: 200, lunge: 260,
            range: [0, 170], weight: 1.4, tags: { light: 0.8 }, then: 'claw2', tell: 0xcfe4ff,
            wind: CLAW_A, hit: CLAW_A_HIT, smear: { r: 90, a0: -70, a1: 40, w: 9 }, smearColor: 0xcfe4ff },
          { id: 'claw2', chainOnly: true, windup: 130, active: 90, recover: 160, dmg: 9, reach: 112, off: 6, top: -120, bot: -6, kb: 200, lunge: 280, then: 'claw3',
            wind: CLAW_B, hit: CLAW_B_HIT, smear: { r: 90, a0: 60, a1: -80, w: 9 }, smearColor: 0xcfe4ff },
          { id: 'claw3', chainOnly: true, windup: 210, active: 100, recover: 560, dmg: 14, reach: 126, off: 6, top: -124, bot: -6, kb: 380, lunge: 340, tell: 0xffd27a,
            wind: CLAW_A, hit: CLAW_A_HIT, smear: { r: 104, a0: -120, a1: 60, w: 14 }, smearColor: 0xcfe4ff },

          // Blink: vanishes, reappears behind you, stabs. Punishes standing still and dodging.
          { id: 'blink', windup: 360, active: 60, recover: 80, dmg: 0, then: 'backstab',
            range: [140, 520], weight: 1.0, tags: { evade: 1.4, passive: 0.9 }, tell: 0xcfe4ff,
            wind: FADE, hit: FADE,
            onActive: function (b, p) { teleport(b, p); } },
          { id: 'backstab', chainOnly: true, windup: 190, active: 110, recover: 560, dmg: 15, reach: 120, off: 6, top: -120, bot: -6, kb: 360, lunge: 380, tell: 0xffd27a,
            wind: CLAW_B, hit: CLAW_B_HIT, smear: { r: 100, a0: -20, a1: 20, w: 12 }, smearColor: 0xcfe4ff },

          // Slip: the answer to button-mashing J. It is simply not there when you swing.
          { id: 'slip', windup: 110, active: 40, recover: 60, dmg: 0, then: 'backstab',
            range: [0, 190], weight: 0.4, tags: { light: 3.0 }, tell: 0x9ab4d8,
            cond: function () { return TG.Record.rate('light', 4) > 0.6; },
            wind: FADE, hit: FADE,
            onActive: function (b, p) { teleport(b, p); } },

          // Retreats a few steps, then dives in. Punishes standing still at range.
          { id: 'feint', windup: 280, active: 220, recover: 60, dmg: 0, then: 'pounce',
            range: [60, 260], weight: 0.7, tags: { evade: 0.6, passive: 0.5 }, tell: 0xcfe4ff,
            wind: CROUCH, hit: CROUCH,
            onActive: function (b) { b.vx = -b.facing * 850; } },
          { id: 'pounce', windup: 420, active: 300, recover: 560, dmg: 15, reach: 124, off: 20, top: -110, bot: -10, kb: 400, lunge: 1150,
            range: [220, 560], weight: 1.0, tags: { passive: 1.3 }, tell: 0xffd27a,
            wind: CROUCH, hit: DIVE, smear: { r: 100, a0: -15, a1: 15, w: 11 }, smearColor: 0xcfe4ff },

          // Quick counter: fast enough to beat a slow heavy swing (K) that is still winding up.
          { id: 'counter', windup: 150, active: 90, recover: 420, dmg: 13, reach: 118, off: 6, top: -122, bot: -6, kb: 320, lunge: 300,
            range: [0, 200], weight: 0.3, tags: { heavy: 3.0 }, tell: 0xff9a9a,
            cond: function () { return TG.Record.rate('heavy', 8) > 0.12; },
            wind: CLAW_B, hit: CLAW_B_HIT, smear: { r: 90, a0: -20, a1: 30, w: 10 }, smearColor: 0xcfe4ff },

          // Whirl: hits both sides and stays active, so rolling or dashing into it gets punished.
          { id: 'whirl', windup: 380, active: 360, recover: 520, dmg: 11, reach: 190, off: -95, top: -92, bot: 0, kb: 320,
            range: [0, 170], weight: 0.8, tags: { evade: 1.6 }, tell: 0xffd27a,
            wind: ARMS_OUT, hit: ARMS_SPIN, smear: { r: 120, a0: -30, a1: 30, w: 11 }, smearY: -50, smearColor: 0xcfe4ff },

          // Anti-air: used when the player keeps jumping.
          { id: 'rise', windup: 260, active: 140, recover: 460, dmg: 12, reach: 120, off: 0, top: -270, bot: -24, kb: 360,
            range: [0, 180], weight: 0.25, tags: { air: 2.6 }, tell: 0x9ad0ff,
            cond: function (b, p) { return !p.grounded || TG.Record.airFrac() > 0.3; },
            wind: RISE_WIND, hit: RISE_HIT, smear: { r: 130, a0: 75, a1: -135, w: 12 }, smearColor: 0xcfe4ff },

          // Phase 2: a faster claw flurry that ends in a blink.
          { id: 'frenzy', phase: 2, then: 'frenzy2', windup: 200, active: 90, recover: 30, dmg: 8, reach: 112, off: 6, top: -120, bot: -6, kb: 200, lunge: 330,
            range: [0, 230], weight: 1.5, tags: { light: 0.4, passive: 0.3 }, tell: 0xff9a9a,
            wind: CLAW_A, hit: CLAW_A_HIT, smear: { r: 90, a0: -70, a1: 40, w: 9 }, smearColor: 0xcfe4ff },
          { id: 'frenzy2', chainOnly: true, then: 'frenzy3', windup: 110, active: 90, recover: 30, dmg: 8, reach: 112, off: 6, top: -120, bot: -6, kb: 200, lunge: 330,
            wind: CLAW_B, hit: CLAW_B_HIT, smear: { r: 90, a0: 60, a1: -80, w: 9 }, smearColor: 0xcfe4ff },
          { id: 'frenzy3', chainOnly: true, then: 'blink', windup: 110, active: 90, recover: 60, dmg: 10, reach: 116, off: 6, top: -120, bot: -6, kb: 260, lunge: 340,
            wind: CLAW_A, hit: CLAW_A_HIT, smear: { r: 94, a0: -90, a1: 50, w: 10 }, smearColor: 0xcfe4ff }
        ]
      });
      b.facing = -1;
      var base = TG.Boss.prototype.draw;
      b.draw = function () { base.call(this); ribbons(this); };
      return b;
    },

    onStart: function (scene) {
      TG.Story.flag('met_ruin_defenders', true);
      scene.say(TG.Dialogue.girl_guard.intro);
    },
    onPhase2: function (b) { b.scene.say(TG.Dialogue.girl_guard.phase2); },
    onDefeated: function (scene) { scene.say(TG.Dialogue.girl_guard.defeat); }
  });
})();
