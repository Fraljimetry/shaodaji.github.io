"""Round 169: full polar-checkbox label in both locales."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for width in (1440,390):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   page.locator('#plot-mode').select_option('parametric')
   page.locator('#command').fill('cos(t)')
   page.locator('#command-y').fill('sin(t)')
   page.locator('#command').press('Enter')
   assert page.locator('#properties').get_by_label('Use polar coordinates').count()==1
   assert page.locator('#properties').get_by_text('Use polar coordinates',exact=True).count()==1
   page.locator('#ui-language').select_option('zh')
   assert page.locator('#properties').get_by_label('使用极坐标').count()==1
   assert page.locator('#properties').get_by_text('使用极坐标',exact=True).count()==1
   page.close()
   print('PASS',width,flush=True)
 finally:browser.close()
