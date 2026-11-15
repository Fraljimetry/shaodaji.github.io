"""Round 168 real Chromium: pick preview, freehand drag/undo, Node settings layout."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,1024):
   page=browser.new_page(viewport={'width':width,'height':900});page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#drawing').focus();page.keyboard.press('v')
   page.locator('[data-tool-choice="freehand"]').click()
   canvas=page.locator('#drawing').bounding_box();x=canvas['x']+canvas['width']*.4;y=canvas['y']+canvas['height']*.4
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+35,y+20,steps=9);page.mouse.move(x+65,y+35,steps=9);page.mouse.up()
   page.wait_for_timeout(150)
   free=[o for o in snap()['objects'] if o['type']=='freehand'];assert free, snap()['objects']
   old=free[-1]['path'];id=free[-1]['id']
   page.locator('#drawing').focus();page.keyboard.press('v')
   el=page.locator(f'#drawing [data-id="{id}"]').first
   bbox=el.bounding_box();assert bbox,bbox
   # choose a known on-curve point by projecting a recorded control point
   a,b=old[len(old)//2],old[len(old)//2+1]
   # SVG path geometry is used to find a precise visible hit point
   coords=el.evaluate('(n)=>{const p=n.tagName.toLowerCase()==="path"?n:n.querySelector("path");const q=p.getPointAtLength(p.getTotalLength()/2); const m=p.getScreenCTM();return {x:m.a*q.x+m.c*q.y+m.e,y:m.b*q.x+m.d*q.y+m.f};}')
   x,y=coords['x'],coords['y']
   page.mouse.move(x,y);page.wait_for_timeout(110)
   assert page.locator(f'#drawing [data-id="{id}"].pick-preview').count()>0, 'no preview on free curve'
   page.mouse.down();page.mouse.move(x+40,y+25,steps=8);page.mouse.up();page.wait_for_timeout(140)
   moved=next(o for o in snap()['objects'] if o['id']==id)['path']
   assert abs(moved[0][0]-old[0][0])>.2 and abs(moved[0][1]-old[0][1])>.2,(old[0],moved[0])
   page.locator('#drawing').focus();page.keyboard.press('Control+z');page.wait_for_timeout(150)
   restored=next(o for o in snap()['objects'] if o['id']==id)['path']
   assert abs(restored[0][0]-old[0][0])<1e-7,(old[0],restored[0])
   # Node properties: both controls belong to the same visible row.
   # Node creation is exercised using its visual tool instead of command parser.
   page.locator('[data-tool-choice="node"]').click()
   page.once('dialog',lambda dialog:dialog.accept('N'))
   page.mouse.click(canvas['x']+canvas['width']*.7,canvas['y']+canvas['height']*.6)
   page.wait_for_timeout(100)
   node=page.locator('#properties .node-font-row')
   assert node.count()==1,'Node inline controls missing'
   r1=node.locator('.field').bounding_box();r2=node.locator('.check').bounding_box()
   assert abs(r1['y']-r2['y'])<15,(r1,r2)
   # The cursor preview must pick the point, not a line drawn later over it.
   page.locator('#command').fill('P=(0,0)');page.locator('#command-form button').click()
   page.locator('#command').fill('A=(0,-2)');page.locator('#command-form button').click()
   page.locator('#command').fill('B=(0,2)');page.locator('#command-form button').click()
   page.locator('#command').fill('Line(A,B)');page.locator('#command-form button').click()
   page.wait_for_timeout(150)
   objs=snap()['objects'];target=next(o for o in objs if o.get('name')=='P' and o['type']=='point')
   pt=page.locator(f'#drawing [data-id="{target["id"]}"]').first
   box=pt.bounding_box();assert box
   page.locator('[data-tool-choice="circleInversion"]').click()
   page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
   page.wait_for_timeout(120)
   assert page.locator(f'#drawing [data-id="{target["id"]}"].pick-preview').count()>0,'overlapping point not previewed'
   assert not errors,errors
   print('ROUND168_HOVER_DRAG_PASS',width,flush=True)
   page.close()
 finally:browser.close()
