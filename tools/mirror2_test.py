"""Mirror fight scenarios: style from record, shatter, reflect, mutual kill, forgive."""
import sys, http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = """async () => {
  const G = TG_GAME, out = {};
  const fresh = async (fights) => {
    TG.Record.reset(); (fights||[]).forEach(f => TG.Record.save.fights.push(f));
    G.scene.start('Arena', {boss:'mirror', idx:1, tries:0}); await new Promise(r=>setTimeout(r,1200));
    return G.scene.getScene('Arena'); };
  const base = {boss:'warden',res:'win',dur:60,c:{light:60,heavy:6,dash:10,roll:6,jump:20,djump:3},dist:150,air:0.15,close:0.5,combo:2,hits:5,dealt:400};
  // 1) style comes from the record
  let a = await fresh([Object.assign({}, base, {cross:0.5, behind:0.4})]);
  out.flankStyle = [a.boss.brain.style, +a.boss.brain.flank.toFixed(2)];
  a = await fresh([Object.assign({}, base, {cross:0.0, behind:0.0})]);
  out.directStyle = [a.boss.brain.style, +a.boss.brain.flank.toFixed(2)];
  a = await fresh([]); out.noHistory = [a.boss.brain.style, +a.boss.brain.flank.toFixed(2)];

  // 2) bot hero (god) fights it: does it shatter, reflect, end?
  TG.debug.god = false;
  a = await fresh([Object.assign({}, base, {cross:0.5, behind:0.4})]);
  a.player.brain = new TG.MirrorBrain(a.player, TG.Record.profile(5), {});
  const log = []; let shattered = false, reflectHits = 0, prevHeroHp = 100, minHero = 100;
  for (let i=0;i<60*140 && !a.over;i++){ a.step(1/60);
    if (a.boss.phase===2 && !shattered){ shattered=true; log.push(['shatter@', +a.clock.toFixed(1), 'hero', Math.round(a.player.hp), 'boss', a.boss.hp]); }
    if (a.player.hp > 0) minHero = Math.min(minHero, a.player.hp);
  }
  out.bot = {over:a.over, shattered, t:+a.clock.toFixed(1), heroHp:Math.round(a.player.hp), bossHp:Math.round(a.boss.hp), phase:a.boss.phase, outcome: TG.Story.flag('mirror_outcome')||null, log};
  return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width':1280,'height':720}); errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html?boss=warden'); pg.wait_for_timeout(2500)
    print(json.dumps(pg.evaluate(JS), indent=1)); print(errs or 'no errors'); b.close()
