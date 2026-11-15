"""Round 74: actual Chromium regressions for Fit, unbounded constraints, and persistence."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  executable=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':executable} if executable else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(20000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   assert page.locator('#command').count()==1,'Application did not start'
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   for cmd in ('A=(0,0)','B=(1000,0)'):
    page.locator('#command').fill(cmd);page.locator('#command-form button').click()
   points=snap()['objects'];assert len(points)==2
   page.locator('#fit').click()
   size=page.locator('#drawing').evaluate('(e)=>({w:e.clientWidth,h:e.clientHeight})')
   circles=[]
   for item in points:
    marker=page.locator(f'#drawing circle[data-id="{item["id"]}"]')
    assert marker.count()==1,f'Fit culled {item["name"]}'
    x=float(marker.get_attribute('cx'));circles.append(x)
    assert 0<=x<=size['w'],(item['name'],x,size)
   assert 'fixed-size labels' not in page.locator('#toast').inner_text().lower()
   # Open a v1 project with a new signed-distance constraint and a legacy
   # parameter-only constrained point. Both must survive JSON re-export.
   project=snap();project['objects']=[];project['nextId']=1
   def add(name,kind,**fields):
    ident=f'o{project["nextId"]}';project['nextId']+=1
    style={'stroke':'#000000','fill':'#000000','width':2,'opacity':1}
    if kind in ('point','pointOnObject'):style['pointSize']=5
    obj={'id':ident,'name':name,'type':kind,'hidden':False,'locked':False,'style':style,**fields}
    project['objects'].append(obj);return ident
   a=add('O','point',xy=[0,0]);b=add('Direction','point',xy=[1,0]);ray=add('Ray','ray',refs=[a,b])
   far=add('Far on ray','pointOnObject',refs=[ray],parameter=0.5,distance=100)
   old=add('Legacy point','pointOnObject',refs=[ray],parameter=0.5)
   page.locator('#open-file').set_input_files({'name':'round74.json','mimeType':'application/json','buffer':json.dumps(project).encode()})
   page.wait_for_function('(expected)=>JSON.parse(window.__round36Snapshot()).objects.length===expected',arg=len(project['objects']))
   page.locator('#fit').click()
   marker=page.locator(f'#drawing circle[data-id="{far}"]')
   marker.wait_for(state='visible')
   svg=page.locator('#drawing');width=svg.evaluate('e=>e.clientWidth')
   assert 0<=float(marker.get_attribute('cx'))<=width,'Unbounded constrained point offscreen after Fit'
   # A live drag must update its exact world-coordinate distance, not clamp
   # the editable point to the old fixed 15-unit sampled ray.
   box=marker.bounding_box();assert box
   x,y=box['x']+box['width']/2,box['y']+box['height']/2
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-55,y,steps=6);page.mouse.up()
   page.wait_for_timeout(160)
   objs={o['id']:o for o in snap()['objects']}
   assert 'distance' in objs[far],objs[far]
   assert abs(objs[far]['distance']-100)>1,objs[far]
   assert 0<=objs[far]['parameter']<=1
   assert 'distance' not in objs[old],objs[old]
   with page.expect_download() as download:page.locator('#save').click()
   saved=json.loads(download.value.path().read_text())
   assert any(o['id']==far and abs(o['distance']-100)>1 for o in saved['objects'])
   page.locator('#open-file').set_input_files({'name':'reopen-round74.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
   page.wait_for_function('(expected)=>JSON.parse(window.__round36Snapshot()).objects.length===expected',arg=len(saved['objects']))
   assert page.locator(f'#drawing circle[data-id="{far}"]').count()==1
   assert not errors,errors
   print('ROUND74_CHROMIUM_PASS: distant Fit, old/new constrained-point JSON, live unbounded drag, save/reimport')
  finally:browser.close()

if __name__=='__main__':main()
