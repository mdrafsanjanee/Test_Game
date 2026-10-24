// Base class for anything that fights: the hero, the Mirror, every boss.
TG.Fighter = function (scene, x, y, cfg) {
  this.scene = scene;
  this.x = x; this.y = y; this.vx = 0; this.vy = 0;
  this.facing = 1;
  this.cfg = cfg;
  this.rigCfg = Object.assign({}, TG.Rig.defaults, cfg.rig || {});
  this.rigCfg.weapon = Object.assign({}, TG.Rig.defaults.weapon, (cfg.rig && cfg.rig.weapon) || {});
  this.maxHp = cfg.hp || 100;
  this.hp = this.maxHp;
  this.w = cfg.w || 30;
  this.h = cfg.h || 84;
  this.team = cfg.team || 'hero';
  this.grounded = false;
  this.onPlatform = false;
  this.dead = false;
  this.invuln = 0;      // seconds of invulnerability
  this.iframe = false;  // dash/roll i-frames
  this.flash = 0;
  this.dropT = 0;
  this.floaty = false;  // ignore gravity (air dash, boss hover)
  this.gravityScale = 1;
  this.time = Math.random() * 10;
  this.pose = TG.Pose.make();
  this.g = scene.add.graphics().setDepth(cfg.depth || 10);
};

TG.Fighter.prototype = {
  get hurt() { return { l: this.x - this.w / 2, r: this.x + this.w / 2, t: this.y - this.h, b: this.y }; },
  get cx() { return this.x; },
  get cy() { return this.y - this.h * 0.55; },

  attackBox: function (d) {
    if (d.both) return { l: this.x - d.reach, r: this.x + d.reach, t: this.y + d.top, b: this.y + d.bot };
    var l = this.facing > 0 ? this.x + d.off : this.x - d.off - d.reach;
    return { l: l, r: l + d.reach, t: this.y + d.top, b: this.y + d.bot };
  },

  foes: function () {
    var me = this;
    return this.scene.fighters.filter(function (o) { return o.team !== me.team && !o.dead; });
  },

  physics: function (dt) {
    this.lastVy = this.vy;
    if (!this.floaty) this.vy += TG.GRAVITY * this.gravityScale * dt;
    if (this.vy > 1600) this.vy = 1600;
    this.scene.world.move(this, dt);
  },

  tickTimers: function (dt) {
    if (this.invuln > 0) this.invuln -= dt;
    if (this.flash > 0) this.flash -= dt;
    this.time += dt;
  },

  draw: function () {
    var g = this.g;
    g.clear();
    var blink = this.invuln > 0 && !this.dead && Math.floor(this.time * 18) % 2 === 0;
    var tint = this.flash > 0 ? 0xffffff : null;
    TG.Rig.draw(g, this.x, this.y, this.facing, this.pose, this.rigCfg, blink ? 0.45 : 1, tint);
  },

  destroy: function () { this.g.destroy(); },
  // Returns {reach} while this fighter has an attack that can currently hurt (used by AI to react)
  threat: function () { return null; },
  receiveHit: function () { return false; },
  update: function () {}
};
