"""Round 29: real Chromium diagram label, arrow, localization, grid context, and icon checks."""
import json, os, math
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download,cmd
ROOT=Path(__file__).resolve().parents[1]
STYLE={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
def project():
 d=json.loads((ROOT/'examples/geometry-demo.json').read_text())
 d['objects']=[dict(id='o1',name='N1',type='node',xy=[-4,0],text='A',fontSize=17,hidden=False,locked=False,style=STYLE),
               dict(id='o2',name='N2',type='node',xy=[4,0],text='B',fontSize=17,hidden=False,locked=False,style=STYLE),
               dict(id='o3',name='Arrow3',type='morphism',refs=['o1','o2'],text='\\varphi',textMode='latex',bend=0,routing='direct',hidden=False,locked=False,style=STYLE)]
 d['nextId']=4;d['settings'].update(grid=True,snap=False,snapAnchors=False,snapObjects=False,showAxes=False,showLabels=False)
 return d

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':860},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept('X' if d.type=='prompt' else None))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   assert page.locator('#geometry-essential').count()==0 and page.locator('[data-tool-choice="midpoint"]').is_visible()
   assert page.locator('#snap').is_checked() is False
   page.locator('#auto-pan').uncheck()
   page.locator('[data-tool-choice="node"]').click()
   assert page.locator('#snap').is_checked(),'diagram tool should enable grid snap in current tool context'
   page.locator('[data-tool-choice="point"]').click()
   assert not page.locator('#snap').is_checked(),'geometry tool should disable automatic grid snap'
   page.locator('#snap').check()
   assert page.locator('#snap').is_checked(),'manual override should remain active for the selected tool'
   page.locator('[data-tool-choice="node"]').click();page.locator('[data-tool-choice="point"]').click()
   assert not page.locator('#snap').is_checked(),'tool switch should reset manual snap context'
   # Real canvas creation: diagram nodes snap to 0.5 grid, free geometry points do not.
   stage=page.locator('#drawing').bounding_box();mx=stage['x']+stage['width']/2;my=stage['y']+stage['height']/2
   page.locator('[data-tool-choice="node"]').click();page.mouse.click(mx+.28*48,my-.34*48)
   stored=json.loads(download(page,'Save').read_text())
   n=[o for o in stored['objects'] if o['type']=='node'][-1]
   assert n['xy']==[.5,.5],n
   page.locator('[data-tool-choice="point"]').click();page.mouse.click(mx+1.37*48,my-.38*48)
   stored=json.loads(download(page,'Save').read_text())
   p=[o for o in stored['objects'] if o['type']=='point'][-1]
   assert abs(p['xy'][0]-1.37)<.02 and abs(p['xy'][1]-.38)<.02,p
   page.locator('#open-file').set_input_files({'name':'diagram.json','mimeType':'application/json','buffer':json.dumps(project()).encode()})
   page.wait_for_timeout(150)
   page.locator('[data-tool-choice="select"]').click()
   # Selecting an existing morphism no longer renders a separate bright circular handle.
   page.locator('#object-search').fill('Arrow3');page.locator('#objects .object').first.click()
   assert page.locator('#drawing [data-label-handle="o3"]').count()==1
   assert page.locator('#drawing circle[data-label-handle]').count()==0
   handle=page.locator('#drawing [data-label-handle="o3"]')
   assert handle.evaluate('e=>e.tagName.toLowerCase()')=='rect'
   root=page.locator('#drawing g[data-id="o3"]')
   startPath=root.locator('path').first.get_attribute('d')
   # Collision/swap checkboxes must be adjacent, readable and independent.
   assert page.locator('.morphism-arrow-checks input[type=checkbox]').count()==2
   assert page.locator('.morphism-arrow-checks .check').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=12
   # Manual side toggling mirrors the label without changing semantic nodes or route.
   label=handle
   def bbox_center(locator):
    b=locator.bounding_box();assert b and b['width']>1 and b['height']>1,b
    return b['x']+b['width']/2,b['y']+b['height']/2
   x1,y1=bbox_center(label)
   side=page.get_by_label('Swap label side')
   side.check();page.wait_for_timeout(110)
   x2,y2=bbox_center(page.locator('#drawing [data-label-handle="o3"]'))
   assert abs(y2-y1)>22,(y1,y2)
   side.uncheck();page.wait_for_timeout(110)
   x3,y3=bbox_center(page.locator('#drawing [data-label-handle="o3"]'))
   assert abs(y3-y1)<3,(y1,y3)
   assert root.locator('path').first.get_attribute('d')==startPath
   # Negative numbers remain leading-minus. Runtime CSS must be left-to-right.
   offset=page.get_by_label('Label shift Y (px)')
   offset.fill('-36');offset.dispatch_event('change')
   assert offset.input_value()=='-36',offset.input_value()
   assert offset.evaluate('e=>getComputedStyle(e).direction')=='ltr'
   assert page.locator('#drawing [data-label-handle="o3"]').count()==1
   # Drag rendered TeX label directly; the move should be a single undo step.
   label=page.locator('#drawing [data-label-handle="o3"]');x,y=bbox_center(label)
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+41,y+19,steps=5);page.mouse.up();page.wait_for_timeout(110)
   out=json.loads(download(page,'Save').read_text());arrow=out['objects'][-1]
   assert abs(arrow.get('labelDx',0)-41)<=2,arrow
   assert abs(arrow.get('labelDy',0)-(-36+19))<=2,arrow
   assert arrow['refs']==['o1','o2'] and arrow['text']==r'\varphi'
   page.locator('#undo').click();page.wait_for_timeout(90)
   out=json.loads(download(page,'Save').read_text());assert abs(out['objects'][-1].get('labelDx',0))<.1
   page.locator('#redo').click();page.wait_for_timeout(90)
   assert abs(json.loads(download(page,'Save').read_text())['objects'][-1]['labelDx']-41)<=2
   # Also start a drag directly on the label after deselection: no prior list click is required.
   stage=page.locator('#drawing').bounding_box()
   page.mouse.dblclick(stage['x']+30,stage['y']+30)
   page.locator('#drawing [data-label-handle="o3"]').wait_for(state='visible',timeout=5000);handle=page.locator('#drawing [data-label-handle="o3"]');x,y=bbox_center(handle)
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+13,y+8,steps=4);page.mouse.up()
   directly=json.loads(download(page,'Save').read_text())['objects'][-1]
   assert abs(directly.get('labelDx',0)-54)<=2,directly
   page.locator('#undo').click()
   assert abs(json.loads(download(page,'Save').read_text())['objects'][-1].get('labelDx',0)-41)<=2
   page.locator('#object-search').fill('Arrow3');page.locator('#objects .object').first.click()
   # Both hooked styles must attach to the arrow, not produce floating dot-shaped curls.
   styles=page.locator('#properties .field').filter(has_text='Arrow style').locator('select')
   for kind in ('solid','dashed','dotted','hook','hook-dashed','twohead','tail'):
    styles.select_option(kind);page.wait_for_timeout(55)
    paths=page.locator('#drawing g[data-id="o3"] path').all()
    assert paths,kind
    if kind in ('hook','hook-dashed'):
     assert len(paths)>=2 and ' A' in paths[1].get_attribute('d'),kind
     assert not page.locator('#drawing g[data-id="o3"] circle').count(),kind
   # Direct vs routing variants; no crashes in EN or ZH.
   for route in ('direct','avoid','avoid-crossings','scene-crossings'):
    page.locator('#morphism-routing').select_option(route);page.wait_for_timeout(75)
    assert page.locator('#drawing g[data-id="o3"]').count()==1,route
   page.locator('#morphism-routing').select_option('direct')
   page.locator('#export-open').click();svg=download(page,'SVG').read_text()
   assert 'data-label-handle' not in svg and 'morphism-label-hit' not in svg
   page.locator('#ui-language').select_option('zh')
   page.locator('#object-search').fill('Arrow3');page.locator('#objects .object').first.click()
   assert page.locator('#properties').get_by_text('箭头路径').count()==1
   assert page.locator('#properties').get_by_text('切换标签侧').count()==1
   page.locator('#ui-language').select_option('en')
   # Chosen geometry icons actually mark their geometric defining points.
   assert page.locator('[data-tool-choice="midpoint"]').is_visible()
   for name in ('regularPolygon','perpendicularThrough','circleIntersection'):
    button=page.locator(f'[data-tool-choice="{name}"] svg')
    assert button.count()==1 and button.locator('circle').count()>=1,name
    assert all(abs(r-(1.8 if name=='circleIntersection' else 2))<.01 for r in button.locator('circle[fill="currentColor"]').evaluate_all('(es)=>es.map(e=>+e.getAttribute("r"))')),name
   page.set_viewport_size({'width':390,'height':780});assert page.locator('#drawing').is_visible()
   assert not errors,errors
   print('ROUND29_CHROMIUM_PASS: icon geometry, snap grid by tool, manual override, label direct drag, no ghost circle, signed values, checkbox grouping/swap, all arrow styles/routing modes, EN/ZH, undo/redo, mobile')
  finally: browser.close()
if __name__=='__main__':run()
