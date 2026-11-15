"""Round 163: live bilingual UI, dynamic hints, accessible instructions and switching."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':850})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False), wait_until='load',timeout=60000)
   page.locator('#ui-language').select_option('zh')
   assert page.locator('#snap-step').get_attribute('title').startswith('范围：')
   assert page.locator('#objects').get_attribute('aria-label')=='可绘制对象'
   assert page.locator('#preset option[value="Custom"]').inner_text()=='自定义'
   assert '拖动对象' in page.locator('#mode-label').get_attribute('aria-label')
   page.locator('#ui-language').select_option('en')
   assert page.locator('#snap-step').get_attribute('title').startswith('Range:')
   assert page.locator('#objects').get_attribute('aria-label')=='Drawable objects'
   assert 'Drag objects' in page.locator('#mode-label').get_attribute('aria-label')
   page.locator('#ui-language').select_option('zh')
   page.locator('#scene3d-enable').evaluate("el=>{el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}))}")
   assert page.locator('#scene3d-detail').get_attribute('title').startswith('范围：')
   assert not errors,errors
   page.close()
  print('PASS Round 163 actual Chromium, 1440/768/390/320, bilingual dynamic hints & accessibility')
 finally: browser.close()
