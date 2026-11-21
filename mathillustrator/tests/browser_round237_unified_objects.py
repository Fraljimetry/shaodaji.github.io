"""Round 237: consolidated Objects with toggleable Find/Algebra entry."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':860});errors=[]
   page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   assert page.locator('#unified-algebra-input').is_visible()
   assert page.locator('#object-search').is_hidden()
   assert page.locator('#object-input-toggle').get_attribute('title')=='Switch to Find'
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def enter(line):
    page.locator('#unified-algebra-input').fill(line)
    page.locator('#unified-algebra-form button').click()
   for line in ['a = Slider(0, 10, 0.5, 2)','A = (a, 0)','B = (0, 0)','s = Segment(A,B)']:enter(line)
   assert snap()['objects'][-1]['name']=='s'
   assert page.locator('#objects [data-slider="a"]').count()==1
   assert page.locator('#objects [data-id]').count()==3
   page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
   assert page.locator('#properties .slider-property-value-range').count()==1
   page.locator('#object-input-toggle').click()
   assert page.locator('#object-search').is_visible()
   assert page.locator('#unified-algebra-input').is_hidden()
   assert page.locator('#object-input-toggle').get_attribute('title')=='Switch to Algebra input'
   page.locator('#object-search').fill('s')
   assert page.locator('#objects [data-id]').count()==1
   assert page.locator('#objects [data-slider]').count()==0
   page.locator('#object-input-toggle').click()
   assert page.locator('#objects [data-id]').count()==3
   assert page.locator('#objects [data-slider]').count()==1
   page.locator('#objects [data-slider="a"] .slider-play-toggle').click()
   page.wait_for_timeout(150)
   page.locator('#objects [data-slider="a"] .slider-play-toggle').click()
   assert page.locator('#recently-deleted').count()==1
   assert page.locator('#algebra-toggle').count()==0
   # Shared menu, trash, and inspector stay functional without the old tab.
   page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
   assert page.locator('#properties .slider-property-value-range').count()==1
   page.locator('#properties-toggle').click()
   assert page.locator('#properties').is_hidden()
   page.locator('#properties-toggle').click()
   assert page.locator('#properties').is_visible()
   before=snap()
   page.locator('#objects [data-id]').first.click()
   assert page.locator('#properties').is_visible()
   assert snap()['objects']==before['objects']
   # A substantial list still scrolls through the original virtualized Objects renderer.
   for i in range(65):enter(f'Q{i} = ({i}, 0)')
   assert len(snap()['objects'])==68
   root=page.locator('#objects')
   root.evaluate('(el)=>el.scrollTop=el.scrollHeight')
   page.wait_for_timeout(80)
   assert page.locator('#objects .list-spacer').count()>=1
   root.evaluate('(el)=>el.scrollTop=0')
   page.wait_for_timeout(80)
   assert page.locator('#objects [data-slider="a"]').count()==1
   # The 3D workspace retains search, not a phantom algebra editor.
   page.locator('#mode-3d').click() if page.locator('#mode-3d').count() else None
   assert not errors,errors
   print('ROUND237_UNIFIED_OBJECTS_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
