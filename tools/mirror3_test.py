import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = """async () => {
  const G = TG_GAME, out = {};
  const fresh = async () => { TG.Record.reset(); G.scene.start('Arena', {boss:'mirror', idx:1, tries:0}); await new Promise(r=>setTimeout(r,1200)); return G.scene.getScene('Arena'); };
  // A) lethal final blow
  let a = await fresh(); TG.debug.god = false;
  a.boss.receiveHit({dmg:999,poise:0,kbx:100,hitstop:10,src:a.player});           // break the shield
  for(let i=0;i<5;i++) a.step(1/60);
  out.afterShatter = {phase:a.boss.phase, bossHp:a.boss.hp, heroHp:a.player.hp, reflect:a.boss.reflect};
  a.boss.invuln = 0; a.boss.hp = 5; a.player.invuln = 0;
  a.boss.receiveHit({dmg:10,poise:0,kbx:100,hitstop:10,src:a.player});
  for(let i=0;i<5;i++) a.step(1/60);
  out.mutual = {over:a.over, heroDead:a.player.dead, bossDead:a.boss.dead, outcome:TG.Story.flag('mirror_outcome')};
  // B) partial reflect: a normal hit costs 70% of its damage
  a = await fresh();
  a.boss.receiveHit({dmg:999,poise:0,kbx:100,hitstop:10,src:a.player}); for(let i=0;i<5;i++) a.step(1/60);
  a.boss.invuln=0; a.player.invuln=0; const h0=a.player.hp, b0=a.boss.hp;
  a.boss.receiveHit({dmg:10,poise:0,kbx:100,hitstop:10,src:a.player});
  out.reflect = {bossLost:b0-a.boss.hp, heroLost:Math.round(h0-a.player.hp)};
  // C) stop swinging -> yields -> forgiven (god so the idle hero survives for the test)
  a = await fresh(); TG.debug.god = true;
  a.boss.receiveHit({dmg:999,poise:0,kbx:100,hitstop:10,src:a.player});
  let yielded=false; for(let i=0;i<60*30 && !a.over;i++){ a.step(1/60); if(a.boss.brain.yielding) yielded=true; }
  out.forgive = {over:a.over, yielded, t:+a.clock.toFixed(1), outcome:TG.Story.flag('mirror_outcome')};
  return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=warden'); pg.wait_for_timeout(2500)
    print(json.dumps(pg.evaluate(JS))); print(errs or 'no errors'); b.close()
