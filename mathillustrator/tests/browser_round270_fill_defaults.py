"""Historical Round 270 check, adapted to Round 274's selected-object fill UI.

Per-type fill settings in old JSON remain parseable, but their old UI was retired.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1440,'height':900})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
  assert page.locator('#new-fill-type').count()==0
  assert page.locator('#new-fill-enabled').count()==1
  assert page.locator('#new-fill-enabled').is_disabled()
  assert not errors,errors
  page.close()
  html=Path(__file__).resolve().parents[1].joinpath('tutorial.html').read_text()
  for mode in ('en','zh'):
   page=browser.new_page()
   page.set_content(html,wait_until='load')
   page.evaluate('(mode)=>document.documentElement.dataset.lang=mode',mode)
   text=page.locator('nav a[href="#construction-arguments"]').inner_text()
   assert ('Constructor arguments' in text)==(mode=='en'),(mode,text)
   assert ('构造参数' in text)==(mode=='zh'),(mode,text)
   page.close()
 finally:browser.close()
print('Round 270 legacy coverage updated for Round 274 UI PASS')
