"""Cut20 browser: dense hit cycling, optional label collision reduction,
exact project persistence, and no hidden document mutations.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1300,'height':820},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(180)
  d=json.loads((ROOT/'examples/geometry-demo.json').read_text());d['objects']=[]
  def point(i,x=0,y=0):
   return dict(id=f'o{i}',type='point',name=f'P{i}',xy=[x,y],hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#b6c9f9','opacity':1,'width':2,'pointSize':5})
  d['objects']=[point(1),point(2),point(3)];d['nextId']=4
  d['settings']['showLabels']=True
  d['settings']['labelPlacement']='standard'
  page.locator('#open-file').set_input_files({'name':'stack.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
  page.wait_for_timeout(220)
  names=page.locator('#drawing text').all_text_contents()
  assert names==['P1','P2','P3'],names
  standard=page.locator('#drawing text').evaluate_all('(es)=>es.map(e=>[e.getAttribute("x"),e.getAttribute("y")])')
  assert len(set(map(tuple,standard)))==1,standard
  # All three coincident points are selectable with explicit cycling. A normal
  # click keeps the historical point-hit priority, while Ctrl-click never drags.
  c=page.locator('#drawing circle[cx][cy]').first
  x=float(c.get_attribute('cx'));y=float(c.get_attribute('cy'))
  page.locator('#drawing').click(position={'x':x,'y':y})
  assert page.locator('#objects .object.selected strong').inner_text()=='P3'
  ids=[]
  for _ in range(4):
   page.locator('#drawing').click(position={'x':x,'y':y},modifiers=['Control']);page.wait_for_timeout(40)
   names=[page.locator('#objects .object.selected strong').first.inner_text()] if page.locator('#objects .object.selected strong').count() else []
   ids.append(names[0] if names else '(none)')
  assert len(set(ids[:3]))==3,ids
  assert ids[0]==ids[3],ids
  # Optional label layout changes screen position, not underlying semantics.
  page.locator('#label-placement').select_option('avoid');page.wait_for_timeout(100)
  auto=page.locator('#drawing text').evaluate_all('(es)=>es.map(e=>[e.getAttribute("x"),e.getAttribute("y")])')
  assert len(set(map(tuple,auto)))>=2,auto
  assert page.locator('#drawing text').all_text_contents()==['P1','P2','P3']
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(), 'TikZ cannot encode screen-space collision offsets'
  svg=download(page,'SVG').read_text()
  assert svg.count('P1')==1 and svg.count('P2')==1 and svg.count('P3')==1
  page.locator('#export-open').click();out=json.loads(download(page,'JSON project').read_text())
  assert out['settings']['labelPlacement']=='avoid'
  assert [(x['id'],x['xy']) for x in out['objects']]==[(x['id'],x['xy']) for x in d['objects']]
  # Changing label layout must be undoable without moving any point.
  page.locator('#undo').click();page.wait_for_timeout(120)
  assert page.locator('#label-placement').input_value()=='standard'
  page.locator('#redo').click();page.wait_for_timeout(120)
  assert page.locator('#label-placement').input_value()=='avoid'
  # Cached placements must invalidate on an anchor drag and keep the
  # moved point's label near its new position, not its old screen coordinate.
  p3=page.locator('#drawing circle[data-id="o3"]');old_point_x=float(p3.get_attribute('cx'));bb=p3.bounding_box();assert bb
  old_label=page.locator('#drawing text').nth(2).get_attribute('x')
  start_x=bb['x']+bb['width']/2;start_y=bb['y']+bb['height']/2
  page.mouse.move(start_x,start_y);page.mouse.down();page.mouse.move(start_x+95,start_y-60,steps=4);page.mouse.up()
  page.wait_for_timeout(120)
  assert float(page.locator('#drawing circle[data-id="o3"]').get_attribute('cx'))>old_point_x+50
  new_label=page.locator('#drawing text').nth(2).get_attribute('x')
  assert abs(float(new_label)-float(old_label))>30,(old_label,new_label,'Label cache stayed stale after point drag')
  page.locator('#undo').click();page.wait_for_timeout(80)
  assert page.locator('#object-count').inner_text()=='3'
  assert page.locator('#preset').input_value()=='Custom'
  page.locator('#preset').select_option('General')
  assert page.locator('#label-placement').input_value()=='standard', 'Named presets must restore standard placement'
  page.locator('#undo').click();page.wait_for_timeout(70)
  assert page.locator('#label-placement').input_value()=='avoid'
  # Non-point objects must be cycle-selectable too; SVG hit testing must
  # reach both overlapped diagram nodes without scanning the whole scene.
  d['objects']=[dict(id=f'o{i}',type='node',name=f'N{i}',xy=[0,0],fontSize=17,text=f'N{i}',hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','opacity':1,'width':2}) for i in (1,2)]
  d['nextId']=3
  page.locator('#open-file').set_input_files({'name':'nodes.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
  page.wait_for_timeout(130)
  hit=page.locator('#drawing g[data-id="o2"] rect')
  bb=hit.bounding_box();assert bb
  x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2
  page.mouse.click(x,y)
  assert page.locator('#objects .object.selected strong').inner_text()=='N2'
  page.keyboard.down('Control');page.mouse.click(x,y);page.keyboard.up('Control')
  assert page.locator('#objects .object.selected strong').inner_text()=='N1'
  page.keyboard.down('Control');page.mouse.click(x,y);page.keyboard.up('Control')
  assert page.locator('#objects .object.selected strong').inner_text()=='N2'
  # The browser should not produce any invisible point geometry or mutate nodes.
  assert page.locator('#object-count').inner_text()=='2'
  assert not errors,errors
  print('CUT20_BROWSER_PASS: stacked Ctrl-click cycling, non-mutating label decluttering, SVG+JSON fidelity, undo/redo')
  browser.close()

if __name__=='__main__':run()
