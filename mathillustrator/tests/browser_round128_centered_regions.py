"""Round128 expression bounds and centered drawing-region controls, real Chromium."""
import math, json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   p=browser.new_page(viewport={'width':1450,'height':900})
   p.set_default_timeout(25000)
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(expose_state=True),wait_until='load')
   state=lambda:json.loads(p.evaluate('window.__round36Snapshot()'))
   p.locator('#scene3d-enable').check()
   p.locator('#plot-mode').select_option('surface3d');p.locator('#command').fill('sin(x)*cos(y)')
   p.locator('#command-form button').click()
   region=p.locator('#properties .plot-region-editor')
   assert region.get_by_label('Centered half-range').count()==1
   # Round130: compact Enter-only half-range, no Apply button.
   assert region.get_by_role('button',name='Apply ±').count()==0
   region.get_by_label('Centered half-range').fill('4pi')
   region.get_by_label('Centered half-range').press('Enter')
   bounds=state()['scene3d']['plots'][-1]['bounds']
   for axis in 'xyz':
    assert math.isclose(bounds[axis+'Min'],-4*math.pi,rel_tol=1e-12),bounds
    assert math.isclose(bounds[axis+'Max'],4*math.pi,rel_tol=1e-12),bounds
   region=p.locator('#properties .plot-region-editor')
   region.get_by_label('x min').fill('-pi/2');region.get_by_label('x min').press('Enter')
   assert math.isclose(state()['scene3d']['plots'][-1]['bounds']['xMin'],-math.pi/2)
   before=state()['scene3d']['plots'][-1]['bounds'].copy()
   region=p.locator('#properties .plot-region-editor')
   region.get_by_label('Centered half-range').fill('alert(1)')
   region.get_by_label('Centered half-range').press('Enter')
   assert state()['scene3d']['plots'][-1]['bounds']==before
   # 2D regions accept the same expressions, and centered presets preserve persistence.
   p.locator('#scene3d-enable').uncheck()
   p.locator('#plot-mode').select_option('vectorField')
   p.locator('#command').fill('-y');p.locator('#command-y').fill('x')
   p.locator('#command-form button').click()
   region=p.locator('#properties .plot-region-editor')
   region.get_by_label('Centered half-range').fill('2pi')
   region.get_by_label('Centered half-range').press('Enter')
   bounds=state()['objects'][-1]['region']
   for axis in 'xy':
    assert math.isclose(bounds[axis+'Min'],-2*math.pi),bounds
    assert math.isclose(bounds[axis+'Max'],2*math.pi),bounds
   assert not errors,errors
   print('PASS Round128 Chromium: 4pi, centered XYZ/XY, asymmetric scope, invalid rollback, no JS errors')
  finally:browser.close()
if __name__=='__main__':run()
