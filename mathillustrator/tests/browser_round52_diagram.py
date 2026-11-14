"""Round 52: two routing modes, fixed diagram snapping, glyph and label defaults."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1450,'height':900});page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(expose_state=True),wait_until='load')
  assert page.locator('[data-tool-choice="circleInversion"] svg').count()==1
  glyph=page.locator('[data-tool-choice="circleInversion"] svg').inner_html()
  assert 'cx="21"' in glyph and 'cx="15.75"' in glyph,glyph
  for t in ['node','morphism','text']:
   page.locator(f'[data-tool-choice="{t}"]').click()
   assert page.locator('#snap').is_checked(),t
   assert page.locator('#snap').is_disabled(),t
  page.locator('[data-tool-choice="point"]').click()
  assert not page.locator('#snap').is_disabled()
  assert not errors,errors
  print('ROUND52_CHROMIUM_PASS glyph and mandatory diagram snap')
 finally:browser.close()
