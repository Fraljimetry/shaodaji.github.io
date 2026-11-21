"""Browser E2E for 2D slider animation modes, persistence, and dependencies."""
import os, json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':880})
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#algebra-toggle').click()
   def enter(line):
    page.locator('#algebra-input').fill(line);page.locator('#algebra-form button').click()
   enter('a = Slider(0, 10, 0.1, 2, 2, oscillatory)')
   enter('P = (a, 3)')
   enter('b = Slider(-1, 1, 0.1, 0, periodic)')
   assert next(x for x in snapshot()['algebra']['sliders'] if x['name']=='b')['playMode']=='periodic'
   slider=lambda:next(x for x in snapshot()['algebra']['sliders'] if x['name']=='a')
   assert slider()['playMode']=='oscillatory' and slider()['playSpeed']==2, slider()
   page.locator('#algebra-list').get_by_role('button',name='Play slider a').click()
   page.wait_for_timeout(320)
   state=snapshot();changed=next(x for x in state['algebra']['sliders'] if x['name']=='a')['value'];assert changed!=2,changed
   point=next(o for o in state['objects'] if o['name']=='P')
   assert abs(point['xy'][0]-changed)<1e-7,(point,changed)
   page.get_by_role('button',name='Pause slider a').click()
   stopped=slider()['value'];page.wait_for_timeout(180);assert slider()['value']==stopped
   page.locator('#undo').click();assert slider()['value']==2
   page.locator('#redo').click();assert slider()['value']==stopped
   page.locator('#algebra-list [data-slider="a"]').click(position={'x':15,'y':10})
   assert page.locator('#properties').get_by_label('Play mode').count()==1
   page.locator('#properties').get_by_label('Play mode').select_option('once')
   page.locator('#properties').get_by_label('Speed (cycles/s)').fill('10')
   page.locator('#properties').get_by_label('Speed (cycles/s)').press('Tab')
   assert slider()['playMode']=='once' and slider()['playSpeed']==10,slider()
   page.locator('#algebra-list').get_by_role('button',name='Play slider a').click()
   page.wait_for_timeout(400)
   assert slider()['value']==10,slider()
   assert page.locator('#algebra-list').get_by_role('button',name='Play slider a').count()==1
   assert not errors,errors
   print('ROUND234_SLIDER_PLAYBACK_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
