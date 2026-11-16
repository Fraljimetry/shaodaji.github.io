"""Actual Chromium 2D/3D interface and fixed-region persistence regression."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1440,'height':900})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
  snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
  assert page.locator('#auto-pan').is_visible()
  assert page.locator('#selection-preview').is_visible()
  assert page.locator('#scene3d-fix-region').is_hidden()
  page.locator('#scene3d-enable').check()
  assert page.locator('#scene3d-fix-region').is_visible()
  assert page.locator('#fast-3d-orbit').is_visible()
  assert page.locator('#selection-preview').is_hidden()
  assert page.locator('#auto-pan').is_hidden()
  assert page.locator('.interface-check-grid input:visible').count()==3
  page.locator('#plot-mode').select_option('surface3d')
  page.locator('#command').fill('sin(x)*cos(y)')
  page.locator('#command').press('Enter')
  assert len(snap()['scene3d']['plots'])==1
  page.locator('#scene3d-fix-region').check()
  before=snap()['scene3d'];frozen=before['options']['fixedBounds'];yaw=before['options']['yaw']
  page.locator('#command').fill('x+y')
  page.locator('#command').press('Enter')
  after=snap()['scene3d']
  assert len(after['plots'])==2
  assert after['options']['fixedBounds']==frozen
  assert after['plots'][1]['bounds']==frozen
  assert after['options']['yaw']==yaw
  # Disabling the mode temporarily must preserve the project-level region flag.
  page.locator('#scene3d-enable').uncheck()
  page.locator('#scene3d-enable').check()
  assert page.locator('#scene3d-fix-region').is_checked()
  assert snap()['scene3d']['options']['fixedBounds']==frozen
  page.locator('#scene3d-fix-region').uncheck()
  assert not snap()['scene3d']['options']['fixRegion']
  assert 'fixedBounds' not in snap()['scene3d']['options']
  assert not errors,errors
  print('ROUND195_CHROMIUM_PASS: 2D/3D layout, multi-plot bounds, toggles, mode persistence, console')
 finally:browser.close()
