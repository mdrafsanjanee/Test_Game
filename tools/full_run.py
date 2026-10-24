"""Plays the whole TG.sequence from the menu with the bot (cutscenes in real time, fights fast-forwarded).
Usage: python3 tools/full_run.py "bot=1&god=1&item=1" [max_seconds]"""
import sys, time, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
q = sys.argv[1] if len(sys.argv) > 1 else 'bot=1&god=1'
cap = float(sys.argv[2]) if len(sys.argv) > 2 else 300
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS_ACTIVE = "() => TG_GAME.scene.getScenes(true).map(s=>s.scene.key)[0]"
JS_FIGHT = """() => { const a=TG_GAME.scene.getScene('Arena'); const id=a.bossId; let n=0;
  while(!a.over && n<60*240){ a.step(1/60); n++; } return {boss:id, over:a.over, t:+a.clock.toFixed(1), hp:Math.round(a.player.hp), bhp:Math.round(a.boss.hp)}; }"""
seen = []; fights = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720}); errs=[]
    pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?{q}'); pg.wait_for_timeout(2000)
    t0 = time.time(); last = None; fought = set()
    while time.time() - t0 < cap:
        key = pg.evaluate(JS_ACTIVE)
        if key != last:
            info = pg.evaluate("() => { const s=TG_GAME.scene.getScenes(true)[0]; return s.bossId || (s.d&&s.d.id) || (s.d&&s.d.boss) || ''; }")
            seen.append(f'{key}:{info}@{int(time.time()-t0)}s'); last = key
        if key == 'Menu': pg.keyboard.press('Enter'); pg.wait_for_timeout(600)
        elif key == 'Arena':
            bid = pg.evaluate("() => TG_GAME.scene.getScene('Arena').bossId")
            if bid not in fought:
                fought.add(bid); fights.append(pg.evaluate(JS_FIGHT))
            pg.wait_for_timeout(400)
        elif key == 'Decision': pg.wait_for_timeout(500); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
        elif key == 'Summary':
            pg.wait_for_timeout(800); break
        else: pg.wait_for_timeout(400)
    end = pg.evaluate("() => { const s=TG_GAME.scene.getScene('Summary'); return {active: TG_GAME.scene.getScenes(true).map(s=>s.scene.key), texts: s && s.children ? s.children.list.filter(c=>c.text).map(c=>c.text).slice(0,3) : null, flags: TG.Record.save.flags, decisions: TG.Record.save.decisions, fights: TG.Record.save.fights.map(f=>f.boss+':'+f.res)}; }")
    print('SCENES', ' > '.join(seen)); print('FIGHTS', json.dumps(fights)); print('END', json.dumps(end)); print(errs or 'no errors')
    b.close()
