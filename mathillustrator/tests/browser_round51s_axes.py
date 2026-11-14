"""R51S: live virtual axes construction, undo/redo, hidden guides, and no startup errors."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   p=b.new_page(viewport={'width':1450,'height':930});p.set_default_timeout(12000)
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(p.evaluate('window.__round36Snapshot()'))
   canvas=p.locator('#drawing'); box=canvas.bounding_box();assert box
   # The image origin is centered when initial view has cx=cy=0.
   cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   assert p.locator('#drawing [data-axis="axis-x"]').count()==1
   assert p.locator('#drawing [data-axis="axis-y"]').count()==1
   def tool(name):p.locator(f'[data-tool-choice="{name}"]').click();p.wait_for_timeout(60)
   tool('pointOnObject')
   p.mouse.click(cx+120,cy);p.wait_for_timeout(75)
   p.mouse.click(cx+165,cy+30);p.wait_for_timeout(150)
   pts=[o for o in state()['objects'] if o['type']=='pointOnObject']
   assert len(pts)==1 and pts[0]['refs']==['axis-x'],pts
   assert p.locator('#drawing circle[data-id="'+pts[0]['id']+'"]').count()>=1
   p.locator('#undo').click();p.wait_for_timeout(100)
   assert not state()['objects']
   p.locator('#redo').click();p.wait_for_timeout(100)
   assert state()['objects'][0]['refs']==['axis-x']
   tool('generalIntersection')
   p.mouse.click(cx+115,cy);p.wait_for_timeout(65)
   p.mouse.click(cx,cy-120);p.wait_for_timeout(140)
   roots=[o for o in state()['objects'] if o['type']=='generalIntersection']
   assert roots and roots[0]['refs']==['axis-x','axis-y'],roots
   # Hiding axes removes hit surfaces but does not destroy persisted
   # dependencies; restoring them makes the same guides usable again.
   p.locator('#axes').uncheck();p.wait_for_timeout(110)
   assert p.locator('#drawing [data-axis]').count()==0
   assert len(state()['objects'])==2
   p.locator('#axes').check();p.wait_for_timeout(110)
   assert p.locator('#drawing [data-axis]').count()==2
   assert not errors,errors
   print('ROUND51S_CHROMIUM_PASS axes point-on-object, general intersection, undo/redo, startup',flush=True)
  finally:b.close()
if __name__=='__main__':main()
