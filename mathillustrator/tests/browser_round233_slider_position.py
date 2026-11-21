"""Round 233: a 2D slider can be repositioned independently of its value."""
import os, json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':880})
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#algebra-toggle').click()
   def enter(s):
    page.locator('#algebra-input').fill(s);page.locator('#algebra-form button').click()
   enter('a = Slider(0, 10, 0.5, 3)')
   enter('P = (a, 2)')
   slider=lambda: snap()['algebra']['sliders'][0]
   initial=slider();old_xy=initial['xy'][:];old_val=initial['value'];old_point=next(o for o in snap()['objects'] if o['name']=='P')['xy'][:]
   label=page.locator('#drawing [data-slider-control="a"] text')
   label.wait_for()
   rect=label.bounding_box();assert rect, 'slider label not rendered'
   x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+82,y+47,steps=6);page.mouse.up()
   after=slider()
   assert abs(after['xy'][0]-old_xy[0])>.3 and abs(after['xy'][1]-old_xy[1])>.3,(old_xy,after)
   assert after['value']==old_val,after
   assert next(o for o in snap()['objects'] if o['name']=='P')['xy']==old_point
   page.locator('#undo').click();assert slider()['xy']==old_xy
   page.locator('#redo').click();assert slider()['xy']==after['xy']
   # The handle still changes the value, not the position.
   knob=page.locator('#drawing [data-slider-handle="a"]');knob.wait_for()
   box=knob.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+45,y,steps=5);page.mouse.up()
   assert slider()['xy']==after['xy']
   assert slider()['value']>old_val
   assert not errors,errors
   print('ROUND233_SLIDER_POSITION_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
