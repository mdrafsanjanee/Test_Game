"""Character close-ups. Usage: python3 tools/cast.py outprefix [zoom]
Loads each fight, steps a few fixed frames, zooms the camera on the boss and on the hero and saves PNGs (<prefix>_<boss>_foe.png / _hero.png)."""
import sys, http.server, threading, socketserver, functools, os
from playwright.sync_api import sync_playwright
prefix = sys.argv[1] if len(sys.argv) > 1 else 'cast'
zoom = float(sys.argv[2]) if len(sys.argv) > 2 else 2.4
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(H, directory=root))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for boss in ('ash_husk', 'girl_guard', 'warden', 'mirror'):
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.goto(f'http://127.0.0.1:{port}/index.html?boss={boss}&god=1&cine=0')
        pg.wait_for_function("() => { const s = TG_GAME.scene.getScene('Arena'); return s && s.boss && s.scene.isActive(); }")
        pg.evaluate("() => TG_GAME.loop.sleep()")
        for who in ('foe', 'hero'):
            pg.evaluate("""(who) => {
              const s = TG_GAME.scene.getScene('Arena'), c = s.cameras.main, f = who === 'foe' ? s.boss : s.player;
              s.freeze = 0; window.__now = window.__now || performance.now();
              for (let i = 0; i < 24; i++) { window.__now += 50; TG_GAME.step(window.__now, 50); }
              s.updateCamera = function () {};                       // we steer the camera ourselves
              c.setZoom(%f); c.centerOn(f.x, f.y - 60);
              window.__now += 16; TG_GAME.step(window.__now, 16);
            }""" % zoom, who)
            pg.wait_for_timeout(150)
            pg.screenshot(path=f'{prefix}_{boss}_{who}.png')
        pg.close()
    b.close()
print('\n'.join(errs[:10]) if errs else 'no page errors')
