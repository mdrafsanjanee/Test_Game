"""Headless smoke test. Usage: python3 tools/smoke.py [query] [seconds] [shot.png]"""
import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright

q = sys.argv[1] if len(sys.argv) > 1 else ''
secs = float(sys.argv[2]) if len(sys.argv) > 2 else 5
shot = sys.argv[3] if len(sys.argv) > 3 else None
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
Handler = functools.partial(H, directory=root)
srv = socketserver.TCPServer(('127.0.0.1', 0), Handler)
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type in ('error', 'warning') else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?{q}')
    pg.wait_for_timeout(int(secs * 1000))
    info = pg.evaluate("""() => { const g = window.TG_GAME; if(!g) return null;
      const s = g.scene.getScenes(true).map(s=>s.scene.key);
      const a = g.scene.getScene('Arena');
      return {scenes:s, fps: Math.round(g.loop.actualFps), arena: a && a.player ? {hp:a.player.hp, bhp:a.boss.hp, bmode:a.boss.mode, pmode:a.player.mode, over:a.over, rec: TG.Record.live && TG.Record.live.counts} : null,
              saved: TG.Record.save.fights.length}; }""")
    print(json.dumps(info))
    if shot: pg.screenshot(path=shot)
    b.close()
print('\n'.join(errs[:15]) if errs else 'no console errors')
