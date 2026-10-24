// Tiny physics world: a flat ground, one-way platforms, optional pits, side bounds.
TG.World = function (area) {
  this.area = area;
  this.groundY = area.groundY;
  this.left = area.bounds ? area.bounds.left : 40;
  this.right = area.bounds ? area.bounds.right : area.width - 40;
  this.platforms = area.platforms || [];
  this.pits = area.pits || [];
  this.fallY = (area.height || TG.H) + 260;
};

TG.World.prototype = {
  hasGround: function (x) {
    for (var i = 0; i < this.pits.length; i++) {
      if (x > this.pits[i].x && x < this.pits[i].x + this.pits[i].w) return false;
    }
    return true;
  },

  move: function (f, dt) {
    f.x += f.vx * dt;
    if (f.x < this.left) { f.x = this.left; if (f.vx < 0) f.vx = 0; }
    if (f.x > this.right) { f.x = this.right; if (f.vx > 0) f.vx = 0; }

    var prevY = f.y;
    f.y += f.vy * dt;
    var wasGrounded = f.grounded;
    f.grounded = false;
    f.onPlatform = false;
    if (f.dropT > 0) f.dropT -= dt;

    if (f.vy >= 0) {
      if (f.dropT <= 0) {
        for (var i = 0; i < this.platforms.length; i++) {
          var p = this.platforms[i];
          if (f.x > p.x && f.x < p.x + p.w && prevY <= p.y + 6 && f.y >= p.y) {
            f.y = p.y; f.vy = 0; f.grounded = true; f.onPlatform = true;
            break;
          }
        }
      }
      if (!f.grounded && this.hasGround(f.x) && f.y >= this.groundY && prevY <= this.groundY + 6) {
        f.y = this.groundY; f.vy = 0; f.grounded = true;
      }
    }
    if (f.grounded && !wasGrounded && f.onLand) f.onLand();
    if (f.y > this.fallY && f.onFall) f.onFall();
  }
};
