"""Round 51H: real Chromium use of constructed intersections as points, including
snapping, tangent/transform/foot creation, undo/redo and JSON persistence.
"""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1530,'height':1020},accept_downloads=True)
   page.set_default_timeout(16000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept('90') if d.type=='prompt' else d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(200)
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expr):
    page.locator('#command').fill(expr)
    page.locator('#command-form button').click()
    page.wait_for_timeout(90)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click()
    page.wait_for_timeout(75)
   def at(oid):
    circle=page.locator(f'#drawing circle[data-id="{oid}"]').first
    circle.wait_for(state='visible')
    box=circle.bounding_box()
    assert box,(oid,'not rendered as a point')
    return box['x']+box['width']/2,box['y']+box['height']/2
   def tap(oid):
    page.mouse.click(*at(oid))
    page.wait_for_timeout(95)
   def obj(oid):return next(o for o in state()['objects'] if o['id']==oid)
   for e in ['A=(-2,0)','B=(-2,3)','C=(2,0)','D=(2,3)','Circle(A,B)','Circle(C,D)',
             'O=(0,0)','R=(1,0)','Circle(O,R)','Line(O,R)']:
    cmd(e)
   ring_left=page.locator('#drawing circle[data-id="o5"]').bounding_box()
   ring_right=page.locator('#drawing circle[data-id="o6"]').bounding_box()
   assert ring_left and ring_right
   tool('circleIntersection')  # Unified intersection tool handles two circles.
   page.mouse.click(ring_left['x']+ring_left['width']*.146447,ring_left['y']+ring_left['height']*.146447)
   page.wait_for_timeout(90)
   page.mouse.click(ring_right['x']+ring_right['width']*.853553,ring_right['y']+ring_right['height']*.146447)
   page.wait_for_timeout(170)
   crossings=[o for o in state()['objects'] if o['type']=='circleCircleIntersection']
   assert len(crossings)==2,crossings
   i,j=[o['id'] for o in crossings]
   assert at(i)!=at(j)
   print('stage: two circle-intersection points constructed and drawn PASS',flush=True)

   tool('tangentCircle')
   tap(i)
   # R lies on the circle stroke. A point marker may be the topmost SVG
   # hit; the tool must still choose the underlying circle by its geometry role.
   tap('o8')
   page.wait_for_timeout(170)
   tangents=[o for o in state()['objects'] if o['type']=='tangentCircle']
   assert len(tangents)==2 and all(o['refs']==[i,'o9'] for o in tangents),tangents
   print('stage: circle-intersection point accepted as tangent source PASS',flush=True)

   tool('rotation')
   tap(i)
   tap(j)
   page.wait_for_timeout(140)
   rotations=[o for o in state()['objects'] if o['type']=='transformCopy' and o['transform']=='rotate']
   assert rotations and rotations[-1]['refs']==[i,j],rotations
   print('stage: circle-intersection point accepted as rotation source and center PASS',flush=True)

   tool('perpendicularFoot')
   tap(i)
   line=page.locator('#drawing [data-id="o10"]:not(circle)').first
   line.wait_for(state='attached')
   # Supporting x-axis: choose a point away from all other anchors.
   canvas=page.locator('#drawing').bounding_box()
   px=canvas['x']+canvas['width']/2+48*3
   py=canvas['y']+canvas['height']/2
   page.mouse.click(px,py)
   page.wait_for_timeout(140)
   feet=[o for o in state()['objects'] if o['type']=='perpendicularFoot']
   assert feet and feet[-1]['refs']==[i,'o10'],feet
   print('stage: derived point reused by Perpendicular Foot without creating a new free point PASS',flush=True)

   tool('translation')
   tap(i)
   tap(i)
   tap(j)
   page.wait_for_timeout(120)
   translations=[o for o in state()['objects'] if o['type']=='transformCopy' and o['transform']=='translate']
   assert translations and translations[-1]['refs']==[i,i,j],translations
   print('stage: translation accepts derived start/end points PASS',flush=True)
   old_len=len(state()['objects'])
   page.locator('#undo').click();page.wait_for_timeout(110)
   assert len(state()['objects'])==old_len-1
   page.locator('#redo').click();page.wait_for_timeout(120)
   assert len(state()['objects'])==old_len
   with page.expect_download() as download:page.locator('#save').click()
   saved=json.loads(open(download.value.path(),encoding='utf8').read())
   assert any(o['type']=='transformCopy' and o['transform']=='translate' and o['refs']==[i,i,j] for o in saved['objects'])
   assert any(o['type']=='perpendicularFoot' and o['refs']==[i,'o10'] for o in saved['objects'])
   assert not errors,errors
   print('ROUND51H_CHROMIUM_PASS: derived points usable for tangent, transforms, foot, undo/redo and JSON',flush=True)
  finally:browser.close()
if __name__=='__main__':main()
