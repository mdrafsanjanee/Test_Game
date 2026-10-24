// Audio: all music and sound effects are SYNTHESIZED in the browser with the Web Audio API.
// Nothing is sampled or downloaded, so there is nothing to license, and the music can react to the fight
// (phase 2 changes tempo and layers). Cost: a few dozen short oscillator/noise nodes per second.
//
// To use real recordings instead (e.g. CC0 tracks), drop files in assets/music/ and map them in
// js/data/music_files.js:  TG.MUSIC_FILES = { warden: 'assets/music/warden.ogg', warden_p2: '...' };
// A file always wins over the synthesized track of the same id.
//
//   TG.Music.play('warden')   TG.Music.phase(2)   TG.Music.fadeOut(ms)   TG.Music.toggleMute()   (key: N)
//   TG.Sfx.play('hit')
(function () {
  var ctx = null, master, musicBus, sfxBus, noiseBuf, muted = false, cur = null, fileEl = null, lastSfx = {};
  TG.MUSIC_FILES = TG.MUSIC_FILES || {};

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.85;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.85; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    var n = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, n, n);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); }
  ['keydown', 'pointerdown', 'touchstart'].forEach(function (e) { window.addEventListener(e, unlock, { passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  window.addEventListener('keydown', function (e) { if (e.code === 'KeyN' && !e.repeat) TG.Music.toggleMute(); });

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---- building blocks --------------------------------------------------------------------------
  // tone: type, freq (or [from,to] glide), start, dur, peak gain, destination, {lp, att, detune}
  function tone(type, f, t, dur, vol, dest, o) {
    o = o || {};
    var osc = ctx.createOscillator(), g = ctx.createGain(), att = o.att || 0.005;
    osc.type = type;
    if (Array.isArray(f)) { osc.frequency.setValueAtTime(f[0], t); osc.frequency.exponentialRampToValueAtTime(Math.max(1, f[1]), t + dur); }
    else osc.frequency.setValueAtTime(f, t);
    if (o.detune) osc.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var out = osc;
    if (o.lp) { var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; osc.connect(lp); out = lp; }
    out.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  // noise burst through a filter (type 'lowpass'|'highpass'|'bandpass'), cutoff may glide
  function noise(t, dur, vol, dest, ftype, f0, f1, q) {
    var src = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    src.buffer = noiseBuf; src.loop = true;
    fl.type = ftype || 'lowpass'; fl.Q.value = q || 0.7;
    fl.frequency.setValueAtTime(f0 || 2000, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  function kick(t, dest, vol, deep) { tone('sine', [deep ? 95 : 140, 38], t, deep ? 0.34 : 0.22, vol, dest); noise(t, 0.02, vol * 0.4, dest, 'lowpass', 900); }
  function snare(t, dest, vol) { noise(t, 0.14, vol, dest, 'bandpass', 1800, 900, 0.9); tone('triangle', [220, 130], t, 0.09, vol * 0.5, dest); }
  function hat(t, dest, vol) { noise(t, 0.035, vol, dest, 'highpass', 7500); }
  function chord(type, notes, t, dur, vol, dest, o) { for (var i = 0; i < notes.length; i++) tone(type, hz(notes[i]), t, dur, vol / notes.length * 1.6, dest, o); }

  // ---- sound effects -----------------------------------------------------------------------------
  var SFX = {
    swing: function (t, v) { noise(t, 0.1, 0.16 * v, sfxBus, 'bandpass', 700, 2600, 1.2); },
    swing_heavy: function (t, v) { noise(t, 0.2, 0.26 * v, sfxBus, 'bandpass', 380, 1800, 1); tone('sine', [160, 70], t, 0.18, 0.12 * v, sfxBus); },
    hit: function (t, v) { noise(t, 0.07, 0.3 * v, sfxBus, 'lowpass', 2600); tone('sine', [190, 70], t, 0.12, 0.34 * v, sfxBus); },
    hit_heavy: function (t, v) { noise(t, 0.14, 0.45 * v, sfxBus, 'lowpass', 2200); tone('sine', [130, 38], t, 0.3, 0.55 * v, sfxBus); tone('square', [420, 120], t, 0.06, 0.1 * v, sfxBus, { lp: 1500 }); },
    hurt: function (t, v) { tone('sawtooth', [260, 90], t, 0.22, 0.22 * v, sfxBus, { lp: 900 }); noise(t, 0.12, 0.25 * v, sfxBus, 'lowpass', 1500); },
    heal_ready: function (t, v) { tone('sine', [660, 990], t, 0.16, 0.2 * v, sfxBus); tone('sine', [990, 1320], t + 0.08, 0.2, 0.14 * v, sfxBus); },
    heal: function (t, v) { [523, 659, 784, 1047].forEach(function (f, i) { tone('sine', [f, f], t + i * 0.07, 0.5, 0.2 * v, sfxBus); }); },
    dash: function (t, v) { noise(t, 0.16, 0.2 * v, sfxBus, 'bandpass', 2400, 400, 0.8); },
    roll: function (t, v) { noise(t, 0.26, 0.16 * v, sfxBus, 'lowpass', 900, 300); },
    jump: function (t, v) { tone('sine', [300, 560], t, 0.09, 0.1 * v, sfxBus); },
    jump2: function (t, v) { tone('sine', [420, 880], t, 0.12, 0.1 * v, sfxBus); noise(t, 0.08, 0.05 * v, sfxBus, 'highpass', 4000); },
    tell: function (t, v) { tone('sine', 520, t, 0.1, 0.06 * v, sfxBus); },
    slam: function (t, v) { tone('sine', [78, 28], t, 0.55, 0.7 * v, sfxBus); noise(t, 0.4, 0.4 * v, sfxBus, 'lowpass', 700, 120); },
    roar: function (t, v) { tone('sawtooth', [120, 70], t, 0.9, 0.3 * v, sfxBus, { lp: 600, att: 0.12 }); tone('sawtooth', [128, 66], t, 0.9, 0.25 * v, sfxBus, { lp: 500, att: 0.12 }); noise(t, 0.9, 0.2 * v, sfxBus, 'lowpass', 500, 150); },
    reflect: function (t, v) { tone('sine', [900, 240], t, 0.3, 0.22 * v, sfxBus); tone('sine', [1350, 360], t, 0.3, 0.12 * v, sfxBus); noise(t, 0.1, 0.12 * v, sfxBus, 'highpass', 5000); },
    shatter: function (t, v) {
      noise(t, 0.5, 0.45 * v, sfxBus, 'highpass', 2500);
      tone('sine', [60, 25], t, 0.8, 0.6 * v, sfxBus);
      for (var i = 0; i < 16; i++) tone('sine', 1800 + Math.random() * 4800, t + Math.random() * 0.35, 0.25 + Math.random() * 0.4, 0.09 * v, sfxBus);
    },
    die: function (t, v) { tone('sawtooth', [200, 40], t, 0.9, 0.25 * v, sfxBus, { lp: 700 }); noise(t, 0.5, 0.2 * v, sfxBus, 'lowpass', 900, 100); },
    ui: function (t, v) { tone('sine', 660, t, 0.1, 0.12 * v, sfxBus); tone('sine', 990, t + 0.05, 0.14, 0.1 * v, sfxBus); }
  };
  TG.Sfx = {
    play: function (name, vol) {
      if (muted || !ensure() || ctx.state !== 'running' || !SFX[name]) return;
      var now = ctx.currentTime;
      if (lastSfx[name] && now - lastSfx[name] < 0.035) return;     // avoid stacking identical sounds
      lastSfx[name] = now;
      SFX[name](now, vol == null ? 1 : vol);
    }
  };

  // ---- music ---------------------------------------------------------------------------------------
  // Each track: bpm per phase, and step(i, t, sd, phase, bus) called once per 16th note.
  var TRACKS = {
    // quiet, cold ambience for menus and decisions
    menu: {
      bpm: [60, 60],
      step: function (i, t, sd, ph, bus) {
        var bar = Math.floor(i / 16) % 4, roots = [38, 34, 36, 33];
        if (i % 32 === 0) {
          var r = roots[bar];
          chord('sawtooth', [r, r + 7, r + 12, r + 15], t, 8, 0.22, bus, { lp: 420, att: 2.2, detune: 6 });
        }
        if (i % 8 === 4 && Math.random() < 0.55) tone('sine', hz([69, 74, 77, 81][Math.floor(Math.random() * 4)]), t, 3.2, 0.06, bus, { att: 0.01 });
        if (i % 64 === 0) noise(t, 6, 0.04, bus, 'lowpass', 300, 900, 0.5);
      }
    },

    // The Ashen Warden: heavy and tragic. Phase 2 doubles the pulse and adds a driving ostinato and a choir swell.
    warden: {
      bpm: [92, 122],
      step: function (i, t, sd, ph, bus) {
        var s = i % 16, bar = Math.floor(i / 16), b4 = bar % 4, roots = [38, 38, 34, 36];  // D D Bb C
        var r = roots[b4];
        var kicks = ph === 1 ? [0, 8] : [0, 6, 8, 11, 14];
        if (kicks.indexOf(s) >= 0) kick(t, bus, 0.55, true);
        if (s === 4 || s === 12) snare(t, bus, ph === 1 ? 0.2 : 0.28);
        if (ph === 2 && s === 15) snare(t, bus, 0.1);
        if (ph === 1 ? s % 4 === 2 : true) hat(t, bus, ph === 1 ? 0.05 : 0.06);
        // bass
        if (ph === 1 && s === 0) tone('sawtooth', hz(r - 12), t, sd * 14, 0.22, bus, { lp: 220, att: 0.04 });
        if (ph === 2 && s % 2 === 0) tone('sawtooth', hz(r - 12), t, sd * 1.8, 0.2, bus, { lp: 260 });
        // brass-like stabs on the one of odd bars
        if (s === 0 && (b4 === 0 || b4 === 2)) chord('sawtooth', [r + 12, r + 19, r + 24], t, sd * 6, 0.34, bus, { lp: 950, att: 0.03, detune: 9 });
        // tom fill before the loop turns
        if (b4 === 3 && (s === 13 || s === 14 || s === 15)) tone('sine', [160 - s * 3, 70], t, 0.18, 0.4, bus);
        if (ph === 2) {
          var arp = [0, 3, 7, 12, 7, 3, 0, 3, 7, 12, 15, 12, 7, 3, 7, 12];
          tone('square', hz(r + 24 + arp[s]), t, sd * 0.9, 0.05, bus, { lp: 1700 });
          if (s === 0 && b4 % 2 === 0) chord('sawtooth', [r + 12, r + 19, r + 24], t, sd * 30, 0.22, bus, { lp: 800, att: 1.4, detune: 14 });
        }
      }
    },

    // The Mirror. Phase 1: fast, bright, agile. Phase 2: slow and exposed, heartbeat and shimmer.
    mirror: {
      bpm: [138, 76],
      step: function (i, t, sd, ph, bus) {
        var s = i % 16, bar = Math.floor(i / 16), b4 = bar % 4;
        var roots = [45, 41, 43, 40];   // A F G E
        var r = roots[b4];
        if (ph === 1) {
          if (s % 4 === 0) kick(t, bus, 0.38, false);
          if (s === 4 || s === 12) snare(t, bus, 0.16);
          hat(t, bus, s % 2 ? 0.035 : 0.055);
          if (s % 2 === 0) tone('sawtooth', hz(r - 12), t, sd * 1.7, 0.16, bus, { lp: 340 });
          var pat = [0, 7, 12, 15, 12, 7, 12, 19, 15, 12, 7, 12, 15, 19, 24, 19];
          tone('triangle', hz(r + 12 + pat[s]), t, 0.28, 0.13, bus);
          if (s === 0) tone('sine', hz(r + 36), t, 1.1, 0.05, bus);         // glassy top note
        } else {
          if (s === 0 || s === 3) kick(t, bus, s === 0 ? 0.5 : 0.32, true);   // lub-dub
          if (s === 0 && b4 % 2 === 0) chord('sawtooth', [r, r + 7, r + 12, r + 13], t, sd * 30, 0.2, bus, { lp: 480, att: 1.8, detune: 10 });
          if (s === 0 && b4 === 3) tone('sine', [300, 1800], t, sd * 14, 0.07, bus, { att: sd * 12 });   // rising shimmer
          if (s === 8 || (s === 0 && b4 === 1)) tone('triangle', hz(r + 24 + [0, 7, 12, 3][b4]), t, 2.4, 0.12, bus);
          if (s === 0) noise(t, sd * 12, 0.025, bus, 'bandpass', 600, 1200, 1);
        }
      }
    }
  };

  function tick() {
    if (!cur || !ctx) return;
    var T = TRACKS[cur.id];
    if (!T) return;
    if (cur.next < ctx.currentTime - 0.1) cur.next = ctx.currentTime + 0.05;     // after a suspend: do not burst
    while (cur.next < ctx.currentTime + 0.35) {
      var bpm = T.bpm[cur.phase - 1] || T.bpm[0], sd = 60 / bpm / 4;
      T.step(cur.step, cur.next, sd, cur.phase, cur.bus);
      cur.step++; cur.next += sd;
    }
  }

  function killCur(fade) {
    if (!cur) return;
    var c = cur; cur = null;
    clearInterval(c.timer);
    if (ctx) {
      var t = ctx.currentTime;
      c.bus.gain.cancelScheduledValues(t);
      c.bus.gain.setValueAtTime(c.bus.gain.value, t);
      c.bus.gain.linearRampToValueAtTime(0.0001, t + fade);
      setTimeout(function () { try { c.bus.disconnect(); } catch (e) { /* ignore */ } }, fade * 1000 + 600);
    }
  }
  function stopFile(ms) {
    if (!fileEl) return;
    var el = fileEl; fileEl = null;
    var v = el.volume, n = 10, k = 0;
    var iv = setInterval(function () { k++; el.volume = Math.max(0, v * (1 - k / n)); if (k >= n) { clearInterval(iv); el.pause(); } }, Math.max(20, (ms || 400) / n));
  }

  TG.Music = {
    current: null,
    play: function (id) {
      if (cur && cur.id === id) return;
      if (this.current === id && fileEl) return;
      this.current = id;
      killCur(0.5); stopFile(500);
      var url = TG.MUSIC_FILES[id];
      if (url) {                                       // real recording supplied
        fileEl = new Audio(url); fileEl.loop = true; fileEl.volume = muted ? 0 : 0.5;
        fileEl.play().catch(function () {});
        return;
      }
      if (!ensure()) return;
      var bus = ctx.createGain();
      bus.gain.setValueAtTime(0.0001, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
      bus.connect(musicBus);
      cur = { id: id, phase: 1, step: 0, next: ctx.currentTime + 0.1, bus: bus };
      cur.timer = setInterval(tick, 40);
    },
    phase: function (n) {
      if (cur) cur.phase = n;
      else if (fileEl && this.current && TG.MUSIC_FILES[this.current + '_p' + n]) {
        var id = this.current;
        stopFile(300);
        fileEl = new Audio(TG.MUSIC_FILES[id + '_p' + n]); fileEl.loop = true; fileEl.volume = muted ? 0 : 0.5;
        fileEl.play().catch(function () {});
      }
    },
    fadeOut: function (ms) { this.current = null; killCur((ms || 1000) / 1000); stopFile(ms || 1000); },
    stop: function () { this.fadeOut(300); },
    pause: function (on) { if (!ctx) return; if (on) ctx.suspend(); else ctx.resume(); },
    toggleMute: function () {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.85;
      if (fileEl) fileEl.volume = muted ? 0 : 0.5;
      return muted;
    },
    get muted() { return muted; },
    // dev: returns an AnalyserNode on the final output (used by tools/audio_level.py)
    probe: function () { if (!ensure()) return null; var an = ctx.createAnalyser(); an.fftSize = 2048; master.connect(an); return an; }
  };
})();
