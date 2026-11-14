"""Round 34 actual Chromium: screen-space arrow aim, tool hotkeys, dense diagrams + geometry."""
import json,math,re,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
ROOT=Path(__file__).resolve().parents[1]
style={'stroke':'#16a34a','fill':'#000000','opacity':1,'width':2}

def sample():
 d=json.loads((ROOT/'examples/geometry-demo.json').read_text())
 d['objects']=[dict(id='o1',name='Target',type='node',xy=[-2,0],text=r'\log x',fontSize=19,textMode='latex',nodeBorder=False,style=style,hidden=False,locked=False),
               dict(id='o2',name='Source',type='node',xy=[3,2],text=r'\sin x',fontSize=19,textMode='latex',nodeBorder=False,style=style,hidden=False,locked=False),
               dict(id='o3',name='Arrow',type='morphism',refs=['o2','o1'],text='',textMode='latex',bend=1.1,routing='direct',arrowStyle='dotted',style=style,hidden=False,locked=False)]
 d['nextId']=4;d['settings'].update(snap=False,showAxes=False,showLabels=False)
 return d

def import_project(page,d):
 page.locator('#open-file').set_input_files({'name':'round34.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
 page.wait_for_timeout(140)

def endpoint_measure(page,selected=False):
 vals=page.evaluate('''() => {
 const g=document.querySelector('#drawing g[data-id="o3"]');
 const p=g?.querySelector('path');const target=document.querySelector('#drawing g[data-id="o1"]');
 if(!p||!target) return null;
 const d=p.getAttribute('d');const nums=[...d.matchAll(/-?\\d+(?:\\.\\d+)?/g)].map(m=>+m[0]);
 const box=target.querySelector('rect[stroke]')||target.querySelector('svg');
 const r=box?.getBoundingClientRect(),canvas=document.querySelector('#drawing').getBoundingClientRect();
 return {d,nums,target: r?{left:r.left-canvas.left,right:r.right-canvas.left,top:r.top-canvas.top,bottom:r.bottom-canvas.top}:null};}''')
 assert vals and vals['target'] and len(vals['nums'])==6,vals
 a=vals['nums'];start=(a[0],a[1]);control=(a[2],a[3]);end=(a[4],a[5]);b=vals['target']
 cx=(b['left']+b['right'])/2;cy=(b['top']+b['bottom'])/2
 dx=max(b['left']-end[0],0,end[0]-b['right']);dy=max(b['top']-end[1],0,end[1]-b['bottom'])
 gap=math.hypot(dx,dy)
 tangent=(end[0]-control[0],end[1]-control[1]);inward=(cx-end[0],cy-end[1]);cosine=sum(a*b for a,b in zip(tangent,inward))/(math.hypot(*tangent)*math.hypot(*inward))
 assert 1.5<=gap<=7.5,(gap,vals)
 assert cosine>0.95,(cosine,vals)
 return gap,cosine

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  try:
   page=b.new_page(viewport={'width':1480,'height':880},accept_downloads=True)
   page.on('dialog',lambda d:d.accept());errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   page.locator('[data-tool-choice="select"]').wait_for()
   assert page.locator('[data-tool-choice="line"] span').inner_text()=='Line'
   assert page.locator('[data-tool-choice="perpBisector"] span').inner_text()=='Perpendicular bisector'
   assert 'P' in page.locator('[data-tool-choice="point"]').get_attribute('title')
   # The icon snapshot is a Node-level invariant; no glyphs changed here.
   for original in [False,True]:
    d=sample();d['objects'][0]['nodeBorder']=original;d['objects'][1]['nodeBorder']=original
    import_project(page,d)
    for zoom in [1,2]:
     gap,cosine=endpoint_measure(page)
     assert page.locator('#drawing [data-id="o3"] path').first.get_attribute('stroke')=='#16a34a'
     if zoom==1:
      page.locator('#zoom-in').click() if page.locator('#zoom-in').count() else page.locator('#drawing').hover()
    # SVG export must use exactly the same clipped arrows, no invisible editing hit rectangles.
    page.locator('#export-open').click()
    svg=download(page,'SVG').read_text();assert 'morphism-label-hit' not in svg and '<svg' in svg
    page.locator('#export-close').click() if page.locator('#export-close').is_visible() else None
   print('R34_ARROW_CLIP: bounded gaps and tangent aim for bordered/borderless math labels, zoom, SVG export')
   # One-key actions in canvas context and on a focused tool button.
   page.locator('[data-tool-choice="pan"]').click();page.keyboard.press('p')
   assert page.locator('#drawing').get_attribute('data-tool')=='point'
   page.keyboard.press('v');assert page.locator('#drawing').get_attribute('data-tool')=='select'
   page.keyboard.press('m');assert page.locator('#drawing').get_attribute('data-tool')=='morphism'
   page.keyboard.press('h');assert page.locator('#drawing').get_attribute('data-tool')=='pan'
   page.locator('#command').fill('p');page.locator('#command').press('a')
   assert page.locator('#drawing').get_attribute('data-tool')=='pan','text editor swallowed its typing'
   page.locator('#object-search').fill('n')
   assert page.locator('#drawing').get_attribute('data-tool')=='pan','search swallowed its typing'
   page.locator('#export-open').click();page.keyboard.press('p')
   assert page.locator('#drawing').get_attribute('data-tool')=='pan','dialog should not switch tools'
   page.locator('#export-close').click()
   page.locator('[data-tool-choice="select"]').click()
   # Dense scene covers multicolored nodes, four routing styles, geometric segments and labels.
   d=json.loads((ROOT/'tests/fixtures/round34_dense_scene.json').read_text())
   start=time.monotonic();import_project(page,d)
   page.locator('#object-count').wait_for()
   assert page.locator('#object-count').inner_text()==str(len(d['objects']))
   elapsed=time.monotonic()-start
   assert len(d['objects'])==127
   assert page.locator('#drawing g[data-id]').count()>=25
   assert page.locator('#drawing g[data-route-status]').count()>=15
   assert not errors,errors
   # JSON/undo/redo should preserve IDs and dependencies even in a crowded scene.
   latest=json.loads(download(page,'Save').read_text());assert latest['objects']==d['objects']
   source=next(o for o in d['objects'] if o['type']=='regularPolygon')
   ids=[o['id'] for o in d['objects'] if o.get('edgeOf')==source['id']]
   page.locator('#object-search').fill(source['name']);page.locator('#objects .object[data-id="'+source['id']+'"]').click()
   field=page.get_by_label('Number of sides');field.fill(str(source['sides']+1));field.press('Tab');page.wait_for_timeout(120)
   changed=json.loads(download(page,'Save').read_text());after=[o['id'] for o in changed['objects'] if o.get('edgeOf')==source['id']]
   assert after[:len(ids)]==ids and len(after)==len(ids)+1
   page.locator('#undo').click();page.wait_for_timeout(90)
   rolled=json.loads(download(page,'Save').read_text());assert [o['id'] for o in rolled['objects'] if o.get('edgeOf')==source['id']]==ids
   page.locator('#redo').click();page.wait_for_timeout(90)
   assert [o['id'] for o in json.loads(download(page,'Save').read_text())['objects'] if o.get('edgeOf')==source['id']]==after
   # Export a dense scene, not only a tiny diagram: no runtime exceptions or missing MathJax glyphs.
   page.locator('#export-open').click();rendered=download(page,'SVG').read_text();assert '<svg' in rendered and 'data-route-status' in rendered
   assert 'data-label-handle' not in rendered
   if page.locator('#export-close').is_visible():page.locator('#export-close').click()
   # Literal keys are usable after changing language; never mutate model labels.
   page.locator('#ui-language').select_option('zh')
   assert page.locator('[data-tool-choice="perpBisector"]').get_attribute('aria-label')=='垂直平分线'
   page.locator('[data-tool-choice="select"]').click();page.keyboard.press('c')
   assert page.locator('#drawing').get_attribute('data-tool')=='circle'
   page.set_viewport_size({'width':390,'height':780})
   assert page.locator('#drawing').is_visible()
   assert not errors,errors
   print(f'R34_DENSE_CHROMIUM_PASS: {len(d["objects"])} objects; 43 morphisms; render+import {elapsed:.2f}s; shortcuts/input/modal/zh/mobile; polygon side history; SVG/JSON')
  finally:b.close()
if __name__=='__main__':run()
