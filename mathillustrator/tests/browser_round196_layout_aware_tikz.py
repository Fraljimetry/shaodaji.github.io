"""Real Chromium export of the 33-object diagram, testing output geometry and no JS failures."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
fixture=Path(__file__).parent/'fixtures'/'round196_complex_diagram.json'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1460,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=45000)
  page.once('dialog',lambda d:d.accept())
  page.locator('#open-file').set_input_files(str(fixture))
  page.wait_for_timeout(350)
  assert len(json.loads(page.evaluate('window.__round36Snapshot()'))['objects'])==33
  page.locator('#export-open').click()
  with page.expect_download(timeout=15000) as event:page.get_by_role('button',name='tikz-cd (semantic)').click()
  tex=Path(event.value.path()).read_text()
  assert r'column sep=100.8pt' in tex and r'row sep=69.12pt' in tex,tex[:200]
  assert tex.count(r'\arrow[')==21
  assert not errors,errors
  print('ROUND196_CHROMIUM_PASS: 33 objects, 21 semantic morphisms, geometry spacing, no JS errors')
 finally:browser.close()
