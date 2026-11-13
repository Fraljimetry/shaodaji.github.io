"""Cut17: actual browser SVG/TikZ fidelity and conservative offscreen rendering.
No native viewport navigation or cross-browser certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
import os,json

ROOT=Path(__file__).resolve().parents[1]

def sample_scene():
 doc=json.loads((ROOT/'examples/diagram-demo.json').read_text())
 doc['objects']=doc['objects'][:2]
 doc['settings']['grid']=False
 doc['settings']['showAxes']=False
 doc['settings']['showLabels']=False
 doc['settings']['snapAnchors']=False
 doc['objects'][0]['xy']=[-2,0]
 doc['objects'][1]['xy']=[2,0]
 doc['objects'][0]['name']='A';doc['objects'][1]['name']='B'
 doc['objects'][1]['style']['opacity']=0
 doc['objects'].append({'id':'o3','name':'f','type':'morphism','refs':['o1','o2'],'text':'f','bend':0,'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#ffffff','width':2,'opacity':1}})
 doc['objects'].append({'id':'o4','name':'g','type':'function','expr':'sin(x)','hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#ffffff','width':2,'opacity':0}})
 doc['nextId']=5
 return doc

def import_doc(page,doc):
 page.locator('#open-file').set_input_files({'name':'cut17.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
 page.wait_for_function('(n)=>document.getElementById("object-count").textContent === String(n)',arg=len(doc['objects']))
 page.wait_for_timeout(100)

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1280,'height':800},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  doc=sample_scene();import_doc(page,doc)
  assert page.locator('#drawing [data-id="o2"]').count()==0,'Transparent node rendered despite full invisibility'
  assert page.locator('#drawing [data-id="o3"]').count()==0,'Visible morphism with invisible endpoint must not be drawn'
  assert page.locator('#drawing [data-id="o4"]').count()==0,'Transparent function should not be sampled or rendered'
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(),'Visible morphism with an invisible endpoint must disable misleading TeX export'
  svg=download(page,'SVG').read_text()
  assert 'data-id="o2"' not in svg and 'data-id="o3"' not in svg and 'data-id="o4"' not in svg
  print('CUT17_PASS hidden endpoint and transparent function omitted from SVG; TeX unavailable when semantics diverge')
  # Visibility of a morphism itself is independent of its constituent nodes.
  doc['objects'][1]['style']['opacity']=1
  doc['objects'][2]['style']['opacity']=0
  import_doc(page,doc)
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_enabled()
  tex=download(page,'TikZ / PGF').read_text()
  assert 'to node' not in tex and not any('->' in line for line in tex.splitlines()),'Fully transparent arrow leaked into TikZ'
  assert '(mio1)' in tex and '(mio2)' in tex
  print('CUT17_PASS zero-opacity semantic arrow is absent from TikZ')
  # Build ordinary bounded shapes, including a segment whose endpoints are
  # both outside the view but whose segment crosses the entire canvas.
  from copy import deepcopy
  doc=sample_scene();doc['objects']=[]
  style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
  pts=[[-50,0],[50,0],[400,400],[405,405],[-6,0],[-5,0]]
  for i,point in enumerate(pts):doc['objects'].append({'id':'o'+str(i+1),'name':'P'+str(i+1),'type':'point','xy':point,'hidden':False,'locked':False,'style':deepcopy(style)})
  doc['objects'].extend([
   {'id':'o7','name':'Crossing','type':'segment','refs':['o1','o2'],'hidden':False,'locked':False,'style':deepcopy(style)},
   {'id':'o8','name':'Offscreen','type':'segment','refs':['o3','o4'],'hidden':False,'locked':False,'style':deepcopy(style)},
   {'id':'o9','name':'Near','type':'segment','refs':['o5','o6'],'hidden':False,'locked':False,'style':deepcopy(style)},
  ])
  doc['nextId']=10
  import_doc(page,doc)
  assert page.locator('#drawing [data-id="o7"]').count()>=1,'Crossing segment mistakenly culled'
  assert page.locator('#drawing [data-id="o8"]').count()==0,'Fully offscreen bounded segment consumes DOM'
  assert page.locator('#drawing [data-id="o9"]').count()>=1,'Near-visible object improperly culled'
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  assert 'data-id="o7"' in svg and 'data-id="o9"' in svg and 'data-id="o8"' not in svg
  print('CUT17_PASS offscreen culling preserves crossing strokes in SVG and visible canvas')
  assert not errors,errors
  browser.close()

if __name__=='__main__':run()
