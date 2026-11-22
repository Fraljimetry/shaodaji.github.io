"""Real Chromium: affine and inversion transforms on non-point geometric objects."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1400,'height':950},accept_downloads=True);errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   def enter(cmd):
    field=page.locator('#unified-algebra-input');field.fill(cmd);field.press('Enter')
   for src in ['A=(-3,-1)','B=(2,-1)','C=(3,2)','D=(-2,3)','O=(5,5)','V=(7,5)',
    's=Segment(A,B)','ln=Line(A,B)','circ=Circle(A,B)','pol=Polygon(A,B,C,D)',
    'bez=Bezier(A,B,C,D)','spl=Spline(A,B,C,D)',
    'Rotate(s,O,amount=0.5)','Translate(ln,O,V)','Dilate(circ,O,amount=1.4)',
    'Reflect(pol,ln)','Rotate(bez,O,amount=0.7)','Translate(spl,O,V)',
    'Invert(pol,circ)']:
    enter(src)
   page.wait_for_timeout(350)
   snap=json.loads(page.evaluate('window.__round36Snapshot()'))
   objects=snap['objects'];transformed=[o for o in objects if o['type']=='transformCopy']
   assert len(transformed)==7,(len(transformed),[o['name'] for o in transformed])
   for o in transformed:
    assert o['refs'][0] in {p['id'] for p in objects}
    assert page.locator('#drawing [data-id="'+o['id']+'"]').count()>0,(o['name'],'no rendered SVG')
   ids=[o['id'] for o in transformed]
   enter('B=(2.4,-1.3)') # Existing point assignment must remain safe and live.
   page.wait_for_timeout(100)
   after=json.loads(page.evaluate('window.__round36Snapshot()'))
   assert [o['id'] for o in after['objects'] if o['type']=='transformCopy']==ids,'identity changed after dependency update'
   assert not errors,errors
   print('ROUND292_TRANSFORM_CHROMIUM_PASS',len(transformed),'transformed objects')
  finally:browser.close()
if __name__=='__main__':run()
