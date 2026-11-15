"""Round 176: actual Chromium locale roundtrips and smooth implicit mesh."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,768,390):
   page=browser.new_page(viewport={'width':width,'height':850})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='domcontentloaded',timeout=80000)
   titles=page.locator('#settings-sections .section-heading .section-toggle span:not(.section-chevron)')
   page.locator('#ui-language').select_option('zh')
   expected=['三维可视化','界面']
   for label in expected:assert label in titles.all_text_contents(),(width,'initial zh',label,titles.all_text_contents())
   page.locator('#ui-language').select_option('en')
   for label in ['3D visualization','Interface']:
    assert label in titles.all_text_contents(),(width,'en',label,titles.all_text_contents())
   for _ in range(2):
    page.locator('#ui-language').select_option('zh')
    assert '三维可视化' in titles.all_text_contents(),(width,'zh')
    page.locator('#ui-language').select_option('en')
    assert '3D visualization' in titles.all_text_contents(),(width,'roundtrip en')
   if width==1440:
    page.locator('#scene3d-enable').check()
    page.locator('#plot-mode').select_option('implicit3d')
    page.locator('#command').fill('cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)')
    page.locator('#command').press('Enter')
    page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=100000)
    assert page.locator('#drawing polygon').count()>100
    page.screenshot(path='/mnt/data/mi176_surface.png')
    assert page.locator('#render-info').inner_text().find('PLOT LIMIT')<0
    assert page.locator('#drawing polygon').count()>1000
   assert not errors,(width,errors)
   print('ROUND176_PASS',width,flush=True)
   page.close()
 finally:browser.close()
