"""Round 167 real Chromium: picking a point under a later line for circle inversion.
Also verifies existing Move (V) / Pan (H) keyboard shortcuts with canvas focus.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,1024):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_default_timeout(15000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   def snap(): return json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expr):
    page.locator('#plot-mode').select_option('function')
    page.locator('#command').fill(expr)
    page.locator('#command-form button').click()
    page.wait_for_timeout(100)
   for text in ['P=(0,0)','A=(0,-2)','B=(0,2)','Line(A,B)','C=(1.5,0)','D=(2,0)','Circle(C,D)']:
    cmd(text)
   assert len(snap()['objects'])==7,snap()['objects']
   point=page.locator('#drawing [data-id="o1"]').first
   box=point.bounding_box();assert box, 'point marker missing'
   x=box['x']+box['width']/2;y=box['y']+box['height']/2
   # Even when a later line overlays the point in the SVG event stack,
   # the semantic source must be the actual visible point anchor.
   page.locator('[data-tool-choice="circleInversion"]').click()
   page.mouse.click(x,y)
   page.wait_for_timeout(200)
   # Confirm the second click selects the circle, not one of its center/radius points.
   circle=page.locator('#drawing [data-id="o7"]').first
   page.wait_for_function('''() => {const n=document.querySelector('#drawing [data-id="o7"]');return n && n.getBoundingClientRect().width>0;}''')
   page.wait_for_timeout(150)
   cb=circle.first.evaluate('(node)=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}')
   assert cb['width']>0 and cb['height']>0, cb
   page.mouse.click(cb['x']+cb['width']/2,cb['y']+1)
   objs=snap()['objects']
   assert len(objs)==8,objs
   assert objs[-1]['type']=='transformCopy' and objs[-1]['transform']=='invert',objs[-1]
   assert objs[-1]['refs']==['o1','o7'],objs[-1]
   page.locator('#drawing').focus()
   page.keyboard.press('v')
   assert page.locator('#drawing').get_attribute('data-tool')=='select'
   page.keyboard.press('h')
   assert page.locator('#drawing').get_attribute('data-tool')=='pan'
   assert not errors,errors
   page.close()
   print('ROUND167_POINT_OVER_LINE_PASS',width,flush=True)
 finally:browser.close()
