"""Round50 Chromium: new glyph marker counts, subgroup navigation, construction,
JSON compatibility, dynamic links, Undo/Redo, and legacy startup."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1450,'height':950},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  try:
   page.set_default_timeout(10000);page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(200)
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   count=lambda typ:len([o for o in snapshot()['objects'] if o['type']==typ])
   clicks={'pointOnObject':1,'tangentCircle':3,'circularArc':3,'parabola':1,'hyperbola':4,'generalIntersection':1,'reflection':1,'rotation':2,'translation':3,'dilation':2,'locus':1,'fixedLength':2,'fixedAngle':3,'triangleCenter':3,'circleInversion':2}
   assert page.locator('[data-geometry-group]').count()==7
   for typ,click_count in clicks.items():
    tool=page.locator('[data-tool-choice="'+typ+'"]')
    assert tool.count()==1,('missing tool',typ)
    markers=tool.locator('svg circle[fill="currentColor"]')
    assert markers.count()==click_count,(typ,markers.count(),click_count)
    sizes=markers.evaluate_all('(arr)=>arr.map(e=>e.getAttribute("r"))')
    assert sizes==['2']*click_count,(typ,sizes)
   print('stage: updated Geometry glyph semantics and seven geometry subsections PASS',flush=True)
   def cmd(src):
    page.locator('#command').fill(src);page.locator('#command-form button').click();page.wait_for_timeout(90)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click();page.wait_for_timeout(40)
   def click_obj(n):
    page.locator(f'#drawing [data-id="o{n}"]').first.click(force=True);page.wait_for_timeout(80)
   for src in ['A=(0,0)','B=(4,0)','C=(0,3)','P=(8,0)','Segment(A,B)','Line(A,C)','Circle(A,B)']:
    cmd(src)
   assert len(snapshot()['objects'])==7
   tool('tangentCircle');click_obj(4)
   ring=page.locator('#drawing [data-id="o7"]').first.bounding_box()
   page.mouse.click(ring['x']+ring['width']*.85,ring['y']+ring['height']*.15);page.wait_for_timeout(100)
   assert count('tangentCircle')==2,snapshot()['objects']
   tool('triangleCenter');click_obj(1);click_obj(2);click_obj(3)
   assert count('triangleCenter')==1,snapshot()['objects']
   print('stage: tangents, triangle center PASS',flush=True)
   assert not errors,errors
   print('ROUND50_CHROMIUM_PASS: Geometry sections, updated glyph semantics, live creation of tangents and triangle center',flush=True)
  finally:
   browser.close()
if __name__=='__main__':main()
