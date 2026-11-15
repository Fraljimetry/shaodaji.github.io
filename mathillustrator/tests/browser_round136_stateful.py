"""Round 136: real Chromium interactions and persistence for Settings and Properties."""
import os, json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=45000)
   page.wait_for_selector('#plot-mode',state='attached')
   if width<700: page.locator('#right-collapse').click()
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   # Drive events with true browser input and ordinary browser change dispatch.
   page.locator('#snap-step').fill('0.125');page.locator('#snap-step').dispatch_event('change')
   assert state()['settings']['snapStep']==0.125
   page.locator('#snap-step').fill('0');page.locator('#snap-step').dispatch_event('change')
   assert state()['settings']['snapStep']==0.125
   assert page.locator('#snap-step').input_value()=='0.125'
   page.locator('#undo').click(force=True)
   assert state()['settings']['snapStep']!=0.125
   page.locator('#redo').click(force=True)
   assert state()['settings']['snapStep']==0.125
   if width<700 and not page.evaluate("document.body.classList.contains('mobile-right-open')"): page.locator('#right-collapse').click()
   page.locator('#theme').select_option('light')
   page.locator('#scene3d-enable').check()
   assert state()['settings']['plot3dEnabled']
   page.locator('#scene3d-theme').select_option('dark')
   print('theme values',width,page.locator('#scene3d-theme').input_value(),page.locator('#theme').input_value(),flush=True)
   page.locator('#scene3d-detail').fill('36');page.locator('#scene3d-detail').dispatch_event('change')
   assert state()['scene3d']['options']['detail']==36
   page.locator('#scene3d-detail').fill('999');page.locator('#scene3d-detail').dispatch_event('change')
   assert state()['scene3d']['options']['detail']==36
   if width<700: page.locator('#left-collapse').click()
   page.locator('#plot-mode').select_option('surface3d');page.locator('#command').fill('x+y');page.locator('#command-form button').click()
   if width<700:
    page.locator('#left-collapse').click()
    assert not page.evaluate("document.body.classList.contains('mobile-left-open')")
    page.locator('#right-collapse').click()
   if width<700:
    page.locator('#right-collapse').click()
    page.locator('#left-collapse').click()
   prop=page.locator('#properties');prop.get_by_label('Name',exact=True).fill('TestSurface');prop.get_by_label('Name',exact=True).dispatch_event('change')
   assert state()['scene3d']['plots'][-1]['name']=='TestSurface'
   if width<700:
    # Outside canvas tap dismisses without constructing any object.
    before=len(state()['objects'])
    assert page.evaluate("document.body.classList.contains('mobile-left-open')")
    page.mouse.click(width-5,450)
    assert not page.evaluate("document.body.classList.contains('mobile-left-open')")
    assert len(state()['objects'])==before
    page.locator('#right-collapse').click()
    assert page.evaluate("document.body.classList.contains('mobile-right-open')")
    page.keyboard.press('Escape')
    assert not page.evaluate("document.body.classList.contains('mobile-right-open')")
    page.locator('#left-collapse').click()
    page.locator('#left-collapse').click()
   assert not errors,errors
   print('PASS stateful settings/properties',width,flush=True)
   page.close()
 finally:browser.close()
