"""Actual Chromium high mesh-detail UI and rendering smoke (CPU/SVG path)."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1400,'height':900})
  page.set_default_timeout(60000)
  errors=[]
  page.on('pageerror',lambda exc:errors.append(str(exc)))
  page.on('dialog',lambda dialog:dialog.accept())
  page.set_content(inline_html(expose_state=True),wait_until='load')
  page.locator('#scene3d-enable').check()
  page.locator('#plot-mode').select_option('surface3d')
  page.locator('#command').fill('sin(x)*cos(y)')
  page.locator('#command-form button').click()
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')")
  page.locator('#scene3d-detail').fill('128')
  page.locator('#scene3d-detail').dispatch_event('change')
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=60000)
  count=page.locator('#drawing polygon').count()
  assert count==32768,count
  assert page.locator('#scene3d-detail').input_value()=='128'
  assert 'PLOT LIMIT' not in page.locator('#render-info').inner_text()
  page.reload() if False else None
  assert not errors,errors
  print(f'PASS ROUND126_CHROMIUM: detail 128, {count} polygons, complete view, no JS errors')
 finally:browser.close()
