const CombatRecord = (() => {
  const MAX_FIGHTS = 5;
  let fights = [], current = null;
  function beginFight() { current = { light:0, heavy:0, dashes:0, rolls:0, damageDealt:0, duration:0 }; }
  function note(a) { if (current && a in current) current[a]++; }
  function noteDamage(d) { if (current) current.damageDealt += d; }
  function endFight(t) { if (!current) return; current.duration = t; fights.push(current); if (fights.length > MAX_FIGHTS) fights.shift(); current = null; }
  function lastN(n) { return fights.slice(-n); }
  function dominantAction() {
    const totals = { light:0, heavy:0, dashes:0, rolls:0 };
    for (const f of fights) for (const k in totals) totals[k] += f[k];
    let best = 'light', v = -1;
    for (const k in totals) if (totals[k] > v) { v = totals[k]; best = k; }
    return { action: best, total: v, totals };
  }
  return { beginFight, note, noteDamage, endFight, lastN, dominantAction, get fights() { return fights; } };
})();
