"""Round 231: compact properties, shared Hide glyph, sole menu-based visibility."""
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
   page.locator('#unified-algebra-input').fill('a = Slider(0, 10, 0.5, 3)')
   page.locator('#unified-algebra-input').press('Enter')
   page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
   props=page.locator('#properties')
   assert props.locator('label.field').first.inner_text().startswith('Name')
   assert props.get_by_text('Show on canvas').count()==0
   assert props.locator('.slider-range-grid > .field').count()==4
   assert props.locator('.slider-appearance-grid .style-opacity').count()==1
   measurements=props.locator('.slider-range-grid').evaluate('e => {const items=[...e.children].map(x=>x.getBoundingClientRect());return {first:items[0].top,second:items[1].top,third:items[2].top,width:items[0].width}}')
   assert abs(measurements['first']-measurements['second'])<3 and measurements['third']>measurements['first'],measurements
   assert measurements['width']<150,measurements
   menu=page.locator('#objects [data-slider="a"] .object-menu-toggle');menu.click()
   svg=page.locator('#object-action-menu [data-action="visibility"] svg').inner_html()
   assert 'M10.6 10.7' in svg and 'M6 6.1' in svg,svg
   page.locator('#object-action-menu [data-action="visibility"]').click()
   assert snap()['algebra']['sliders'][0]['visible'] is False
   menu=page.locator('#objects [data-slider="a"] .object-menu-toggle');menu.click()
   assert page.locator('#object-action-menu [data-action="visibility"]').get_attribute('aria-label')=='Show'
   page.locator('#object-action-menu [data-action="visibility"]').click()
   assert snap()['algebra']['sliders'][0]['visible'] is True
   props.get_by_label('Minimum').fill('1');props.get_by_label('Minimum').press('Tab')
   assert snap()['algebra']['sliders'][0]['min']==1
   props.get_by_label('Opacity').fill('0.6');props.get_by_label('Opacity').press('Tab')
   assert snap()['algebra']['sliders'][0]['opacity']==.6
   assert not errors,errors
   print('ROUND231_SLIDER_COMPACT_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
