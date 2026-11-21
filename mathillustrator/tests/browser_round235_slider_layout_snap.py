"""Round 235: compact slider inspector and grid-snapped slider placement."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':880})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#algebra-toggle').click()
   page.locator('#algebra-input').fill('a = Slider(0, 10, 0.1, 2)')
   page.locator('#algebra-form button').click()
   page.locator('#algebra-list [data-slider="a"] .algebra-entry-label').click()
   props=page.locator('#properties')
   assert props.get_by_role('button',name='Play slider a').count()==0
   mode=props.get_by_label('Play mode');speed=props.get_by_label('Speed (cycles/s)')
   a,b=mode.bounding_box(),speed.bounding_box()
   assert abs(a['y']-b['y'])<7 and a['x']<b['x'],(a,b)
   border=props.locator('.slider-border-control input[type=checkbox]')
   bounds=border.bounding_box()
   assert 10<=bounds['width']<=20 and 10<=bounds['height']<=20,bounds
   opacity=props.get_by_label('Opacity').bounding_box()
   assert bounds['y']>opacity['y'],(bounds,opacity)
   # Turn snapping on, using the application's persisted setting.
   page.locator('#snap').check()
   page.locator('#snap-step').fill('1')
   page.locator('#snap-step').dispatch_event('change')
   slider=lambda:snap()['algebra']['sliders'][0]
   original=slider()['xy'][:]
   label=page.locator('#drawing [data-slider-control="a"] text');label.wait_for()
   box=label.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+76,y+37,steps=5);page.mouse.up()
   pos=slider()['xy'];assert pos!=original,(pos,original)
   assert all(abs(v-round(v))<1e-7 for v in pos),pos
   assert slider()['value']==2
   page.locator('#undo').click();assert slider()['xy']==original
   page.locator('#redo').click();assert slider()['xy']==pos
   # Turning snapping off allows arbitrary placement.
   page.locator('#snap').uncheck()
   label=page.locator('#drawing [data-slider-control="a"] text');label.wait_for()
   box=label.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+39,y+23,steps=5);page.mouse.up()
   new=slider()['xy'];assert any(abs(v-round(v))>1e-4 for v in new),new
   assert not errors,errors
   print('ROUND235_SLIDER_LAYOUT_SNAP_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
