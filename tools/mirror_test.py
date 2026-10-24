import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs=[]
JS = """async (arg) => {
  const G = TG_GAME, out = {};
  const run = (secs) => { const a = G.scene.getScene('Arena'); for (let i=0;i<secs*60 && !a.over;i++) a.step(1/60); return a; };
  let a = run(60);
  out.w = {over:a.over, hp:Math.round(a.player.hp), bhp:Math.round(a.boss.hp)};
  TG.Record.end('quit');
  out.profile = TG.Record.profile(5);
  G.scene.start('Arena', {boss:'mirror', idx:1, tries:0});
  await new Promise(r=>setTimeout(r,1500));
  a = G.scene.getScene('Arena');
  out.mirrorProfile = a.boss.profile;
  const seen = {}; 
  for (let i=0;i<60*50 && !a.over;i++){ a.step(1/60); const m=a.boss.mode, act=a.boss.act&&a.boss.act.id; if(act) seen[act]=(seen[act]||0)+1; }
  out.dbg = {px:a.player.x, bx:a.boss.x, pm:a.player.mode, bm:a.boss.mode, cool:a.boss.brain.cool, seq:a.boss.brain.seq, bdead:a.boss.dead, clock:a.clock, fighters:a.fighters.length, ctrlNow:a.boss.ctrl.now, nowMs:a.nowMs};
  out.m = {over:a.over, hp:Math.round(a.player.hp), bhp:Math.round(a.boss.hp), seenActs:seen, subs:a.subQ.length};
  return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720})
    pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=warden&bot=1&god=1')
    pg.wait_for_timeout(2500)
    print(json.dumps(pg.evaluate(JS, None), indent=1))
    pg.screenshot(path='/tmp/claude-0/mirror.png')
    b.close()
print('\n'.join(errs[:10]) if errs else 'no errors')
