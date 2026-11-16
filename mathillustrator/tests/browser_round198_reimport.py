"""Reopen saved extreme plots and geometry fixtures in the real Chromium application."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).parent/'fixtures'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1600,'height':1000});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
  for key,n in [('geometry',63),('plot2d',8),('plot3d',0)]:
   page.locator('#open-file').set_input_files(str(ROOT/f'round198_{key}.json'))
   page.wait_for_timeout(250)
   snap=json.loads(page.evaluate('window.__round36Snapshot()'))
   assert len(snap['objects'])==n,(key,len(snap['objects']))
   if key=='plot3d':
    assert len(snap['scene3d']['plots'])==4
    assert snap['scene3d']['options']['fixRegion']
   print('REIMPORT_PASS',key,len(snap['objects']),flush=True)
  assert not errors,errors
 finally:browser.close()
