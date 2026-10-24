"""Heal / tutorial / pause / skip / touch test. python3 tools/heal_test.py"""
import http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
errs=[]; res={}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':844,'height':390}, has_touch=True)
    pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' else None)
    # 1) manual heal in warden fight, driven by real keyboard events through the touch buttons
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=ash_husk&touch=1'); pg.wait_for_timeout(2500)
    res['touch_visible'] = pg.evaluate("document.body.classList.contains('touch-on') && getComputedStyle(document.getElementById('tb-heal')).display")
    res['scene_attr'] = pg.evaluate("document.body.dataset.scene")
    pg.screenshot(path='/tmp/touch.png')
    res['heal'] = pg.evaluate("""() => { const a=TG_GAME.scene.getScene('Arena'), h=a.player, c=a.ctrl;
      const out={hp0:h.hp}; 
      // too early: no charge
      c.press('heal'); c.hold('heal',true); for(let i=0;i<10;i++) a.step(1/60); out.earlyMode=h.mode; c.hold('heal',false);
      h.healCharge=8; a.boss.mode='free'; a.boss.x=1400; a.boss.think=99;
      c.press('heal'); c.hold('heal',true); for(let i=0;i<30;i++) a.step(1/60); out.midMode=h.mode;
      c.hold('heal',false); for(let i=0;i<3;i++) a.step(1/60); out.releaseMode=h.mode; out.chargeKept=h.healCharge; out.hpAfterRelease=h.hp;
      c.press('heal'); c.hold('heal',true); for(let i=0;i<100;i++) a.step(1/60); out.hp1=h.hp; out.charge1=h.healCharge; out.healed=h.healed; c.hold('heal',false);
      return out; }""")
    # pause
    res['pause'] = pg.evaluate("""() => { const a=TG_GAME.scene.getScene('Arena'); const t=a.clock; a.togglePause(); a.update(0,16); const p1=a.paused; a.togglePause(); return [p1,a.paused]; }""")
    b.close()
    # 2) tutorial run with bot: must finish and reach the next item
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720})
    pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=ash_husk&bot=1'); pg.wait_for_timeout(2500)
    res['tutorial'] = pg.evaluate("""() => { const a=TG_GAME.scene.getScene('Arena'); let i=0; for(;i<60*120 && !a.over;i++) a.step(1/60);
      return {secs:i/60, over:a.over, hp:a.player.hp, healed:a.player.healed, bossdead:a.boss.dead}; }""")
    # 3) cutscene skip
    pg.goto(f'http://127.0.0.1:{port}/index.html?bot=1&god=1'); pg.wait_for_timeout(1500)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(1500)
    res['cut_scene'] = pg.evaluate("TG_GAME.scene.getScenes(true).map(s=>s.sys.settings.key)")
    pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
    res['after_skip'] = pg.evaluate("TG_GAME.scene.getScenes(true).map(s=>s.sys.settings.key)")
    b.close()
print(json.dumps(res, indent=1))
print('\n'.join(errs[:10]) if errs else 'no errors')
