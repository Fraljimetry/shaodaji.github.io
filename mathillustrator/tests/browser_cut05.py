"""Cut 05: id-independent publication arrows, click priority, dense scene performance.
Isolated Chromium, no HTTP or cross-browser claim.
"""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
from pathlib import Path
import tempfile,os,json,re

def project(page):return json.loads(download(page,'Save').read_text())

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':800},accept_downloads=True)
  page.on('dialog',lambda d:d.accept())
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(130)
  for src in ['A=(0,0)','B=(4,0)','Arrow(A,B)']:cmd(page,src)
  page.locator('#export-open').click();first=download(page,'SVG').read_text()
  assert '<polygon' in first, 'An arrowhead must be explicit SVG polygon geometry'
  assert '<marker' not in first and 'marker-end' not in first, 'SVG arrowheads must not depend on colliding globally-scoped marker ids'
  assert 'data-id="o3"' in first and 'Arrow' not in first, 'Serialized arrow geometry missing'
  # Color-change round trip must change both shaft and arrowhead, without global marker leakage.
  page.locator('#objects .object').first.click()
  page.locator('#properties input[type="color"]').first.fill('#ee2233')
  page.locator('#properties input[type="color"]').first.dispatch_event('change')
  page.locator('#export-open').click();second=download(page,'SVG').read_text()
  assert '#ee2233' in second and '#ee2233' not in first
  page.locator('#undo').click()
  page.locator('#export-open').click();third=download(page,'SVG').read_text()
  assert '#ee2233' not in third
  # Import an overlapped point and polygon; point's hit is prioritized without redundant anchor-hit disks.
  from copy import deepcopy
  d=project(page)
  d['objects'].append({'id':'o4','type':'point','name':'C','hidden':False,'locked':False,'xy':[0,3],'style':deepcopy(d['objects'][0]['style'])})
  polygon_style=deepcopy(d['objects'][0]['style']);polygon_style.pop('pointSize',None)
  d['objects'].append({'id':'o5','type':'polygon','name':'Cover','hidden':False,'locked':False,'refs':['o1','o2','o4'],'style':polygon_style})
  d['nextId']=6
  path=Path(tempfile.mkdtemp())/'overlap.json';path.write_text(json.dumps(d))
  page.locator('#open-file').set_input_files(path)
  page.wait_for_function("document.getElementById('object-count').textContent==='5'")
  assert page.locator('#drawing .anchor-hit').count()==0, 'Old per-point hit disk still inflates every scene'
  a=page.locator('#drawing circle[data-id="o1"]');box=a.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+70,y-45,steps=3);page.mouse.up();page.wait_for_timeout(100)
  after=project(page);assert after['objects'][0]['xy'] != [0,0], 'Point behind filled polygon was not draggable'
  page.locator('#undo').click();assert project(page)['objects'][0]['xy']==[0,0]
  # Rendering a dense but mostly offscreen point cloud should omit offscreen SVG circles.
  pts=[{'id':f'o{i+1}','type':'point','name':f'P{i}','hidden':False,'locked':False,'xy':[i*10+200,200],'style':deepcopy(d['objects'][0]['style'])} for i in range(3000)]
  d['objects']=pts;d['nextId']=3001;d['settings']['showLabels']=False
  path.write_text(json.dumps(d));page.locator('#open-file').set_input_files(path)
  page.wait_for_function("document.getElementById('object-count').textContent==='3000'")
  assert page.locator('#drawing circle[data-id]').count()<10, 'Far outside objects must be culled from SVG drawing'
  assert not errors,errors
  print('CHROMIUM_CUT05_PASS: marker-free arrows, per-object color, export/undo, overlapped-point dragging, no redundant hit disks, offscreen point culling')
  browser.close()

if __name__=='__main__':run()
