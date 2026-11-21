"""Round 236: Objects/Algebra row parity, slider property track and order."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':860});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#algebra-toggle').click()
   for expr in ['a = Slider(0, 10, 0.5, 2)','b = Slider(0, 5, 0.5, 1)','A = (a, 0)','B = (0, b)','s = Segment(A,B)']:
    page.locator('#algebra-input').fill(expr);page.locator('#algebra-form button').click()
   rows=page.locator('#algebra-list .algebra-object-row')
   assert rows.count()==5,rows.count()
   assert page.locator('#algebra-list .object-order-grip').count()==5
   assert page.locator('#algebra-list .glyph svg').count()==5
   assert page.locator('#algebra-list input[type=range]').count()==0
   assert page.locator('#algebra-list .slider-play-toggle').count()==2
   page.locator('[data-slider="a"] .algebra-entry-label').click()
   rng=page.locator('#properties .slider-property-value-range');assert rng.count()==1
   mode=page.locator('#properties').get_by_label('Play mode').bounding_box()
   assert rng.bounding_box()['y']>mode['y']
   rng.fill('4')
   assert snap()['algebra']['sliders'][0]['value']==4
   assert next(x for x in snap()['objects'] if x['name']=='A')['xy'][0]==4
   page.locator('#undo').click();assert snap()['algebra']['sliders'][0]['value']==2
   page.locator('#redo').click();assert snap()['algebra']['sliders'][0]['value']==4
   page.locator('#algebra-list [data-slider="a"] .object-order-grip').focus()
   page.keyboard.press('Alt+ArrowUp')
   assert [x['name'] for x in snap()['algebra']['sliders']]==['b','a']
   page.locator('#undo').click();assert [x['name'] for x in snap()['algebra']['sliders']]==['a','b']
   # Actual pointer-driven drag/drop, not just keyboard order.
   page.locator('#algebra-list [data-slider="b"] .object-order-grip').drag_to(page.locator('#algebra-list [data-slider="a"]'),target_position={'x':35,'y':40})
   assert [x['name'] for x in snap()['algebra']['sliders']]==['b','a']
   page.locator('#undo').click();assert [x['name'] for x in snap()['algebra']['sliders']]==['a','b']
   page.locator('#algebra-list [data-id] .object-order-grip').first.focus()
   page.keyboard.press('Alt+ArrowUp')
   assert [x['name'] for x in snap()['objects']]!=['A','B','s']
   page.locator('#algebra-list [data-slider="a"] .slider-play-toggle').click()
   page.wait_for_timeout(200)
   assert snap()['algebra']['sliders'][0]['value']!=4
   page.get_by_role('button',name='Pause slider a').click()
   assert not errors,errors
   print('ROUND236_ALGEBRA_ROWS_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
