"""Cutscene screenshot tester.
Usage: python3 tools/cine_test.py <cutscene id> "<query extras>" t1,t2,t3 outprefix
Jumps into ?cut=<id>, then drives the game loop BY HAND (fixed 50 ms frames, x16 fast-forward between shots), so the result does not
depend on how slow the GPU-less headless browser is. Times are cutscene seconds (scene.clock). Saves a PNG at each, prints console errors.
Example: python3 tools/cine_test.py cliff_betrayal "flag=picked_cursed_item" 10,20,30 /tmp/cb"""
import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright

cid = sys.argv[1]
extra = sys.argv[2] if len(sys.argv) > 2 else ''
times = [float(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '2,6').split(',')]
prefix = sys.argv[4] if len(sys.argv) > 4 else 'cine'
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(H, directory=root))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

STEP = """(t) => {
  const g = window.TG_GAME, s = g.scene.getScene('Cutscene');
  if (!s || !s.scene.isActive()) return 'gone';
  window.__now = window.__now || performance.now();
  for (let i = 0; i < 40 && s.clock < t - 0.02; i++) {
    s.ff = (t - s.clock > 2) ? 16 : 1; s.applyTime();
    window.__now += 50; g.step(window.__now, 50);
  }
  s.ff = 1; s.applyTime();
  return s.clock;
}"""

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?cut={cid}&{extra}')
    pg.wait_for_function("() => { const g = window.TG_GAME; const s = g && g.scene.getScene('Cutscene'); return s && s.clock !== undefined && s.scene.isActive(); }")
    pg.evaluate("() => TG_GAME.loop.sleep()")                 # from here on, only our steps advance the game
    for t in times:
        r = None
        while True:
            r = pg.evaluate(STEP, t)
            if r == 'gone' or r >= t - 0.02: break
        if r == 'gone':
            print(f'cutscene ended before {t}s'); break
        pg.wait_for_timeout(120)
        pg.screenshot(path=f'{prefix}_{t:g}.png')
    info = pg.evaluate("() => TG_GAME.scene.getScenes(true).map(s => s.scene.key)")
    print(json.dumps(info))
    b.close()
print('\n'.join(errs[:15]) if errs else 'no console errors')
