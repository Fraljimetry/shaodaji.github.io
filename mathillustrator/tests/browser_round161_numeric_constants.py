"""Round 161: browser acceptance for expressions in numeric inputs and localization."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
from math import pi, e

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for width in (1440,390):
   page=browser.new_page(viewport={'width':width,'height':900})
   errors=[]
   page.on('pageerror',lambda err: errors.append(str(err)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   if width<700:page.locator('#right-collapse').click()
   def apply(selector,value):
    node=page.locator(selector);node.fill(value);node.dispatch_event('change')
    return node.input_value()
   assert page.locator('#snap-step').get_attribute('type')=='text'
   assert abs(float(apply('#snap-step','pi/10'))-pi/10)<1e-12
   assert apply('#snap-step','0')==str(pi/10) or abs(float(page.locator('#snap-step').input_value())-pi/10)<1e-12
   assert abs(float(apply('#default-width','2e'))-2*e)<1e-12
   assert apply('#point-size','pi')=='5', 'non-integer point size must roll back'
   assert apply('#point-size','4+2')=='6'
   assert apply('#point-size','e/0')=='6'
   assert apply('#point-size','400')=='6'
   assert abs(float(apply('#default-opacity','1/2'))-.5)<1e-12
   page.locator('#ui-language').select_option('zh')
   assert page.locator('#scene3d-detail').get_attribute('type')=='text'
   page.locator('#scene3d-enable').check()
   assert apply('#scene3d-detail','pi')!= 'pi', 'integer-only mesh detail must reject pi'
   assert apply('#scene3d-detail','32+4')=='36'
   assert abs(float(apply('#scene3d-yaw','180/pi'))-180/pi)<0.01
   assert apply('#scene3d-yaw','999')!= '999'
   if width==1440:
    # 2D parameter bounds must accept true constants, not decimal approximations typed by hand.
    page.locator('#ui-language').select_option('en')
    page.locator('#scene3d-enable').uncheck()
    if width<700:
     # Side panes may be collapsed by the 3D mode toggle.
     if page.locator('#right-collapse').count() and not page.locator('#plot-mode').is_visible():
      page.locator('#right-collapse').click()
    page.locator('#plot-mode').select_option('parametric')
    page.locator('#command').fill('cos(t)')
    page.locator('#command-y').fill('sin(t)')
    page.locator('#command').press('Enter')
    bound=page.locator('#properties').get_by_label('t max')
    assert bound.count()==1
    bound.fill('2pi');bound.dispatch_event('change')
    assert abs(float(page.locator('#properties').get_by_label('t max').input_value())-2*pi)<1e-12
    page.locator('#ui-language').select_option('zh')
    assert page.locator('#properties').get_by_label('t 上界').count()==1
   assert not errors,(width,errors)
   print('ROUND161_CHROMIUM_PASS',width,flush=True)
   page.close()
 finally:browser.close()
