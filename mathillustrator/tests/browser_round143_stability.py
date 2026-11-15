"""Round 143 local Chromium stability soak: real UI commands, recovery and transitions."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd


def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':860},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_default_timeout(3500)
   page.set_content(inline_html(expose_state=True),wait_until='load')
   count=lambda:int(page.locator('#object-count').inner_text())
   # Repeated sequential command commits, UI rerenders and history mutations.
   for i in range(12):
    cmd(page,f'P{i}=({i/4},{i%7})')
   assert count()==12,('lost command during burst',count())
   for _ in range(4):page.locator('#undo').click()
   assert count()==8,('undo mismatch',count())
   for _ in range(4):page.locator('#redo').click()
   assert count()==12,('redo mismatch',count())
   for i in range(4):
    page.locator('#ui-language').select_option('zh' if i%2==0 else 'en')
    page.locator('#theme').select_option('dark' if i%2==0 else 'light')
   assert count()==12,'locale/theme switch lost objects'
   # Invalid model from external file must not overwrite current scene.
   page.locator('#open-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{broken json'})
   assert count()==12,'invalid import changed scene'
   page.locator('#new').click()
   assert count()==0,'new did not clear scene'
   page.locator('#undo').click()
   # New participates in undo history; it must restore the prior scene.
   assert count()==12,'undo did not restore previous project scene'
   assert not errors,errors
   print('ROUND143_STABILITY_PASS: 12 command commits, 8 history operations, 8 UI switches, bad import rollback, undoable New, no JS exceptions')
  finally:browser.close()
if __name__=='__main__':run()
