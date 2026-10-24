"""Fast-forward sim: runs N seconds of game time per scene.step, no real-time wait.
Usage: python3 tools/sim.py "boss=warden&bot=1&god=1" 90"""
import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
q = sys.argv[1]; secs = float(sys.argv[2]); shot = sys.argv[3] if len(sys.argv)>3 else None
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs=[]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720})
    pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?{q}')
    pg.wait_for_timeout(2500)
    out = pg.evaluate("""(secs) => { const a = TG_GAME.scene.getScene('Arena'); const log=[]; let n=Math.round(secs*60);
      const t0=performance.now();
      for (let i=0;i<n && !a.over;i++){ a.step(1/60); if(i%300===0) log.push([ (i/60)|0, Math.round(a.player.hp), Math.round(a.boss.hp), a.boss.mode, a.boss.cur?a.boss.cur.a.id:'' ]); }
      return {log, over:a.over, hp:a.player.hp, bhp:a.boss.hp, phase:a.boss.phase, ms:Math.round(performance.now()-t0), steps:n, counts:TG.Record.live&&TG.Record.live.counts, saved:TG.Record.save.fights.map(f=>[f.boss,f.res,Math.round(f.dur)]), prof: TG.Record.profile(5)}; }""", secs)
    print(json.dumps(out))
    if shot: pg.screenshot(path=shot)
    b.close()
print('\n'.join(errs[:10]) if errs else 'no errors')
