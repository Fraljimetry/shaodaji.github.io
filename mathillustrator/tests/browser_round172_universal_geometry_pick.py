"""Actual Chromium: point-first Move/hover, tool-compatible curve picking, cycle."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,1024):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_default_timeout(15000)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   def snapshot():return json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(text):
    page.locator('#plot-mode').select_option('function')
    page.locator('#command').fill(text)
    page.locator('#command-form button').click()
    page.wait_for_timeout(70)
   for text in ['P=(0,0)','A=(0,-2)','B=(0,2)','Line(A,B)'] :cmd(text)
   point=page.locator('#drawing [data-id="o1"]').first
   bounds=point.bounding_box();assert bounds,bounds
   x=bounds['x']+bounds['width']/2;y=bounds['y']+bounds['height']/2
   # Move/selection preview must agree even when line drawn after point.
   page.locator('[data-tool-choice="select"]').click()
   page.mouse.move(x+22,y+16);page.mouse.move(x,y)
   assert page.locator('#drawing [data-id="o1"].pick-preview').count()>0, 'hover target should be point'
   page.mouse.click(x,y)
   assert page.locator('#drawing [data-id="o1"].selected-shape').count()>0,'actual target should equal preview'
   # Curve-only mode must not be intercepted by a nearby point.
   page.locator('[data-tool-choice="pointOnObject"]').click()
   page.mouse.move(x+22,y+16);page.mouse.move(x,y)
   assert page.locator('#drawing [data-id="o4"].pick-preview').count()>0,'curve-compatible preview should be line'
   page.mouse.click(x,y)
   assert not errors,errors
   page.close();print('ROUND172_UNIVERSAL_PICK_PASS',width,flush=True)
 finally:browser.close()
