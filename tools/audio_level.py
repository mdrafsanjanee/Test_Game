"""Measure output level of each track/phase (peak and RMS, dBFS). Flags silence and clipping."""
import http.server, threading, socketserver, functools, os, json
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv = socketserver.TCPServer(('127.0.0.1',0), functools.partial(H, directory=root)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = """async () => {
  const an = TG.Music.probe(), buf = new Float32Array(an.fftSize), out = {};
  for (const [id, ph] of [['menu',1],['warden',1],['warden',2],['mirror',1],['mirror',2]]) {
    TG.Music.fadeOut(10); await new Promise(r=>setTimeout(r,300));
    TG.Music.play(id); TG.Music.phase(ph);
    await new Promise(r=>setTimeout(r,2500));
    let peak=0, sum=0, n=0;
    for (let k=0;k<60;k++){ an.getFloatTimeDomainData(buf); for (const v of buf){ peak=Math.max(peak,Math.abs(v)); sum+=v*v; n++; } await new Promise(r=>setTimeout(r,50)); }
    out[id+'_p'+ph] = {peakDb:+(20*Math.log10(peak||1e-6)).toFixed(1), rmsDb:+(10*Math.log10(sum/n||1e-12)).toFixed(1)};
  }
  return out; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(1500); pg.keyboard.press('Shift')
    print(json.dumps(pg.evaluate(JS), indent=0)); print(errs or 'no errors'); b.close()
