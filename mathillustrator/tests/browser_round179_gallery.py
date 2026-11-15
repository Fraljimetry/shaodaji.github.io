"""Round 179: native gallery project import through real Chromium UI (offline fixture)."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, ROOT

keys=['golden-ratio','spirograph','phase-portraits','gyroid','enneper','circle-inversion']
expected={'golden-ratio':31,'spirograph':4,'phase-portraits':4,'gyroid':1,'enneper':1,'circle-inversion':12}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 for width in [1440,390]:
  for key in keys:
   page=browser.new_page(viewport={'width':width,'height':850})
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load',timeout=60000)
   page.locator('#open-file').set_input_files(str(ROOT/'examples'/f'gallery-{key}.json'))
   page.wait_for_function('''([expected,three])=>{const d=JSON.parse(window.__round36Snapshot());return three?d.settings.plot3dEnabled&&d.scene3d.plots.length===expected:d.objects.length===expected}''',arg=[expected[key],key in ('gyroid','enneper')],timeout=30000)
   d=page.evaluate('JSON.parse(window.__round36Snapshot())')
   assert d['meta']['title']!='Untitled illustration',(width,key)
   assert not errors,(width,key,errors)
   print('ROUND179_CHROMIUM_PASS',width,key,'objects',len(d['objects']),'3d',len(d['scene3d']['plots']),flush=True)
   page.close()
 browser.close()
