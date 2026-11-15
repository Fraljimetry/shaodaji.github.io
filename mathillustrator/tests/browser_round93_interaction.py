"""Round 93 — real Chromium pointer selection/drag/cancel verification."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
 with sync_playwright() as pw:
  exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_default_timeout(20000)
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   d=state();d['objects']=[{'id':'o1','name':'A','type':'point','xy':[0,0],'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}}];d['nextId']=2
   page.locator('#open-file').set_input_files({'name':'r93.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length===1')
   marker=page.locator('#drawing circle[data-id="o1"]');marker.wait_for(state='visible')
   bbox=marker.bounding_box();assert bbox
   x=bbox['x']+bbox['width']/2;y=bbox['y']+bbox['height']/2
   page.mouse.click(x,y)
   assert page.locator('#properties .field input').first.input_value()=='A','Canvas point selection did not reach properties'
   original=state()['objects'][0]['xy']
   page.wait_for_timeout(550) # avoid intentional double-click navigation
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+55,y-30,steps=7)
   assert state()['objects'][0]['xy']!=original,'Pointer drag did not move the point'
   page.keyboard.press('Escape')
   assert state()['objects'][0]['xy']==original,'Escape did not cancel pointer drag'
   page.mouse.up()
   assert state()['objects'][0]['xy']==original,'Canceled pointerup committed a move'
   bbox=marker.bounding_box();x=bbox['x']+bbox['width']/2;y=bbox['y']+bbox['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+62,y-35,steps=7);page.mouse.up()
   moved=state()['objects'][0]['xy'];assert moved!=original,'Committed drag did not move point'
   assert page.locator('#undo').is_enabled()
   page.locator('#undo').click();assert state()['objects'][0]['xy']==original,'Undo failed after drag'
   page.locator('#redo').click();assert state()['objects'][0]['xy']==moved,'Redo failed after drag'
   stage=page.locator('#drawing');stage.dblclick(position={'x':25,'y':25},force=True)
   assert page.locator('#properties .field input').count()==0,'Empty-canvas double-click retained selection'
   # Locked point stays selectable but cannot be moved by the pointer.
   locked=state();locked['objects'][0]['locked']=True
   page.locator('#open-file').set_input_files({'name':'r93_locked.json','mimeType':'application/json','buffer':json.dumps(locked).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects[0].locked===true')
   marker=page.locator('#drawing circle[data-id="o1"]');bbox=marker.bounding_box()
   assert bbox,'Locked marker missing'
   x=bbox['x']+bbox['width']/2;y=bbox['y']+bbox['height']/2
   page.wait_for_timeout(550)
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+70,y+40,steps=5);page.mouse.up()
   assert state()['objects'][0]['xy']==moved,'Locked point moved under pointer'
   assert not errors,errors
   print('ROUND93_CHROMIUM_PASS selection, drag, Escape cancellation, commit, undo/redo, empty-canvas deselect, locked point')
  finally:browser.close()

if __name__=='__main__':main()
