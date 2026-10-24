import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
boss = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss={boss}'); pg.wait_for_timeout(2500)
    # no bot: hero stands still and gets killed
    r = pg.evaluate("()=>{const a=TG_GAME.scene.getScene('Arena'); for(let i=0;i<60*120&&!a.over;i++) a.step(1/60); return {over:a.over, hp:a.player.hp, t:a.clock}}")
    print(r)
    pg.wait_for_timeout(6500)
    print(pg.evaluate("()=>({scenes:TG_GAME.scene.getScenes(true).map(s=>s.scene.key), deaths:TG.Record.save.deaths, fights:TG.Record.save.fights.length, text: (TG_GAME.scene.getScene('Death').children.list.find(c=>c.text)||{}).text})"))
    pg.screenshot(path=f'/tmp/claude-0/death_{boss}.png')
    print(errs or 'no errors'); b.close()
