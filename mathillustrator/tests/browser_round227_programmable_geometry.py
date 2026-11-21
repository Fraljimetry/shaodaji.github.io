"""Round 227 Chromium: live measurement geometry, undo/redo, rollback, 3D isolation."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':880})
   page.set_default_timeout(5000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def enter(text):
    page.locator('#unified-algebra-input').fill(text);page.locator('#unified-algebra-input').press('Enter')
   enter('a = Slider(1, 5, 0.5, 2)')
   enter('A = (0,0)');enter('B = (2,0)')
   enter('C = (a,a)')
   for item in ['Segment(A,C)','FixedLength(A,B,a)','FixedAngle(A,B,pi/a)','Rotate(B,A,a/2)','Dilate(B,A,a)']:
    enter(item)
   d=snap();assert len(d['objects'])==8,d['objects']
   assert d['objects'][2]['xy']==[2,2]
   assert len([o for o in d['objects'] if o.get('measureExpr')])==4
   page.locator('#objects [data-slider="a"]').click();page.get_by_label('Value',exact=True).fill('4');page.get_by_label('Value',exact=True).press('Enter')
   d=snap();assert d['objects'][2]['xy']==[4,4]
   assert [o['amount'] for o in d['objects'] if o['type']=='transformCopy']==[2,4]
   assert [o['length'] for o in d['objects'] if o['type']=='fixedLength']==[4]
   page.locator('#undo').click();assert snap()['objects'][2]['xy']==[2,2]
   page.locator('#redo').click();assert snap()['objects'][2]['xy']==[4,4]
   before=snap()
   enter('FixedLength(A,B,1/0)');assert snap()==before
   enter('Rotate(B,A,badName)');assert snap()==before
   # Invalid range must not damage any existing construction.
   page.locator('#objects [data-slider="a"]').click();page.get_by_label('Value',exact=True).fill('1');page.get_by_label('Value',exact=True).press('Enter')
   before=snap();enter('FixedLength(A,B,-a)');assert snap()==before
   # Existing commands and property editing must coexist.

   length=next(o for o in before['objects'] if o['type']=='fixedLength')
   page.locator('#objects [data-id="'+length['id']+'"]').click()
   editor=page.locator('#properties').get_by_label('Length expression')
   editor.fill('a+1');editor.press('Tab')
   assert next(o for o in snap()['objects'] if o['id']==length['id'])['length']==2
   page.locator('#scene3d-enable').check()
   assert page.locator('#drawing [data-slider-handle]').count()==0
   assert not errors,errors
   print('ROUND227_PROGRAMMABLE_GEOMETRY_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
