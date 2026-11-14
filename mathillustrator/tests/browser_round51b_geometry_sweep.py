"""Round51B local Chromium: every Geometry button, semantic glyph markers,
ordering, live circle inversion, JSON export, undo/redo, singularity handling.
"""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

CATEGORIES={
 'basic-points':['point','midpoint','pointOnObject','angle','fixedLength','fixedAngle'],
 'lines-constructions':['segment','ray','arrow','line','perpBisector','parallelThrough','perpendicularThrough','perpendicularFoot','angleBisector'],
 'circles-conics':['circle','circleDiameter','circleThrough3','circularArc','ellipse','tangentCircle','parabola','hyperbola'],
 'polygons-centers':['triangle','rectangle','parallelogram','polygon','regularPolygon','triangleCenter'],
 'intersections':['circleIntersection','circleCircleIntersection','generalIntersection'],
 'transformations':['translation','reflection','rotation','dilation','circleInversion'],
 'curves':['polyline','bezier','spline','closedSpline','freehand','locus'],
}
MARKERS={
 'pointOnObject':2,'tangentCircle':3,'circularArc':3,'parabola':1,
 'hyperbola':2,'generalIntersection':1,'reflection':2,'rotation':3,
 'translation':4,'dilation':3,'locus':1,'fixedLength':2,
 'fixedAngle':3,'triangleCenter':3,'circleInversion':3,
}

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1520,'height':1000},accept_downloads=True)
   page.set_default_timeout(11000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(230)
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   category_ids=page.locator('[data-geometry-group]').evaluate_all('(arr)=>arr.map(e=>e.dataset.geometryGroup)')
   assert set(category_ids)==set(CATEGORIES),category_ids
   assert len(category_ids)==7
   all_tools=[t for group in CATEGORIES.values() for t in group]
   assert len(all_tools)==len(set(all_tools))==43,(len(all_tools),len(set(all_tools)))
   assert page.locator('[data-tool-choice="quadrilateral"]').count()==0
   assert page.locator('[data-tool-choice="intersection"]').count()==0
   assert page.locator('[data-tool-choice="generalIntersection"]').count()==1
   for category,expected in CATEGORIES.items():
    actual=page.locator(f'[data-geometry-group="{category}"] [data-tool-choice]').evaluate_all('(arr)=>arr.map(e=>e.dataset.toolChoice)')
    assert actual==expected,(category,actual,expected)
   for tool in all_tools:
    page.locator(f'[data-tool-choice="{tool}"]').click()
    assert page.locator('#drawing').get_attribute('data-tool')==tool,tool
   assert not errors,errors
   print('stage: all 43 Geometry tools across 7 categories, exact simple-to-advanced ordering, interactive selection PASS',flush=True)
   for tool,clicks in MARKERS.items():
    image=page.locator(f'[data-tool-choice="{tool}"] svg')
    circles=image.locator('circle[fill="currentColor"]')
    assert circles.count()==clicks,(tool,circles.count(),clicks)
    assert circles.evaluate_all('(arr)=>arr.map(x=>x.getAttribute("r"))')==['2.8']*clicks,tool
    assert image.locator('path,ellipse,circle').count()>=2,tool
   for tool in ['reflection','rotation','translation','dilation','circleInversion']:
    image=page.locator(f'[data-tool-choice="{tool}"] svg')
    assert image.locator('[stroke-dasharray]').count()==0,tool
    assert image.locator('circle[fill="none"]').count()==0,tool
   inversion=page.locator('[data-tool-choice="circleInversion"] svg')
   circles=inversion.locator('circle')
   radii=circles.evaluate_all('(arr)=>arr.map(e=>e.getAttribute("r"))')
   assert '9' in radii,radii
   # Check displayed marker locations against the path geometry for tools in which
   # the clicked control points are supposed to lie on their depicted lines.
   geometry=page.evaluate('''() => {
    function dist(marker,path){
      const x=+marker.getAttribute('cx'),y=+marker.getAttribute('cy'),n=250;
      let best=1e9;for(let i=0;i<=n;i++){
       const p=path.getPointAtLength(path.getTotalLength()*i/n);
       best=Math.min(best,Math.hypot(p.x-x,p.y-y));
      }return best;
    }
    const tests=['pointOnObject','fixedLength','generalIntersection','triangleCenter'];
    return Object.fromEntries(tests.map(id=>{
      const svg=document.querySelector('[data-tool-choice="'+id+'"] svg');
      return [id,[...svg.querySelectorAll('circle[fill="currentColor"]')].map(c=>
        Math.min(...[...svg.querySelectorAll('path')].map(p=>dist(c,p))))];
    }));
   }''')
   assert all(all(d<.25 for d in distances) for distances in geometry.values()),geometry
   print('stage: redesigned Geometry glyphs, faithful markers and path placement PASS',flush=True)
   def command(source):
    page.locator('#command').fill(source)
    page.locator('#command-form button').click()
    page.wait_for_timeout(85)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click()
    page.wait_for_timeout(55)
   def click_obj(num):
    page.locator(f'#drawing [data-id="o{num}"]').first.click(force=True)
    page.wait_for_timeout(80)
   def click_ring(num):
    ring=page.locator(f'#drawing [data-id="o{num}"]').first
    box=ring.bounding_box();assert box,('missing circle rendering',num)
    page.mouse.click(box['x']+box['width']*.5,box['y']+1)
    page.wait_for_timeout(100)
   for src in ['A=(0,0)','B=(2,0)','P=(4,0)','Q=(0,4)','Circle(A,B)','Segment(P,Q)']:
    command(src)
   assert len(snapshot()['objects'])==6,snapshot()['objects']
   tool('circleInversion');click_obj(3);click_ring(5)
   objects=snapshot()['objects']
   assert len(objects)==7 and objects[-1]['type']=='transformCopy' and objects[-1]['transform']=='invert',objects
   transformed=page.locator('#drawing [data-id="o7"]')
   assert transformed.count()>=1,'inverted point is not rendered'
   print('stage: actual circle inversion of a selected point renders correctly PASS',flush=True)
   page.locator('#undo').click();page.wait_for_timeout(120)
   assert len(snapshot()['objects'])==6
   page.locator('#redo').click();page.wait_for_timeout(130)
   assert snapshot()['objects'][-1]['transform']=='invert'
   with page.expect_download() as info:page.locator('#save').click()
   saved=json.loads(open(info.value.path(),encoding='utf8').read())
   assert saved['objects'][-1]['transform']=='invert' and saved['objects'][-1]['refs']==['o3','o5'],saved['objects'][-1]
   print('stage: Undo, Redo, downloaded JSON persistence PASS',flush=True)
   tool('circleInversion');click_obj(6);click_ring(5)
   objects=snapshot()['objects']
   assert len(objects)==8 and objects[-1]['type']=='transformCopy',objects
   poly=page.locator('#drawing [data-id="o8"] polyline,#drawing polyline[data-id="o8"]')
   assert poly.count()>=1,'inverted segment must be drawn as a curved polyline'
   vertices=poly.first.get_attribute('points').split()
   assert len(vertices)>6,vertices
   print('stage: inversion of a segment uses curved geometry rather than a straight chord PASS',flush=True)
   # Click source point at the inversion center; do not create invalid copies.
   tool('circleInversion');click_obj(1);click_ring(5)
   assert len(snapshot()['objects'])==8,'center inversion was incorrectly saved'
   assert not errors,errors
   print('ROUND51B_GEOMETRY_CHROMIUM_PASS: palette sweep + redesigned glyph geometry + inverse circle + undo/redo/JSON + singular failure',flush=True)
  finally:browser.close()
if __name__=='__main__':main()
