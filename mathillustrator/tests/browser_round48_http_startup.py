"""Real Chromium + local HTTP: verify actual unmodified ES import URLs, app startup and persisted 3D."""
import os
from pathlib import Path
from threading import Thread
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self, *args):pass

def run():
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT.parent)))
 thread=Thread(target=server.serve_forever,daemon=True);thread.start()
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
   try:
    page=browser.new_page(viewport={'width':1340,'height':850})
    page.set_default_timeout(20000)
    errs=[];resources=[]
    page.on('pageerror',lambda e:errs.append(str(e)))
    page.on('requestfinished',lambda r:resources.append(r.url.split('/')[-1]))
    page.goto(f'http://127.0.0.1:{server.server_address[1]}/mathillustrator/index.html',wait_until='load')
    page.locator('#scene3d-enable').check()
    page.locator('#plot-mode').select_option('domain3d')
    page.locator('#command').fill('z^2+1')
    page.locator('#command-form button').click()
    page.wait_for_function("!document.getElementById('render-info').textContent.includes('rendering')",timeout=25000)
    assert page.locator('#drawing polygon').count()>100
    assert any('app.mjs?cut=round48'==r for r in resources),resources
    assert sum('plot3d.mjs?cut=round48'==r for r in resources)==1,resources
    assert any('style.css?cut=round48'==r for r in resources)
    assert 'Saved locally' in page.locator('#autosave-info').inner_text() or 'Local backup ready' in page.locator('#autosave-info').inner_text()
    assert not errs,errs
    print('PASS ROUND48_HTTP_CHROMIUM: actual HTTP module graph (single 3D module), CSS, domain plot, localStorage startup')
   finally:browser.close()
 finally:server.shutdown();server.server_close();thread.join(timeout=2)

if __name__=='__main__':run()
