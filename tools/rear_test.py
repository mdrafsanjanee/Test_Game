"""Phase 2 Warden must punish a player who gets behind it."""
import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = """() => { const a=TG_GAME.scene.getScene('Arena'); const out={trials:[]};
  for (let k=0;k<8;k++){
    a.boss.hp=a.boss.maxHp*0.4; a.boss.phase=2; a.boss.mode='idle'; a.boss.cur=null; a.boss.think=5; a.boss.rearCd=0; a.boss.invuln=0; a.boss.stagger=0;
    a.boss.x=1100; a.boss.facing=-1; a.boss.vx=0; a.player.x=1170; a.player.facing=-1; a.player.hp=100; a.player.invuln=0; a.player.dead=false; a.player.mode='free'; a.player.act=null; a.player.vx=0;
    for(let i=0;i<10;i++) a.step(1/60);                 // settle (player is BEHIND: boss faces left, player on right)
    let spun=false, hit=false; const hp0=a.player.hp;
    for(let i=0;i<90;i++){ a.step(1/60); if(a.boss.cur&&a.boss.cur.a.id==='spin') spun=true; }
    out.trials.push({spun, dmg: Math.round(hp0-a.player.hp)});
  }
  return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720}); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=warden'); pg.wait_for_timeout(2500)
    r = pg.evaluate(JS); print(json.dumps(r)); print(errs or 'no errors'); b.close()
