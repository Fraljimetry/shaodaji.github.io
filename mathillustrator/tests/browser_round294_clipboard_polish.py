"""Round294 real-browser clipboard shortcuts, focus, and transactional behavior."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1400,'height':950});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   def enter(value):
    field=page.locator('#unified-algebra-input');field.fill(value);field.press('Enter')
   def objects():return json.loads(page.evaluate('window.__round36Snapshot()'))['objects']
   def pointXY(ref):return next(o['xy'] for o in objects() if o['id']==ref)
   for cmd in ['A=(0,0)','B=(4,0)','s=Segment(A,B)']:enter(cmd)
   seg=next(o for o in objects() if o['name']=='s')
   def focus_segment():
    row=page.locator('#objects .object[data-id="'+seg['id']+'"]');row.click();row.focus()
   focus_segment();page.keyboard.press('Control+c');page.keyboard.press('Control+v')
   first=objects()[-1]; assert [pointXY(ref) for ref in first['refs']]==[[.5,.5],[4.5,.5]]
   page.keyboard.press('Control+v');second=objects()[-1]
   assert [pointXY(ref) for ref in second['refs']]==[[1,1],[5,1]]
   page.keyboard.press('Control+Shift+v');third=objects()[-1]
   assert [pointXY(ref) for ref in third['refs']]==[[0,0],[4,0]]
   page.keyboard.press('Control+v');fourth=objects()[-1]
   assert [pointXY(ref) for ref in fourth['refs']]==[[1.5,1.5],[5.5,1.5]],'in-place paste should not advance offset'
   assert len(set(o['name'] for o in objects()))==len(objects())
   page.keyboard.press('Control+z');assert len(objects())==12
   page.keyboard.press('Control+y');assert len(objects())==15
   page.keyboard.press('Escape');assert page.locator('#objects .object.selected').count()==0
   focus_segment();page.keyboard.press('Control+d');assert len(objects())==18
   # Text input must retain native clipboard shortcuts without modifying geometry.
   inp=page.locator('#unified-algebra-input');inp.fill('hello');before=len(objects())
   for key in ['Control+a','Control+c','Control+v','Control+Shift+v','Control+x','Delete']:
    inp.press(key)
   assert len(objects())==before
   # An ordinary toolbar control must not trigger object paste when focused.
   focus_segment();page.locator('#undo').focus();page.keyboard.press('Control+v')
   assert len(objects())==before
   assert not errors,errors
   print('ROUND294_CLIPBOARD_POLISH_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
