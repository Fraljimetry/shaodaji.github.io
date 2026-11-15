"""Actual Chromium: draw regular Free Curve circle; use it as a native tangent-circle support."""
import os,json,math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1440,'height':900});page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
  state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
  page.locator('[data-tool-choice="freehand"]').click()
  page.locator('#properties select[aria-label="Shape"]').select_option('ellipse')
  box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']*.52;cy=box['y']+box['height']*.5
  r=55
  page.mouse.move(cx+r,cy);page.mouse.down()
  for i in range(1,65):
   t=2*math.pi*i/64;page.mouse.move(cx+r*math.cos(t),cy+r*math.sin(t))
  page.mouse.up();page.wait_for_timeout(250)
  curves=[o for o in state()['objects'] if o['type']=='freehand'];assert len(curves)==1 and curves[0]['curveRegular'],curves
  shape=curves[0];xs=[p[0] for p in shape['path']];ys=[p[1] for p in shape['path']]
  x=(max(xs)+min(xs))/2;y=(max(ys)+min(ys))/2;radius=(max(xs)-min(xs))/2
  page.locator('#command').fill(f'P=({x+radius*1.7:.8f},{y:.8f})');page.locator('#command-form button').click();page.wait_for_timeout(160)
  point=next(o for o in state()['objects'] if o['type']=='point')
  page.locator('[data-tool-choice="tangentCircle"]').click()
  mark=page.locator(f'#drawing circle[data-id="{point["id"]}"]').first
  mark.wait_for(state='visible');bb=mark.bounding_box();
  for _ in range(10):
   if bb:break
   page.wait_for_timeout(100);bb=mark.bounding_box()
  assert bb,('missing point box',point)
  page.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
  ring=page.locator(f'#drawing path[data-id="{shape["id"]}"]').first
  ring.wait_for(state='visible');bb=ring.bounding_box()
  # Select a visibly painted point in the upper-right quadrant, avoiding marker overlaps.
  page.mouse.click(bb['x']+bb['width']*.853553,bb['y']+bb['height']*.146447)
  page.wait_for_timeout(170)
  tangents=[o for o in state()['objects'] if o['type']=='tangentCircle']
  assert len(tangents)==2 and all(o['refs']==[point['id'],shape['id']] for o in tangents),(tangents,state()['objects'])
  assert not errors,errors
  print('PASS Chromium user-drawn Free Curve circle -> two native tangent constructions',flush=True)
 finally:browser.close()
