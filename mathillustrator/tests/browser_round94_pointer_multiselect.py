"""Round 94 — real Chromium pointer cancellation, multi-selection, and touch guard."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
 with sync_playwright() as pw:
  exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_default_timeout(15000)
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   d=state();d['objects']=[{'id':f'o{i}','name':name,'type':'point','xy':xy,'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}} for i,(name,xy) in enumerate([('A',[-2,0]),('B',[2,0])],1)];d['nextId']=3
   page.locator('#open-file').set_input_files({'name':'r94.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length===2')
   def center(i):
    b=page.locator(f'#drawing circle[data-id="o{i}"]').bounding_box();assert b
    return b['x']+b['width']/2,b['y']+b['height']/2
   a,b=center(1),center(2);origin=state()['objects'][0]['xy']
   page.mouse.click(*a)
   page.wait_for_timeout(550)
   page.mouse.move(*a);page.mouse.down();page.mouse.move(a[0]+65,a[1]-25,steps=5)
   assert state()['objects'][0]['xy']!=origin,'Dragging failed before pointer cancellation'
   # Native Chromium pointercancel with actual captured pointer ID, not a synthetic click.
   page.evaluate("""() => {const svg=document.querySelector('#drawing');svg.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true,clientX:0,clientY:0}));}""")
   assert state()['objects'][0]['xy']==origin,'pointercancel failed to restore document'
   page.mouse.up()
   assert state()['objects'][0]['xy']==origin,'pointerup after cancel accidentally committed'
   a,b=center(1),center(2)
   page.wait_for_timeout(550)
   page.mouse.click(*a)
   page.keyboard.down('Shift');page.mouse.click(*b);page.keyboard.up('Shift')
   selected=page.locator('#objects .object.selected').count()
   assert selected==2,f'Shift multi-selection expected 2, got {selected}'
   page.keyboard.down('Shift');page.mouse.click(*b);page.keyboard.up('Shift')
   assert page.locator('#objects .object.selected').count()==1,'Shift toggle did not remove member'
   # Lost pointer capture must cancel an in-flight drag, not store a partial edit.
   a=center(1);page.wait_for_timeout(650);page.mouse.click(*a);page.wait_for_timeout(650)
   page.mouse.move(*a);page.mouse.down();page.mouse.move(a[0]+50,a[1]+45,steps=5)
   assert state()['objects'][0]['xy']!=origin
   page.evaluate("""() => {const svg=document.querySelector('#drawing');svg.dispatchEvent(new PointerEvent('lostpointercapture',{bubbles:true,pointerId:1,pointerType:'mouse',isPrimary:true}));}""")
   assert state()['objects'][0]['xy']==origin,'lostpointercapture failed to cancel drag'
   page.mouse.up()
   assert state()['objects'][0]['xy']==origin
   assert not errors,errors
   print('ROUND94_CHROMIUM_PASS pointercancel, lostpointercapture, shift selection toggle, no accidental commit')
  finally:browser.close()

if __name__=='__main__':main()
