"""Mirror agility test: never still >1s, reaches a player on a platform, stuns, heals. python3 tools/mirror4_test.py"""
import http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs=[]
JS = """(mode) => { const a=TG_GAME.scene.getScene('Arena'), m=a.boss, h=a.player; const r={maxStill:0,stuns:0,mhealed:0,onPlat:0,hhit:0,mhits:0};
  let still=0, lx=m.x, ly=m.y; let prevHurtStun=0;
  if (mode==='plat') { h.brain=null; h.x=400; h.y=460; h.vy=0; }
  const oh=h.receiveHit.bind(h); h.receiveHit=function(i){ const ok=oh(i); if(ok){ r.hhit++; if(i.stun) r.stuns++; } return ok; };
  for(let i=0;i<60*40 && !a.over;i++){
    if (mode==='plat') { h.ctrl.clear(); if (h.y>470 && h.x<540 && h.x>300 && !h.grounded) {} h.hp=h.maxHp; if(h.y>520){h.x=400;h.y=460;h.vy=0;} }
    a.step(1/60);
    if (m.shield===false && m.phase===1) {}
    if (Math.abs(m.x-lx)>34||Math.abs(m.y-ly)>10){lx=m.x;ly=m.y;still=0;} else {still+=1/60; r.maxStill=Math.max(r.maxStill,still); if(still>1.2&&!r.dbg) r.dbg=[i/60,m.mode,m.phase,h.mode,m.brain.healT,m.brain.yielding,!!m.brain.seq,!!m.brain.after,m.grounded,Math.round(m.x),Math.round(h.x),m.hp];}
    if (m.onPlatform) r.onPlat++;
  }
  r.mhealed=m.healed||0; r.mhp=m.hp; r.hp=h.hp; r.phase=m.phase; r.over=a.over; return r; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for q,mode in (('boss=mirror&bot=1&god=1','fight'),('boss=mirror&bot=1&god=1','fight'),('boss=mirror&bot=1','plat')):
        pg = b.new_page(viewport={'width':1280,'height':720})
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        pg.goto(f'http://127.0.0.1:{port}/index.html?{q}'); pg.wait_for_timeout(2500)
        print(mode, json.dumps(pg.evaluate(JS, mode)))
        if mode=='fight': pg.screenshot(path='/tmp/m.png')
        pg.close()
    b.close()
print('\n'.join(errs[:10]) if errs else 'no errors')
