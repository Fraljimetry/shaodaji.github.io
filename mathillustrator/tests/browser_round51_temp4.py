"""Round51 temp4 real Chromium verification: read-only live measurements,
canvas-only double-click navigation, no single-click navigation, compact picker,
geometry list glyphs, range hints, and 2D/3D range alignment.
"""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1450,'height':950},accept_downloads=True)
   page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(200)
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(src):
    page.locator('#command').fill(src)
    page.locator('#command-form button').click()
    page.wait_for_timeout(110)
   def read_measure(obj_id):
    page.locator(f'#objects .object[data-id="{obj_id}"]').click()
    field=page.locator('#properties .measurement-field')
    assert field.count()==1,(obj_id,page.locator('#properties').inner_text())
    item=field.locator('input.measurement-value')
    assert item.count()==1 and item.get_attribute('readonly') is not None
    assert item.get_attribute('aria-readonly')=='true'
    assert abs(item.bounding_box()['width']-page.locator('#properties .field input:not([type=color])').first.bounding_box()['width'])<3
    return field.inner_text(),float(item.input_value())
   for source in ['A=(0,0)','B=(4,0)','C=(0,3)','D=(4,3)','Segment(A,B)','Circle(A,B)','Polygon(A,B,C)','Ellipse(A,B,C)']:
    cmd(source)
   assert len(state()['objects'])==11,state()['objects']
   label,length=read_measure('o5');assert 'Length' in label and abs(length-4)<1e-8
   label,area=read_measure('o6');assert 'Area' in label and abs(area-16*3.14159265)<1e-6
   label,area=read_measure('o7');assert 'Area' in label and abs(area-6)<1e-8
   label,area=read_measure('o11');assert 'Area' in label and area>0
   print('stage: live length and polygon/circle/ellipse area PASS',flush=True)
   point=page.locator('#objects .object[data-id="o2"]');point.click()
   x=page.locator('#properties .twocol label').first.locator('input');x.fill('6');x.dispatch_event('change');page.wait_for_timeout(130)
   label,length=read_measure('o5');assert abs(length-6)<1e-8
   page.locator('#undo').click();page.wait_for_timeout(130)
   label,length=read_measure('o5');assert abs(length-4)<1e-8
   page.locator('#redo').click();page.wait_for_timeout(130)
   label,length=read_measure('o5');assert abs(length-6)<1e-8
   print('stage: point drag-equivalent dependent update, undo and redo PASS',flush=True)
   page.locator('[data-tool-choice="select"]').click()
   page.locator('#object-search').fill('NoMatchingObject')
   target=page.locator('#drawing [data-id="o2"]').first
   target.click(force=True);page.wait_for_timeout(120)
   assert page.locator('#object-search').input_value()=='NoMatchingObject', 'single click unexpectedly navigated'
   # A genuine double-click on an existing point must scroll/focus the left item.
   target=page.locator('#drawing [data-id="o2"]').first
   target.dblclick(force=True);page.wait_for_timeout(180)
   assert page.locator('#object-search').input_value()=='', 'double click did not navigate the filtered list'
   item=page.locator('#objects .object[data-id="o2"]')
   assert item.count()==1 and 'selected' in item.get_attribute('class')
   assert item.is_visible(), 'double-click navigation target is not visible'
   print('stage: single click selection-only; object double click navigates list PASS',flush=True)
   page.locator('#objects .object[data-id="o5"]').click()
   style=page.locator('#properties .style-controls-grid.stroke-only-grid .style-stroke')
   stroke=style.locator('.field');chooser=style.locator('input[type=color]')
   sb=stroke.bounding_box();cb=chooser.bounding_box()
   assert cb['x']>sb['x']+sb['width']*.45 and abs(cb['y']-sb['y'])<12,(sb,cb)
   assert cb['width']<50
   assert len(style.locator('.color-swatch').all())==10
   settings=page.locator('#polygon-sides').locator('xpath=..')
   assert '3' in (settings.get_attribute('title') or '') and '100' in (settings.get_attribute('title') or '')
   print('stage: Stroke picker inline, palette and bound hover PASS',flush=True)
   # 2D numeric boxes; all min/max columns start on the same x coordinate.
   page.locator('#plot-mode').select_option('vectorField')
   page.locator('#command').fill('x');page.locator('#command-y').fill('y')
   page.locator('#command-form button').click();page.wait_for_timeout(160)
   inputs=page.locator('#properties .plot-region-editor>.field input')
   assert inputs.count()==4
   bounds=[item.bounding_box() for item in inputs.all()]
   assert abs(bounds[0]['x']-bounds[2]['x'])<2 and abs(bounds[1]['x']-bounds[3]['x'])<2,bounds
   page.locator('#scene3d-enable').check();page.wait_for_timeout(110)
   page.locator('#plot-mode').select_option('parametric3d')
   for selector,value in [('#command','cos(u)'),('#command-y','sin(v)'),('#command-z','u+v')]:page.locator(selector).fill(value)
   page.locator('#command-form button').click();page.wait_for_timeout(160)
   region=page.locator('#properties .plot-region-editor>.field input')
   params=page.locator('#properties .parametric-range-grid>.field input')
   assert region.count()==6 and params.count()==4
   r=[i.bounding_box() for i in region.all()]
   assert abs(r[0]['x']-r[2]['x'])<2 and abs(r[1]['x']-r[3]['x'])<2,r
   assert all('Finite' in (a.get_attribute('title') or '') for a in params.all())
   print('stage: 2D / 3D range fields aligned PASS',flush=True)
   assert not errors,errors
   print('ROUND51_TEMP4_CHROMIUM_PASS',flush=True)
  finally:browser.close()
if __name__=='__main__':main()
