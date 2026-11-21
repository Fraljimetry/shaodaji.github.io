"""Round 228: compact Algebra controls, dependency locks and reversible deletion."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1200,'height':800})
   errors=[];dialogs=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#algebra-toggle').click()
   def enter(src):
    page.locator('#algebra-input').fill(src);page.locator('#algebra-form button').click()
   enter('a = Slider(0, 10, 0.5, 3)')
   enter('A = (a, 0)')
   enter('B = (0, 0)')
   enter('Segment(A,B)')
   assert len(snap()['objects'])==3
   assert page.locator('#algebra-list .object-menu-toggle').count()>=2
   font=page.locator('#algebra-input').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')
   assert font<=13,font
   page.locator('#algebra-list [data-slider="a"] .algebra-entry-label').click()
   assert page.locator('#properties').get_by_label('Minimum').count()==1
   page.locator('#properties').get_by_label('Maximum').fill('12')
   page.locator('#properties').get_by_label('Maximum').press('Tab')
   assert snap()['algebra']['sliders'][0]['max']==12
   # An invalid range is rolled back, and there is no native prompt.
   page.locator('#properties').get_by_label('Minimum').fill('50')
   page.locator('#properties').get_by_label('Minimum').press('Tab')
   assert snap()['algebra']['sliders'][0]['min']==0
   menu=page.locator('#algebra-list [data-slider="a"] .object-menu-toggle')
   menu.click();assert page.locator('#object-action-menu [data-action="visibility"]').count()==1
   page.locator('#object-action-menu [data-action="lock"]').click()
   assert snap()['algebra']['sliders'][0]['locked'] is True
   assert page.locator('#algebra-list [data-slider="a"] input[type=range]').is_disabled()
   # The point and its transitive child segment are locked, while unrelated B is free.
   ids=[o['id'] for o in snap()['objects']]
   page.locator('#algebra-list [data-id="'+ids[0]+'"]').click()
   assert 'Locked' in page.locator('#properties').inner_text()
   page.locator('#objects-tab').click()
   page.locator('#objects [data-id="'+ids[2]+'"]').click()
   assert 'Locked' in page.locator('#properties').inner_text()
   page.locator('#algebra-toggle').click()
   menu=page.locator('#algebra-list [data-slider="a"] .object-menu-toggle')
   menu.click();page.locator('#object-action-menu [data-action="lock"]').click()
   page.locator('#algebra-list [data-slider="a"] .algebra-entry-label').click()
   assert page.locator('#properties').get_by_label('Maximum').count()==1
   # Hiding does not delete the variable or dependent geometry.
   menu=page.locator('#algebra-list [data-slider="a"] .object-menu-toggle')
   menu.click();page.locator('#object-action-menu [data-action="visibility"]').click()
   assert snap()['algebra']['sliders'][0]['visible'] is False
   assert len(snap()['objects'])==3
   menu=page.locator('#algebra-list [data-slider="a"] .object-menu-toggle')
   menu.click();page.locator('#object-action-menu [data-action="delete"]').click()
   assert len(snap()['algebra']['sliders'])==0
   assert len(snap()['objects'])==1
   assert page.locator('#algebra-trash-count').inner_text()=='1'
   page.locator('#algebra-recently-deleted summary').click()
   page.locator('#algebra-trash-items button').first.click()
   assert len(snap()['algebra']['sliders'])==1 and len(snap()['objects'])==3
   page.locator('#algebra-list [data-slider="a"] .algebra-entry-label').click()
   page.locator('#properties').get_by_label('Name').fill('r')
   page.locator('#properties').get_by_label('Name').press('Tab')
   assert snap()['algebra']['sliders'][0]['name']=='r'
   assert next(o for o in snap()['objects'] if o['name']=='A')['xyExpr'][0]=='r'
   page.locator('#objects-tab').click()
   page.locator('#objects [data-id="'+ids[0]+'"] .object-menu-toggle').click()
   page.locator('#object-action-menu [data-action="lock"]').click()
   page.locator('#objects [data-id="'+ids[2]+'"] .object-menu-toggle').click()
   assert page.locator('#objects [data-id="'+ids[2]+'"]').get_attribute('data-locked')=='true'
   assert page.locator('#object-action-menu [data-action="delete"]').is_disabled()
   assert len(snap()['objects'])==3, 'locked dependent must not be deleted'
   assert len(dialogs)==0,dialogs
   assert not errors,errors
   print('ROUND228_ALGEBRA_UI_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
