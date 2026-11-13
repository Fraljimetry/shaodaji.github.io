"""True same-origin two-page Chromium storage events and Web Locks availability.
Uses Playwright-fulfilled HTTPS resources; not a real deployed-site test or a
proof of atomicity in every browser / teardown scenario.
"""
import os, json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, Error as PlaywrightError
ROOT=Path(__file__).resolve().parents[1]
BASE='https://mathillustrator.example'
KEY='mathillustrator-project-v1'

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':1320,'height':840})
  def serve(route):
   path=urlparse(route.request.url).path
   if path.startswith('/mathillustrator/'):
    part=path[len('/mathillustrator/'):].lstrip('/') or 'index.html'
    full=(ROOT/part).resolve()
    if not full.is_relative_to(ROOT.resolve()) or not full.is_file():route.fulfill(status=404,body='Not found');return
    mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'}.get(full.suffix,'text/plain')
    route.fulfill(status=200,body=full.read_bytes(),content_type=mime)
   else:route.fulfill(status=404,body='Not found')
  ctx.route(BASE+'/**',serve)
  a=ctx.new_page();b=ctx.new_page()
  errors=[]
  for page in (a,b):
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   try:page.goto(BASE+'/mathillustrator/',wait_until='load')
   except PlaywrightError as exc:
    if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc):
     print('CUT09_MULTITAB_UNVERIFIED browser policy blocks navigation to a synthetic HTTPS origin')
     ctx.close();browser.close();return
    raise
   page.locator('#drawing').wait_for()
  assert a.evaluate('Boolean(navigator.locks?.request)')
  assert b.evaluate('Boolean(navigator.locks?.request)')
  def cmd(page,s):page.locator('#command').fill(s);page.locator('#command-form button').click()
  def saved():return json.loads(a.evaluate(f'localStorage.getItem("{KEY}")'))
  cmd(a,'A=(0,0)');a.wait_for_timeout(650)
  assert [o['name'] for o in saved()['objects']]==['A']
  assert b.locator('#conflict-banner').is_visible(),'other page did not receive real StorageEvent'
  b.locator('#conflict-load').click()
  assert b.locator('#object-count').inner_text()=='1'
  cmd(a,'B=(2,0)');a.wait_for_timeout(650)
  assert b.locator('#conflict-banner').is_visible()
  cmd(b,'C=(4,0)');b.wait_for_timeout(650)
  assert [o['name'] for o in saved()['objects']]==['A','B'],'conflicted tab silently overwrote storage'
  b.locator('#conflict-overwrite').click();b.wait_for_timeout(650)
  assert [o['name'] for o in saved()['objects']]==['A','C'],'explicit overwrite failed'
  assert a.locator('#conflict-banner').is_visible(),'original tab did not receive reverse conflict'
  a.locator('#conflict-load').click()
  assert a.locator('#object-count').inner_text()=='2'
  assert a.locator('#undo').is_disabled()
  assert not errors, errors
  print('CUT09_MULTITAB_PASS true two-page origin, Web Locks present, StorageEvent, conflict pause, explicit overwrite, load-newer, history reset')
  ctx.close();browser.close()

if __name__=='__main__':run()
