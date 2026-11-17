"""Actual Chromium tabs on a shared HTTP origin; no localStorage monkeypatches."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json, os

ROOT=Path(__file__).resolve().parents[1]
KEY='mathillustrator-project-v1'
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

def run():
    handler=lambda *args,**kwargs:QuietHandler(*args,directory=str(ROOT),**kwargs)
    server=ThreadingHTTPServer(('127.0.0.1',0),handler)
    thread=Thread(target=server.serve_forever,daemon=True);thread.start()
    url=f'http://127.0.0.1:{server.server_port}/index.html'
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
            ctx=browser.new_context(viewport={'width':1360,'height':880})
            a=ctx.new_page(); b=ctx.new_page(); errors=[]
            for page in (a,b):
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('dialog',lambda d:d.accept())
                page.goto(url,wait_until='load')
                page.locator('#command').wait_for(timeout=15000)
            assert a.evaluate('!!navigator.locks?.request'),'Web Locks unavailable on loopback secure context'
            def command(page,expression):
                page.locator('#command').fill(expression)
                page.locator('#command-form button').click()
            command(a,'A=(0,0)')
            a.wait_for_function("JSON.parse(localStorage.getItem('mathillustrator-project-v1')||'{}').objects?.length===1",timeout=10000)
            b.wait_for_function("!document.querySelector('#conflict-banner').hidden",timeout=10000)
            assert b.locator('#conflict-banner').is_visible(), 'Second tab did not detect storage event'
            # Tab B cannot silently overwrite A even if it adds an object.
            command(b,'B=(1,0)')
            b.wait_for_timeout(650)
            assert b.locator('#conflict-banner').is_visible()
            snapshot=json.loads(a.evaluate(f'localStorage.getItem({json.dumps(KEY)})'))
            assert len(snapshot['objects'])==1 and snapshot['objects'][0]['name']=='A'
            b.locator('#conflict-load').click()
            assert b.locator('#object-count').inner_text()=='1'
            assert not b.locator('#conflict-banner').is_visible()
            command(b,'C=(2,3)')
            b.wait_for_function("JSON.parse(localStorage.getItem('mathillustrator-project-v1')||'{}').objects?.length===2",timeout=10000)
            a.wait_for_function("!document.querySelector('#conflict-banner').hidden",timeout=10000)
            assert a.locator('#conflict-banner').is_visible()
            a.wait_for_timeout(650)
            snapshot2=json.loads(a.evaluate(f'localStorage.getItem({json.dumps(KEY)})'))
            assert [o['name'] for o in snapshot2['objects']]==['A','C']
            # On a real HTTP origin, reload persists exactly the latest committed revision.
            fresh=ctx.new_page();fresh.goto(url,wait_until='load')
            assert fresh.locator('#object-count').inner_text()=='2'
            assert fresh.locator('#undo').is_disabled()
            # Deliberate overwrite is explicit and must be reflected in other tabs.
            a.locator('#conflict-overwrite').click()
            a.wait_for_function("JSON.parse(localStorage.getItem('mathillustrator-project-v1')||'{}').objects?.length===1",timeout=10000)
            b.wait_for_function("!document.querySelector('#conflict-banner').hidden",timeout=10000)
            assert b.locator('#conflict-banner').is_visible()
            assert not errors, errors
            print('REAL_ORIGIN_TABS_PASS: Web Locks, storage events, conflict pause, manual load, persistence, explicit overwrite')
            browser.close()
    finally:
        server.shutdown();server.server_close();thread.join(timeout=2)
if __name__=='__main__':run()
