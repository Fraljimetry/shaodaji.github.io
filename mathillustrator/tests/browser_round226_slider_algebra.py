"""Round 226 real Chromium: slider, algebra-backed point, derived geometry, undo and failures."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':880})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.locator('[data-tool-choice="slider"]').wait_for()
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   assert page.locator('#algebra-panel').is_hidden()
   page.locator('#algebra-toggle').click()
   def enter(value):
    page.locator('#algebra-input').fill(value);page.locator('#algebra-form button').click()
   enter('a = Slider(1, 6, 0.5, 2)')
   enter('A = (a*cos(0), a*sin(pi/2))')
   enter('B = (0, 0)')
   enter('Segment(A,B)')
   d=snapshot();assert len(d['objects'])==3 and len(d['algebra']['sliders'])==1
   assert d['objects'][0]['xy']==[2,2] and d['objects'][2]['type']=='segment'
   ids=[o['id'] for o in d['objects']]
   page.locator('#algebra-list input[type=range]').fill('4')
   d=snapshot();assert d['objects'][0]['xy']==[4,4] and d['objects'][2]['refs']==ids[:2]
   page.locator('#undo').click();assert snapshot()['objects'][0]['xy']==[2,2]
   page.locator('#redo').click();assert snapshot()['objects'][0]['xy']==[4,4]
   enter('C = (missingVariable, 2)');assert len(snapshot()['objects'])==3
   page.locator('#algebra-list button[aria-label="Delete slider a"]').click()
   assert len(snapshot()['algebra']['sliders'])==1 and snapshot()['objects'][0]['xy']==[4,4]
   # Move the on-canvas control: the same dependent geometry must update.
   old_cx=page.locator('#drawing [data-slider-handle="a"]').get_attribute('cx')
   page.locator('#algebra-list input[type=range]').fill('2')
   # A pending RAF may still display the handle at the previous slider value.
   # Wait for the current model value to be painted before attempting the drag.
   page.wait_for_function("old => { const e=document.querySelector('#drawing [data-slider-handle=\"a\"]');return e && e.getAttribute('cx') !== old; }",arg=old_cx)
   h=page.locator('#drawing [data-slider-handle="a"]').evaluate('(e)=>e.getBoundingClientRect().toJSON()')
   page.mouse.move(h['x']+h['width']/2,h['y']+h['height']/2);page.mouse.down()
   page.mouse.move(h['x']+90,h['y']+h['height']/2,steps=5);page.mouse.up()
   assert snapshot()['algebra']['sliders'][0]['value']>2
   assert snapshot()['objects'][0]['xy'][0]==snapshot()['algebra']['sliders'][0]['value']
   page.locator('[data-tool-choice="slider"]').click()
   page.locator('#drawing').click(position={'x':550,'y':400})
   assert len(snapshot()['algebra']['sliders'])==2
   # Property expression edits participate in ordinary undo and validation.
   page.locator('#objects-tab').click();page.locator('#objects [data-id="'+ids[0]+'"]').click()
   field=page.locator('#properties').get_by_label('X expression')
   field.fill('a+1');field.press('Tab')
   assert snapshot()['objects'][0]['xy'][0]==snapshot()['algebra']['sliders'][0]['value']+1
   # Changing plotting mode must preserve algebra, and not surface sliders in 3D output.
   page.locator('#scene3d-enable').check();assert len(snapshot()['algebra']['sliders'])==2
   assert page.locator('#drawing [data-slider-handle]').count()==0
   assert not errors,errors
   print('ROUND226_SLIDER_ALGEBRA_CHROMIUM_PASS: dependencies, undo/redo, invalid rollback, canvas drag, property editor, 3D isolation')
  finally:browser.close()
if __name__=='__main__':run()
