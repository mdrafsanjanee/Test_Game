// Input sources. Players and the Mirror both read the same interface, so the
// Mirror is literally the same fighter driven by an AI "controller".
//   ctrl.move            -1 / 0 / 1
//   ctrl.held(action)    is the action currently held
//   ctrl.peek(action,ms) was it pressed within the last ms (does not consume)
//   ctrl.pressed(action,ms)  same, but consumes the press
// Actions: up (jump), down, light, heavy, dash, roll, heal (hold)

TG.Ctrl = function () {
  this.move = 0;
  this._held = {};
  this._t = {};
  this.now = 0;
};

TG.Ctrl.prototype = {
  held: function (a) { return !!this._held[a]; },
  peek: function (a, ms) {
    var t = this._t[a];
    return t !== undefined && this.now - t <= ms;
  },
  pressed: function (a, ms) {
    if (this.peek(a, ms)) { this._t[a] = -1e9; return true; }
    return false;
  },
  press: function (a) { this._t[a] = this.now; },
  hold: function (a, v) { this._held[a] = !!v; },
  clear: function () { this.move = 0; this._held = {}; this._t = {}; },
  update: function () {}
};

TG.KeyboardCtrl = function (scene) {
  TG.Ctrl.call(this);
  var K = Phaser.Input.Keyboard.KeyCodes, kb = scene.input.keyboard;
  var map = {
    left: [K.A, K.LEFT], right: [K.D, K.RIGHT],
    up: [K.W, K.UP, K.SPACE], down: [K.S, K.DOWN],
    light: [K.J, K.Z], heavy: [K.K, K.X], dash: [K.L, K.C, K.SHIFT], roll: [K.I, K.V, K.CTRL], heal: [K.H]
  };
  this.keys = {};
  for (var a in map) this.keys[a] = map[a].map(function (c) { return kb.addKey(c); });
  this.scene = scene;
};
TG.KeyboardCtrl.prototype = Object.create(TG.Ctrl.prototype);
TG.KeyboardCtrl.prototype.constructor = TG.KeyboardCtrl;

TG.KeyboardCtrl.prototype.isDown = function (a) {
  var ks = this.keys[a];
  for (var i = 0; i < ks.length; i++) if (ks[i].isDown) return true;
  return false;
};
TG.KeyboardCtrl.prototype.update = function (now) {
  this.now = now;
  var Kb = Phaser.Input.Keyboard, a, i, ks;
  for (a in this.keys) {
    ks = this.keys[a];
    for (i = 0; i < ks.length; i++) if (Kb.JustDown(ks[i])) this._t[a] = now;
    this._held[a] = this.isDown(a);
  }
  this.move = (this._held.right ? 1 : 0) - (this._held.left ? 1 : 0);
};
