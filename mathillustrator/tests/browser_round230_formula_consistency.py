"""Round 230: formula editing, shared Properties, rollback, 2D/3D compatibility."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1200,'height':800})
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   assert page.locator('#unified-algebra-input').is_visible()
   def enter(src):
    page.locator('#unified-algebra-input').fill(src)
    page.locator('#unified-algebra-input').press('Enter')
   enter('a = Slider(0, max(5, 10), 0.5, min(4, 7))')
   assert snap()['algebra']['sliders'][0]['value']==4,snap()['algebra']
   enter('A = (min(a, 2), max(3, a))')
   point=lambda:next(o for o in snap()['objects'] if o['name']=='A')
   assert point()['xy']==[2,4],point()
   page.locator('#objects [data-id]').first.click()
   props=page.locator('#properties')
   assert props.locator('label.field').first.inner_text().startswith('Name')
   xs=props.locator('.point-coordinate-grid input')
   assert xs.count()==2 and xs.nth(0).input_value()=='min(a, 2)'
   xs.nth(0).fill('atan2(a, 2)');xs.nth(0).press('Tab')
   assert abs(point()['xy'][0]-1.1071487177940904)<1e-9,point()
   xs=props.locator('.point-coordinate-grid input');xs.nth(0).fill('min(a, )');xs.nth(0).press('Tab')
   assert point()['xyExpr'][0]=='atan2(a, 2)',point()
   page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
   assert props.locator('label.field').first.inner_text().startswith('Name')
   props.get_by_role('textbox',name='Value').fill('2');props.get_by_role('textbox',name='Value').press('Tab')
   assert point()['xy'][1]==3,point()
   page.locator('#object-input-toggle').click()
   assert page.locator('#object-search').is_visible()
   page.locator('#object-input-toggle').click()
   assert page.locator('#unified-algebra-input').is_visible()
   assert not errors,errors
   print('ROUND230_FORMULA_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
