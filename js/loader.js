// Loads every script listed in the two manifests, in order, then starts the game.
// No bundler, so the project also runs by double-clicking index.html.
(function () {
  var files = []
    .concat(window.TG_MANIFEST_CORE || [])
    .concat(window.TG_MANIFEST_CONTENT || [])
    .concat(['js/main.js']);

  function next(i) {
    if (i >= files.length) return;
    var s = document.createElement('script');
    s.src = files[i];
    s.onload = function () { next(i + 1); };
    s.onerror = function () {
      var b = document.getElementById('boot');
      if (b) b.textContent = 'Failed to load ' + files[i];
      console.error('Failed to load', files[i]);
    };
    document.body.appendChild(s);
  }
  next(0);
})();
