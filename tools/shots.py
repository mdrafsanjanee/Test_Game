import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
q = sys.argv[1]; want = sys.argv[2]  # 'hero' or 'boss' attack mode to catch
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720})
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html?{q}'); pg.wait_for_timeout(2500)
    for k in range(3):
        r = pg.evaluate("""(want) => { const a=TG_GAME.scene.getScene('Arena');
          for(let i=0;i<60*40;i++){ a.step(1/60); const c=a.player.act, bc=a.boss.cur;
            if (want==='hero' && a.player.mode==='attack' && c && c.t> c.d.windup+30) return 'ok';
            if (want==='boss' && a.boss.mode==='attack' && bc && bc.fired && bc.t < 400 && !bc.a.guard) return 'ok'; }
          return 'none'; }""", want)
        pg.wait_for_timeout(120)
        pg.screenshot(path=f'/tmp/claude-0/shot_{want}_{k}.png')
        pg.evaluate("()=>{const a=TG_GAME.scene.getScene('Arena'); for(let i=0;i<90;i++) a.step(1/60);}")
    print(errs or 'no errors')
    b.close()
