// The run record. Logs how the player fights so the Mirror boss (and any ending)
// can use it. Persists to localStorage. Times are in SECONDS.
(function () {
  var KEY = 'tg_record_v1';
  function blank() { return { fights: [], flags: {}, decisions: {}, deaths: 0 }; }

  var R = TG.Record = {
    save: blank(),
    live: null,

    load: function () {
      try {
        var s = JSON.parse(localStorage.getItem(KEY));
        if (s && s.fights) this.save = Object.assign(blank(), s);
      } catch (e) { /* ignore */ }
    },
    persist: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.save)); } catch (e) { /* ignore */ }
    },
    reset: function () { this.save = blank(); this.persist(); },

    // ---- live fight tracking ------------------------------------------------
    begin: function (bossId) {
      this.live = {
        boss: bossId, t: 0, ev: [], counts: {}, sampleT: 0, samples: 0,
        dist: 0, air: 0, close: 0, airHist: [], combos: [], hits: 0, dealt: 0
      };
    },
    tick: function (dt, player, foe) {
      var L = this.live;
      if (!L || !player || !foe) return;
      L.t += dt;
      L.sampleT += dt;
      if (L.sampleT >= 0.1) {
        L.sampleT -= 0.1;
        var d = Math.abs(player.x - foe.x);
        L.samples++;
        L.dist += d;
        if (d < 130) L.close++;
        var a = player.grounded ? 0 : 1;
        L.air += a;
        L.airHist.push(a);
        if (L.airHist.length > 30) L.airHist.shift();
      }
    },
    ev: function (type) {
      var L = this.live;
      if (!L) return;
      L.counts[type] = (L.counts[type] || 0) + 1;
      L.ev.push({ t: L.t, type: type });
      if (L.ev.length > 240) L.ev.shift();
    },
    // events per second of `type` over the last `win` seconds
    rate: function (type, win) {
      var L = this.live;
      if (!L) return 0;
      var n = 0;
      for (var i = L.ev.length - 1; i >= 0; i--) {
        if (L.t - L.ev[i].t > win) break;
        if (L.ev[i].type === type) n++;
      }
      return n / Math.min(win, Math.max(L.t, 1));
    },
    airFrac: function () {
      var L = this.live;
      if (!L || !L.airHist.length) return 0;
      var s = 0;
      for (var i = 0; i < L.airHist.length; i++) s += L.airHist[i];
      return s / L.airHist.length;
    },
    comboEnd: function (len) {
      if (this.live && len > 0) this.live.combos.push(len);
    },
    dealt: function (dmg) { if (this.live) this.live.dealt += dmg; },
    hit: function () { if (this.live) this.live.hits++; },

    end: function (result) {
      var L = this.live;
      this.live = null;
      if (!L || L.t < 3) return;
      var c = L.counts, n = Math.max(L.samples, 1);
      var combo = L.combos.length
        ? L.combos.reduce(function (a, b) { return a + b; }, 0) / L.combos.length : 0;
      this.save.fights.push({
        boss: L.boss, res: result, dur: L.t,
        c: c, dist: L.dist / n, air: L.air / n, close: L.close / n,
        combo: combo, hits: L.hits, dealt: L.dealt
      });
      if (this.save.fights.length > 24) this.save.fights.shift();
      if (result === 'lose') this.save.deaths++;
      this.persist();
    },

    // ---- decisions ----------------------------------------------------------
    decide: function (bossId, choice) { this.save.decisions[bossId] = choice; this.persist(); },
    count: function (choice) {
      var d = this.save.decisions, n = 0;
      for (var k in d) if (d[k] === choice) n++;
      return n;
    },

    // ---- the profile the Mirror copies --------------------------------------
    // Aggregates the last `n` fights against anyone but the Mirror itself.
    profile: function (n) {
      n = n || 5;
      var def = { light: 1.3, heavy: 0.15, dash: 0.25, roll: 0.12, jump: 0.3, djump: 0.1,
                  dist: 170, air: 0.15, close: 0.4, combo: 2.2 };
      var use = this.save.fights.filter(function (f) { return f.boss !== 'mirror' && f.dur >= 4; }).slice(-n);
      if (!use.length) return Object.assign({ n: 0 }, def);

      var dur = 0, s = { light: 0, heavy: 0, dash: 0, roll: 0, jump: 0, djump: 0 };
      var dist = 0, air = 0, close = 0, combo = 0, comboN = 0;
      use.forEach(function (f) {
        dur += f.dur;
        for (var k in s) s[k] += (f.c[k] || 0);
        dist += f.dist * f.dur; air += f.air * f.dur; close += f.close * f.dur;
        if (f.combo > 0) { combo += f.combo; comboN++; }
      });
      var obs = {
        light: s.light / dur, heavy: s.heavy / dur, dash: s.dash / dur, roll: s.roll / dur,
        jump: s.jump / dur, djump: s.djump / dur,
        dist: dist / dur, air: air / dur, close: close / dur,
        combo: comboN ? combo / comboN : def.combo
      };
      var b = Math.min(1, use.length / 3), out = { n: use.length };
      for (var key in def) out[key] = def[key] + (obs[key] - def[key]) * b;
      return out;
    }
  };

  R.load();
})();
