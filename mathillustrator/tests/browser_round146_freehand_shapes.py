"""Real Chromium interactions for freehand shape Properties (desktop/mobile)."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import os
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,390,320):
   page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(6000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   page.locator('#object-count').wait_for(state='attached')
   if width<700:page.locator('#right-collapse').click()
   # Choose the shape BEFORE the first gesture, using actual Properties UI.
   page.locator('[data-tool-choice="freehand"]').first.click()
   if width<700:page.locator('#right-collapse').click()
   predraw=page.locator('#properties select[aria-label="Shape"]')
   assert predraw.input_value()=='free'
   if width<700:page.locator('#left-collapse').click()
   predraw.select_option('ellipse')
   if width<700:page.locator('#left-collapse').click()
   box=page.locator('#drawing').bounding_box()
   cx=box['x']+box['width']*.52;cy=box['y']+box['height']*.48
   pts=[(cx-40,cy-30),(cx+43,cy-30),(cx+43,cy+32),(cx-40,cy+32),(cx-40,cy-30)]
   page.mouse.move(*pts[0]);page.mouse.down()
   for a,b in zip(pts,pts[1:]):
    for j in range(1,15):
     t=j/14;page.mouse.move(a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t)
   page.mouse.up()
   assert page.locator('#object-count').inner_text()=='1'
   if width<700:page.locator('#left-collapse').click()
   page.locator('.object').first.click()
   shape=page.locator('#properties select[aria-label="Shape"]')
   assert shape.input_value()=='ellipse'
   shape.select_option('polygon')
   state=page.evaluate('JSON.parse(window.__round36Snapshot())')
   obj=state['objects'][0];assert obj['curveShape']=='polygon' and obj['closed'] and obj['curveRegular'],obj
   heads=page.locator('#properties select[aria-label="Arrowheads"]')
   assert heads.is_disabled()
   line=page.locator('#properties select[aria-label="Line style"]')
   assert line.locator('option').count()==3
   reg=page.locator('#properties .freehand-regular-check input')
   reg.uncheck();state=page.evaluate('JSON.parse(window.__round36Snapshot())');assert state['objects'][0]['curveRegular'] is False
   shape.select_option('ellipse');state=page.evaluate('JSON.parse(window.__round36Snapshot())');assert state['objects'][0]['curveShape']=='ellipse'
   assert heads.is_disabled()
   reg.check();state=page.evaluate('JSON.parse(window.__round36Snapshot())');assert state['objects'][0]['curveRegular'] is True
   shape.select_option('free');assert not page.locator('#properties select[aria-label="Arrowheads"]').is_disabled()
   state=page.evaluate('JSON.parse(window.__round36Snapshot())');assert state['objects'][0]['curveShape']=='free'
   # Control rows should align horizontally and stay within the Properties region.
   labels=page.locator('#properties .freehand-shape-grid > *')
   assert labels.count()==4
   bounds=[labels.nth(i).bounding_box() for i in range(4)]
   assert abs((bounds[0]['y']+bounds[0]['height'])-(bounds[1]['y']+bounds[1]['height']))<3 and abs(bounds[2]['y']-bounds[3]['y'])<3,bounds
   assert not errors,errors
   print('PASS Round146 real Chromium',width,flush=True)
   page.close()
 finally:browser.close()
