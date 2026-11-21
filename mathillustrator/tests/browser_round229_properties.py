"""Round 229: shared 2D properties, expression editing and slider appearance."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1200,'height':800})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def enter(src):
    page.locator('#unified-algebra-input').fill(src);page.locator('#unified-algebra-input').press('Enter')
   enter('a = Slider(0, 10, 0.1, 3)')
   enter('A = (a*cos(pi/3), a)')
   page.locator('#objects .object[data-id]').first.click()
   props=page.locator('#properties')
   assert props.locator('label.field').first.inner_text().startswith('Name')
   assert props.get_by_label('X expression').count()==0
   assert props.get_by_label('Y expression').count()==0
   xs=props.locator('.point-coordinate-grid input')
   assert xs.count()==2 and xs.nth(0).input_value()=='a*cos(pi/3)' and xs.nth(1).input_value()=='a'
   xs.nth(0).fill('2*a');xs.nth(0).press('Tab')
   point=next(x for x in snap()['objects'] if x['name']=='A')
   assert point['xyExpr']==['2*a','a'] and point['xy']==[6,3],point
   xs=props.locator('.point-coordinate-grid input');xs.nth(0).fill('undefined_name');xs.nth(0).press('Tab')
   assert next(x for x in snap()['objects'] if x['name']=='A')['xyExpr'][0]=='2*a'
   page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
   assert props.locator('label.field').first.inner_text().startswith('Name')
   props.locator('input[type=color]').fill('#ee3377');props.locator('input[type=color]').press('Tab')
   props.get_by_label('Opacity').fill('0.5');props.get_by_label('Opacity').press('Tab')
   props.get_by_label('Show border').uncheck()
   slider=snap()['algebra']['sliders'][0]
   assert slider['color']=='#ee3377' and slider['opacity']==.5 and slider['border'] is False,slider
   group=page.locator('#drawing [data-slider-control="a"]')
   page.wait_for_function("() => {const e=document.querySelector('#drawing [data-slider-control=\"a\"]');return e && e.getAttribute('opacity')==='0.5';}")
   assert group.locator('rect').count()==0
   assert group.locator('[data-slider-handle]').get_attribute('fill')=='#ee3377'
   props.get_by_label('Opacity').fill('2');props.get_by_label('Opacity').press('Tab')
   assert snap()['algebra']['sliders'][0]['opacity']==.5

   page.locator('#objects .object[data-id]').first.click()
   assert props.locator('label.field').first.inner_text().startswith('Name')
   assert not errors,errors
   print('ROUND229_PROPERTIES_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
