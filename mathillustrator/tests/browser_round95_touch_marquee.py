"""Round 95 — actual Chromium marquee and emulated touchscreen contact ordering."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},has_touch=True,is_mobile=False)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_default_timeout(15000)
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   d=state();d['objects']=[{'id':f'o{i}','name':str(i),'type':'point','xy':xy,'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}} for i,xy in enumerate([[-2,0],[2,0]],1)];d['nextId']=3
   page.locator('#open-file').set_input_files({'name':'r95.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length===2')
   def center(i):
    b=page.locator(f'#drawing circle[data-id="o{i}"]').bounding_box();assert b
    return b['x']+b['width']/2,b['y']+b['height']/2
   a,b=center(1),center(2)
   # Shift-marquee left-to-right encloses only A; reverse crossing catches both when intersecting region.
   page.mouse.move(a[0]-32,a[1]-30);page.keyboard.down('Shift');page.mouse.down();page.mouse.move(a[0]+32,a[1]+30,steps=8);page.mouse.up();page.keyboard.up('Shift')
   assert page.locator('#objects .object.selected').count()==1,'window marquee must select only enclosed A'
   # Add B with right-to-left crossing; use a slim rectangle passing through B marker.
   page.mouse.move(b[0]+28,b[1]+13);page.keyboard.down('Shift');page.mouse.down();page.mouse.move(b[0]-28,b[1]-13,steps=8);page.mouse.up();page.keyboard.up('Shift')
   assert page.locator('#objects .object.selected').count()==2,'crossing marquee must add B'
   # Select point tool, synthesize ordered multitouch pointers against real SVG app listeners.
   pointbutton=page.locator('[data-tool-choice="point"]').first
   if pointbutton.count():pointbutton.click()
   else:raise AssertionError('Point tool not found')
   count=len(state()['objects'])
   box=page.locator('#drawing').bounding_box();assert box
   x=box['x']+box['width']*.48;y=box['y']+box['height']*.42
   def touch(typ,pid,primary,xoff=0):
    page.evaluate('''({typ,pid,primary,x,y})=>{let s=document.querySelector('#drawing');s.dispatchEvent(new PointerEvent(typ,{bubbles:true,cancelable:true,pointerId:pid,pointerType:'touch',isPrimary:primary,button:0,buttons:typ==='pointerup'?0:1,clientX:x,clientY:y}));}''',{'typ':typ,'pid':pid,'primary':primary,'x':x+xoff,'y':y})
   touch('pointerdown',31,True);assert len(state()['objects'])==count,'touch pointerdown inserted construction prematurely'
   touch('pointerdown',32,False,60);touch('pointerup',32,False,60);touch('pointerup',31,True)
   assert len(state()['objects'])==count,'multi-contact pinch incorrectly inserted construction'
   touch('pointerdown',33,True);touch('pointercancel',33,True)
   assert len(state()['objects'])==count,'cancelled touch tap inserted construction'
   touch('pointerdown',34,True);touch('pointerup',34,True)
   assert len(state()['objects'])==count+1,'single touch tap failed to construct a point'
   assert not errors,errors
   print('ROUND95_CHROMIUM_PASS window/crossing marquee, deferred touch, two-contact guard, cancellation, single tap')
  finally:browser.close()

if __name__=='__main__':main()
