// On-screen touch controls. The buttons send ordinary key events, so the game does not know the difference
// between a keyboard and a phone: every scene works unchanged. Shown only on touch devices (or ?touch=1).
(function () {
  var q = new URLSearchParams(location.search);
  var isTouch = q.get('touch') === '1' || (q.get('touch') !== '0' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && matchMedia('(pointer: coarse)').matches);
  if (!isTouch) return;

  var KEYS = {
    left:  ['a', 'KeyA', 65, '◀'],   right: ['d', 'KeyD', 68, '▶'],   down: ['s', 'KeyS', 83, '▼'],
    up:    ['w', 'KeyW', 87, '⤒', 'jump'],
    light: ['j', 'KeyJ', 74, '⚔', 'strike'], heavy: ['k', 'KeyK', 75, '⚒', 'heavy'],
    dash:  ['l', 'KeyL', 76, '»', 'dash'],   roll:  ['i', 'KeyI', 73, '⟳', 'roll'],
    heal:  ['h', 'KeyH', 72, '✚', 'heal'],  pause: ['p', 'KeyP', 80, 'II'],
    ok:    ['Enter', 'Enter', 13, 'OK'],     skip:  ['Enter', 'Enter', 13, 'Skip ▶▶'],
    mirror:['m', 'KeyM', 77, 'Mirror']
  };
  var CLS = { down: 'sm', pause: 'sm', skip: 'sm wide', ok: 'wide', mirror: 'wide' };

  function fire(type, name) {
    var k = KEYS[name];
    var e = new KeyboardEvent(type, { key: k[0], code: k[1], keyCode: k[2], which: k[2], bubbles: true, cancelable: true });
    window.dispatchEvent(e);
  }

  function build() {
    document.body.classList.add('touch-on');
    var root = document.createElement('div'); root.id = 'touch';
    Object.keys(KEYS).forEach(function (name) {
      var k = KEYS[name], b = document.createElement('div');
      b.id = 'tb-' + name; b.className = 'tb ' + (CLS[name] || '');
      b.innerHTML = k[3] + (k[4] ? '<small>' + k[4] + '</small>' : '');
      b.style.flexDirection = 'column';
      var down = {};
      function press(ev) { ev.preventDefault(); down[ev.pointerId] = 1; b.classList.add('on'); try { b.setPointerCapture(ev.pointerId); } catch (x) {} fire('keydown', name); }
      function release(ev) { if (!down[ev.pointerId]) return; delete down[ev.pointerId]; b.classList.remove('on'); fire('keyup', name); }
      b.addEventListener('pointerdown', press);
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, release); });
      b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
      root.appendChild(b);
    });
    // fullscreen toggle
    var fs = document.createElement('div'); fs.id = 'tb-full'; fs.className = 'tb sm'; fs.textContent = '⛶';
    fs.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      var d = document, el = d.documentElement;
      if (d.fullscreenElement) d.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().then(function () { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); }).catch(function () {});
    });
    root.appendChild(fs);
    document.body.appendChild(root);
    var rot = document.createElement('div'); rot.id = 'rotate'; rot.textContent = 'Turn your phone sideways to play.';
    document.body.appendChild(rot);

    // tell the CSS which scene is up
    setInterval(function () {
      var g = window.TG_GAME; if (!g) return;
      var act = g.scene.getScenes(true)[0];
      document.body.setAttribute('data-scene', act ? act.sys.settings.key : '');
    }, 150);
    // a release is never lost when the finger slides away or the tab hides
    window.addEventListener('blur', function () { Object.keys(KEYS).forEach(function (n) { fire('keyup', n); }); });
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
