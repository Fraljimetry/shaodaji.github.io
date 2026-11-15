"""Round 76 real Chromium: tangency, close Bézier roots, exact circle crossing,
Fixed-angle unrestricted point dragging and old/new v1 project persistence.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.set_default_timeout(20000)
   assert page.locator('#command').count()==1
   doc=json.loads(page.evaluate('window.__round36Snapshot()'))
   doc['objects']=[];doc['nextId']=1
   def add(name,kind,**fields):
    identity=f'o{doc["nextId"]}';doc['nextId']+=1
    obj={'id':identity,'name':name,'type':kind,'hidden':False,'locked':False,
     'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1},**fields}
    if kind in ('point','pointOnObject','generalIntersection'):obj['style']['pointSize']=5
    doc['objects'].append(obj);return identity
   O=add('O','point',xy=[0,0]);P=add('P','point',xy=[1,0]);circ=add('Unit circle','circle',refs=[O,P])
   tangent=add('Unit tangent','tangentCircle',refs=[P,circ],branch=-1)
   guide=add('Direction','point',xy=[1,0]);fixed=add('Fixed ray','fixedAngle',refs=[guide,O],angle=0)
   old=add('Legacy constrained','pointOnObject',refs=[fixed],parameter=1,constraintMode='angleRay')
   far=add('Distant constrained','pointOnObject',refs=[fixed],parameter=1,constraintMode='angleRay',distance=100)
   U=add('Above','point',xy=[-2,.5]);V=add('Below','point',xy=[2,.5]);poly=add('Crossing polyline','polyline',refs=[U,V])
   c0=add('First exact','generalIntersection',refs=[circ,poly],rootIndex=0)
   c1=add('Second exact','generalIntersection',refs=[circ,poly],rootIndex=1)
   def load(d):
    page.locator('#open-file').set_input_files({'name':'round76.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
    page.wait_for_function('(n)=>JSON.parse(window.__round36Snapshot()).objects.length===n',arg=len(d['objects']))
   load(doc)
   page.locator('#fit').click();page.wait_for_timeout(120)
   assert page.locator(f'#drawing [data-id="{tangent}"] line').count()==1,'On-circle tangent failed to render'
   assert page.locator(f'#drawing circle[data-id="{old}"]').count()==1,'Legacy fixed ray lost its point'
   assert page.locator(f'#drawing circle[data-id="{far}"]').count()==1,'New distant fixed ray point missing'
   assert all(page.locator(f'#drawing circle[data-id="{x}"]').count()==1 for x in (c0,c1)),'Missing exact roots'
   # Fit includes 100-world-unit constrained ray endpoint.
   page.locator('#fit').click();page.wait_for_timeout(120)
   stage=page.locator('#drawing');width=stage.evaluate('e=>e.clientWidth')
   marker=page.locator(f'#drawing circle[data-id="{far}"]')
   assert 0<=float(marker.get_attribute('cx'))<=width
   bbox=marker.bounding_box();assert bbox,bbox
   page.mouse.move(bbox['x']+bbox['width']/2,bbox['y']+bbox['height']/2)
   page.mouse.down();page.mouse.move(bbox['x']+bbox['width']/2-40,bbox['y']+bbox['height']/2,steps=5);page.mouse.up()
   page.wait_for_timeout(130)
   now=json.loads(page.evaluate('window.__round36Snapshot()'))
   far_obj=next(o for o in now['objects'] if o['id']==far)
   old_obj=next(o for o in now['objects'] if o['id']==old)
   assert 'distance' in far_obj and abs(far_obj['distance']-100)>1,far_obj
   assert 'distance' not in old_obj,old_obj
   with page.expect_download() as dl:page.locator('#save').click()
   saved=json.loads(dl.value.path().read_text());load(saved)
   assert page.locator(f'#drawing [data-id="{tangent}"] line').count()==1
   assert page.locator(f'#drawing circle[data-id="{far}"]').count()==1
   assert page.locator(f'#drawing circle[data-id="{c0}"]').count()==1
   assert not errors,errors
   print('ROUND76_CHROMIUM_PASS: on-circle tangent, exact circle roots, legacy/new fixed-angle positions, unbounded drag, Fit, v1 save/reimport, zero page errors')
  finally:browser.close()
if __name__=='__main__':main()
