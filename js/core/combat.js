// Hit resolution. One entry point: combat.melee(attacker, actState, attackDef).
// `actState.hit` is a Set so one swing can only hit each target once.
TG.Combat = function (scene) { this.s = scene; };

TG.Combat.prototype = {
  melee: function (att, act, d) {
    var box = att.attackBox(d), foes = att.foes();
    for (var i = 0; i < foes.length; i++) {
      var foe = foes[i];
      if (act.hit.has(foe)) continue;
      if (!TG.U.overlap(box, foe.hurt)) continue;

      var dmg = d.dmg * (att.dmgMul || 1), stale = 1;
      if (att.isHero && att.staleMult && d.id !== 'roll') stale = att.staleMult(d.id);
      dmg *= stale;

      var info = {
        dmg: dmg, poise: d.poise || 0, kbx: att.facing * (d.kb || 200),
        hitstop: d.hitstop || 60, shake: d.shake, stale: stale < 0.95, src: att, id: d.id
      };
      if (att.stuns && (d.id === 'l3' || d.id === 'hv')) info.stun = d.id === 'hv' ? 0.8 : 0.6;   // finishers can stun
      if (foe.receiveHit(info)) {
        act.hit.add(foe);
        if (TG.Sfx) TG.Sfx.play(d.dmg >= 20 ? 'hit_heavy' : 'hit');
        if (att.onDealt) att.onDealt(foe, info);
      }
    }
  }
};
