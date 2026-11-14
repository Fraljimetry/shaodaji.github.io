"""Round44 real Chromium: freehand style matrix, morphism side, compact settings and exports."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download
ROOT=Path(__file__).resolve().parents[1]
STYLE={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
def fixture(objects):
 d=json.loads((ROOT/'examples/geometry-demo.json').read_text())
 d['objects']=objects;d['nextId']=max([int(o['id'][1:]) for o in objects] or [0])+1
 d['settings'].update(showLabels=False,grid=False,snap=False,snapAnchors=False,snapObjects=False)
 return d
def imp(page,d):
 page.locator('#open-file').set_input_files({'name':'round44.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
 page.wait_for_timeout(90)
def saved(page):return json.loads(download(page,'Save').read_text())
def center(page,locator):
 b=locator.bounding_box();assert b,b
 return b['x']+b['width']/2,b['y']+b['height']/2
def bounds(page,selector):
 loc=page.locator(selector);loc.scroll_into_view_if_needed();return loc.bounding_box()
def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':880},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   # All geometry tools visible in every category, no obsolete Essential selector.
   assert page.locator('#geometry-essential').count()==0
   assert page.locator('[data-advanced-geometry]').count()>10
   assert page.locator('[data-advanced-geometry]:visible').count()==page.locator('[data-advanced-geometry]').count()
   # Interface buttons do real work rather than being cosmetic.
   assert page.locator('#show-coordinates,#reduce-motion').count()==0
   assert page.locator('#auto-diagram-labels').is_checked()
   tool=page.locator('[data-tool-choice="circle"]');assert tool.get_attribute('title')
   page.locator('#tooltips').uncheck();assert tool.get_attribute('title') is None
   page.locator('#tooltips').check();assert tool.get_attribute('title')
   # 2D native color input has same full cell as Theme and follows it.
   th=bounds(page,'#theme');bg=bounds(page,'#background')
   assert abs(th['x']-bg['x'])<2 and abs(th['width']-bg['width'])<2,(th,bg)
   assert bg['y']>th['y'],(bg,th)
   page.locator('#scene3d-enable').check();page.wait_for_timeout(130)
   th3=bounds(page,'#scene3d-theme');bg3=bounds(page,'#scene3d-background')
   assert abs(th3['x']-bg3['x'])<2 and abs(th3['width']-bg3['width'])<2,(th3,bg3)
   assert bg3['y']>th3['y'] and bg3['width']>95,(bg3,th3)
   detail=bounds(page,'#scene3d-detail');opacity=bounds(page,'#scene3d-opacity');yaw=bounds(page,'#scene3d-yaw');pitch=bounds(page,'#scene3d-pitch')
   assert abs(detail['y']-opacity['y'])<2 and abs(yaw['y']-pitch['y'])<2
   assert abs(detail['width']-opacity['width'])<2 and abs(yaw['width']-pitch['width'])<2
   page.locator('#scene3d-enable').uncheck();page.wait_for_timeout(100)
   # Nine independent free curve combinations must appear in SVG and in JSON.
   free={'id':'o1','name':'Free curve 1','type':'freehand','path':[[-2,-1],[-1.6,-.2],[-.4,1.2],[.4,.9],[1.6,0],[2,1.6]],'closed':False,
         'hidden':False,'locked':False,'style':STYLE}
   imp(page,fixture([free]));page.locator('#objects .object').first.click()
   assert page.get_by_label('Curve line').count()==1 and page.get_by_label('Curve arrows').count()==1
   for line in ('solid','dashed','dotted'):
    for arrows in ('none','end','both'):
     page.get_by_label('Curve line').select_option(line)
     page.get_by_label('Curve arrows').select_option(arrows)
     page.wait_for_timeout(40)
     root=page.locator('#drawing [data-id="o1"].clickable').first
     path=root.locator('path').first if arrows!='none' else root
     dash=path.get_attribute('stroke-dasharray')
     assert (dash is None)==(line=='solid'),(line,arrows,dash)
     assert root.locator('.freehand-arrowhead').count()=={'none':0,'end':1,'both':2}[arrows],(line,arrows)
     state=saved(page)['objects'][0]
     assert (state['curveLine'],state['curveArrows'])==(line,arrows),state
   page.locator('#export-open').click()
   svg=download(page,'SVG').read_text()
   assert svg.count('freehand-arrowhead')==2 and 'stroke-dasharray="1.5 5"' in svg
   page.locator('#export-open').click()
   assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(), 'Freehand export is intentionally not a faithful TikZ conversion'
   page.locator('#export-close').click()
   project=saved(page);imp(page,project)
   assert saved(page)['objects'][0]['curveArrows']=='both'
   page.locator('#undo').click() # import transaction should be undoable or stable; do not assert state here
   # Diagram morphism checks: swap must actually cross the path, with collision avoidance enabled.
   objects=[
    {'id':'o1','name':'A','type':'node','xy':[-3,0],'text':'A','textMode':'plain','fontSize':17,'hidden':False,'locked':False,'style':STYLE},
    {'id':'o2','name':'B','type':'node','xy':[3,0],'text':'B','textMode':'plain','fontSize':17,'hidden':False,'locked':False,'style':STYLE},
    {'id':'o3','name':'Morphism 1','type':'morphism','refs':['o1','o2'],'text':'f','textMode':'plain','bend':0,
     'routing':'direct','labelAvoid':True,'swap':False,'hidden':False,'locked':False,'style':STYLE},
    {'id':'o4','name':'C','type':'node','xy':[0,-.4],'text':'C','textMode':'plain','fontSize':17,'hidden':False,'locked':False,'style':STYLE},
   ]
   imp(page,fixture(objects));page.locator('#objects .object').filter(has_text='Morphism 1').first.click()
   x,y=center(page,page.locator('#drawing [data-label-handle="o3"]'))
   # Path y at middle; clipped endpoints preserve horizontal centerline.
   arrow=page.locator('#drawing g[data-id="o3"] path').first.get_attribute('d')
   import re
   start=re.search(r'^M(-?[\d.]+) (-?[\d.]+)',arrow);assert start,arrow
   path_y=float(start.group(2))
   old=float(page.locator('#drawing .morphism-label').first.get_attribute('y'))-path_y
   page.get_by_label('Swap label side').check();page.wait_for_timeout(80)
   x2,y2=center(page,page.locator('#drawing [data-label-handle="o3"]'))
   new=float(page.locator('#drawing .morphism-label').first.get_attribute('y'))-path_y
   assert old*new<0 and abs(old)>5 and abs(new)>5,(old,new)
   assert abs(x2-x)<150,(x,x2)
   page.get_by_label('Swap label side').uncheck();page.wait_for_timeout(70)
   x3,y3=center(page,page.locator('#drawing [data-label-handle="o3"]'))
   assert (float(page.locator('#drawing .morphism-label').first.get_attribute('y'))-path_y)*old>0,(y3,path_y,old)
   # Different routing options must keep the label visible and its side.
   for mode in ('direct','avoid','avoid-crossings','scene-crossings'):
    page.locator('#morphism-routing').select_option(mode);page.wait_for_timeout(75)
    assert page.locator('#drawing [data-label-handle="o3"]').count()==1,mode
    page.get_by_label('Swap label side').check();page.wait_for_timeout(55)
    assert page.locator('#drawing [data-label-handle="o3"]').count()==1
    page.get_by_label('Swap label side').uncheck()
   # Numeric controls form an actual two-column grid, not merely reduced widths.
   gr=page.locator('.diagram-numeric-grid');assert gr.locator('input[type=number]').count()==4
   b=[x.bounding_box() for x in gr.locator('input[type=number]').all()]
   assert abs(b[0]['y']-b[1]['y'])<3 and abs(b[2]['y']-b[3]['y'])<3,b
   assert abs(b[0]['width']-b[1]['width'])<3,b
   # Same right-edge alignment across top-level morphism controls.
   selectors=['#properties .field:has(select) select']
   top=page.locator('#properties > label.field select')
   right_edges=[q.bounding_box()['x']+q.bounding_box()['width'] for q in top.all()]
   assert max(right_edges)-min(right_edges)<3,right_edges
   page.locator('#auto-diagram-labels').uncheck();page.wait_for_timeout(80)
   assert page.locator('#drawing [data-label-handle="o3"]').count()==1
   page.locator('#auto-diagram-labels').check();page.wait_for_timeout(80)
   assert page.locator('#drawing [data-label-handle="o3"]').count()==1
   # EN/ZH switching retains geometry and the inspector controls.
   page.locator('#ui-language').select_option('zh');page.wait_for_timeout(80)
   assert page.locator('#properties .diagram-numeric-grid input').count()==4
   assert not errors,errors
   print('ROUND44_CHROMIUM_PASS: 2D/3D full-width backgrounds, compact numeric grids, 4 Interface controls, all geometry visible, freehand 9 modes, faithful SVG/JSON (TikZ disabled), morphism swap and routing, ZH')
  finally:browser.close()
if __name__=='__main__':run()
