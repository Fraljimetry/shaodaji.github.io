"""Round130 real Chromium: compact layout and persisted strict 2D/3D masking."""
import os, json, math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1450,'height':900});page.set_default_timeout(20000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#scene3d-enable').check()
   page.locator('#plot-mode').select_option('surface3d');page.locator('#command').fill('0');page.locator('#command-form button').click()
   region=page.locator('#properties .plot-region-editor')
   assert region.get_by_role('button',name='Apply ±').count()==0
   a=region.get_by_label('Centered half-range');b=region.get_by_label('Region inequality')
   left=a.bounding_box();right=b.bounding_box();assert left['x']<right['x'] and abs(left['y']-right['y'])<4,(left,right)
   a.fill('4pi');a.press('Enter')
   bounds=state()['scene3d']['plots'][-1]['bounds'];assert math.isclose(bounds['xMax'],4*math.pi)
   region=page.locator('#properties .plot-region-editor');region.get_by_label('Region inequality').fill('x^2+y^2+z^2<16');region.get_by_label('Region inequality').press('Enter')
   assert state()['scene3d']['plots'][-1]['regionCondition']=='x^2+y^2+z^2<16'
   before=state()['scene3d']['plots'][-1]['regionCondition']
   region=page.locator('#properties .plot-region-editor');region.get_by_label('Region inequality').fill('x<=1');region.get_by_label('Region inequality').press('Enter')
   assert state()['scene3d']['plots'][-1]['regionCondition']==before
   region.get_by_label('Region inequality').fill('');region.get_by_label('Region inequality').press('Enter')
   assert state()['scene3d']['plots'][-1]['regionCondition']==''
   page.locator('#scene3d-enable').uncheck()
   page.locator('#plot-mode').select_option('vectorField');page.locator('#command').fill('-y');page.locator('#command-y').fill('x');page.locator('#command-form button').click()
   region=page.locator('#properties .plot-region-editor');region.get_by_label('Region inequality').fill('x>0');region.get_by_label('Region inequality').press('Enter')
   assert state()['objects'][-1]['regionCondition']=='x>0'
   assert not errors,errors
   print('PASS Round130 Chromium compact columns, Enter commit, condition persistence, rollback, removal, 2D/3D')
  finally:browser.close()
if __name__=='__main__':run()
