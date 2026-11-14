"""Round51M: rendered glyph markers and bulk Properties no-overlap smoke."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1380,'height':900})
  page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load')
  page.wait_for_selector('[data-tool-choice="pointOnObject"] svg')
  assert page.locator('[data-tool-choice="pointOnObject"] svg circle[fill="currentColor"]').count()==1
  assert page.locator('[data-tool-choice="parallelThrough"] svg circle[fill="currentColor"]').first.get_attribute('cy')=='7'
  arc=page.locator('[data-tool-choice="fixedAngle"] svg path').nth(1).get_attribute('d')
  assert 'M7.15 15.23A4 4' in arc and 'M6.35 12.97A6.4 6.4' in arc
  # Exercise the real multi-object inspector, including a fill-bearing polygon
  # and a Point, which produces Stroke, Fill, Opacity, Width and Point size.
  for command in ['A=(0,0)','B=(4,0)','C=(0,3)','Polygon(A,B,C)']:
   page.locator('#command').fill(command)
   page.locator('#command-form button').click()
   page.wait_for_timeout(60)
  page.locator('#objects .object[data-id="o1"]').click()
  page.locator('#objects .object[data-id="o4"]').click(modifiers=['Control'])
  style=page.locator('#properties .style-controls-grid')
  assert style.locator('.style-fill').count()==1
  bounds={name:style.locator('.style-'+name).bounding_box() for name in ['pointsize','opacity','width']}
  assert all(bounds.values()),bounds
  assert bounds['pointsize']['y']>=max(bounds['opacity']['y']+bounds['opacity']['height'],bounds['width']['y']+bounds['width']['height'])+2,bounds
  # Neither the long caption nor the number input may overflow the inspector.
  point=style.locator('.style-pointsize')
  point_box=point.bounding_box()
  input_box=point.locator('input[type=number]').bounding_box()
  assert input_box['x']>=point_box['x'] and input_box['x']+input_box['width']<=point_box['x']+point_box['width']+1,(point_box,input_box)
  print('ROUND51M_CHROMIUM_PASS: one constrained-point marker, upper parallel marker, two arcs, no bulk pointsize overlap')
 finally:
  browser.close()
