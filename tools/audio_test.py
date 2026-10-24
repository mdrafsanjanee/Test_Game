"""Audio must load, schedule music in a running context, and never throw."""
import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=warden&bot=1&god=1'); pg.wait_for_timeout(1500)
    pg.keyboard.press('Space'); pg.wait_for_timeout(300)
    r = pg.evaluate("""async () => { const a=TG_GAME.scene.getScene('Arena');
      const out={music:TG.Music.current};
      for(let i=0;i<60*20;i++) a.step(1/60);                 // sfx fire during the simulated fight
      await new Promise(r=>setTimeout(r,1500));
      a.boss.startPhase2(); await new Promise(r=>setTimeout(r,800));
      ['hit','hit_heavy','swing','swing_heavy','dash','roll','jump','jump2','hurt','tell','slam','roar','reflect','shatter','die','ui'].forEach(n=>TG.Sfx.play(n));
      TG.Music.play('mirror'); await new Promise(r=>setTimeout(r,1200)); TG.Music.phase(2); await new Promise(r=>setTimeout(r,800));
      out.after = TG.Music.current; out.muted = TG.Music.toggleMute(); TG.Music.toggleMute();
      return out; }""")
    print(json.dumps(r)); print(errs or 'no errors'); b.close()
