"""Focused real Chromium R28 interactions; isolated inlined modules only."""
import json,os,math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   assert page.locator('#drawing').count()==1
   for css in ['#snap-step','#polygon-sides','#default-width','#point-size','#default-opacity']:
    assert page.locator(css).evaluate('n=>getComputedStyle(n).direction')=='ltr',css
   assert 'M3 10H21V20H3Z' in page.locator('#open path').get_attribute('d')
   # Geometry icons: circle-line intersections lie on both glyph elements,
   # ellipse foci safely inside the low-eccentricity outline.
   assert page.locator('[data-tool-choice="midpoint"]').is_visible()
   ellipse=page.locator('[data-tool-choice="ellipse"] svg')
   x=ellipse.locator('circle').evaluate_all('(nodes)=>nodes.map(n=>+n.getAttribute("cx"))')
   assert x==[8,16],x
   for t in ['perpBisector','circleIntersection','perpendicularThrough','spline','closedSpline']:
    svg=page.locator(f'[data-tool-choice="{t}"] svg')
    assert svg.count()==1 and svg.locator('path').count()>=1,t
    assert all(abs(r-(1.8 if t=="circleIntersection" else 2))<.01 for r in svg.locator('circle[fill="currentColor"]').evaluate_all('(nodes)=>nodes.map(n=>+n.getAttribute("r"))')),t
   # Polygon command creates side segments and can undo all together.
   page.locator('#auto-pan').uncheck()
   for text in ['A=(0,0)','B=(4,0)','C=(3,3)','D=(0,2)','Polygon(A,B,C,D)']:
    cmd(page,text)
   data=json.loads(download(page,'Save').read_text())
   polygons=[o for o in data['objects'] if o['type']=='polygon'];assert len(polygons)==1
   poly=polygons[0];edges=[o for o in data['objects'] if o.get('edgeOf')==poly['id']]
   assert len(edges)==4 and all(o['type']=='segment' for o in edges)
   assert all(o.get('displayLabelMode')=='latex' for o in edges)
   page.locator('#undo').click()
   assert not any(o.get('edgeOf') for o in json.loads(download(page,'Save').read_text())['objects'])
   page.locator('#redo').click()
   assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o.get('edgeOf')==poly['id']])==4
   # A double click anywhere on the canvas in selection mode clears selection.
   page.locator('[data-tool-choice="select"]').click()
   page.locator('#objects .object').first.click()
   assert page.locator('#properties label.field').filter(has_text='Name').count()==1
   box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   page.mouse.dblclick(box['x']+box['width']-35,box['y']+box['height']-32)
   assert page.locator('#properties label.field').filter(has_text='Name').count()==0
   # Snap to visible segment despite anchor snapping and grid snapping OFF.
   page.locator('#snap').uncheck();page.locator('#snap-anchors').uncheck()
   assert page.locator('#snap-objects').is_checked()
   page.locator('[data-tool-choice="point"]').click()
   page.mouse.click(cx+2*48,cy-0.14*48)
   data=json.loads(download(page,'Save').read_text());point=data['objects'][-1]
   assert point['type']=='point' and abs(point['xy'][1])<1e-8,point
   # Object-snap OFF must not attract the next free point.
   page.locator('#snap-objects').uncheck()
   page.mouse.click(cx+2.5*48,cy-0.14*48)
   data=json.loads(download(page,'Save').read_text());point=data['objects'][-1]
   assert point['type']=='point' and abs(point['xy'][1]-0.14)<.015,point
   # Responsive + localization, no runtime module errors.
   page.locator('#ui-language').select_option('zh')
   page.set_viewport_size({'width':390,'height':780})
   assert page.locator('#drawing').is_visible() and not errors,errors
   print('ROUND28_CHROMIUM_PASS: icons/foci/dot radii, native numeric direction, JSON open icon, polygon edges and undo/redo, LaTeX defaults, double-click deselect, object snap on/off, EN/ZH and mobile')
  finally:browser.close()
if __name__=='__main__':run()
