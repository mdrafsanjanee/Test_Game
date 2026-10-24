// Global namespace and registries. Everything in the game hangs off window.TG.
window.TG = {
  TITLE: 'Test_Game',
  W: 1280,
  H: 720,
  GRAVITY: 2300,

  areas: {},       // id -> area definition      (see docs/ARCHITECTURE.md)
  bosses: {},      // id -> boss definition
  cutscenes: {},   // id -> function(scene, done)
  sequence: ['warden', 'mirror'], // main run order. Items: a boss id, or 'cut:<cutsceneId>'. Agent B edits this via js/data/sequence.js

  registerArea: function (id, def) { def.id = id; this.areas[id] = def; },
  registerBoss: function (id, def) { def.id = id; this.bosses[id] = def; },
  registerCutscene: function (id, fn) { this.cutscenes[id] = fn; },

  // Dev switches. URL: ?god=1 (no damage), ?bot=1 (AI plays the hero), ?fps=1
  debug: { fps: false, god: false, bot: false, scene: null }
};

(function () {
  var q = new URLSearchParams(location.search);
  TG.debug.god = q.get('god') === '1';
  TG.debug.bot = q.get('bot') === '1';
  TG.debug.fps = q.get('fps') === '1';
  TG.debug.boss = q.get('boss') || null;
})();
