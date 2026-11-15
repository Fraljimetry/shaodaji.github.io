"""Round 139: region labels and accessibility text switch reversibly."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,390):
   page=browser.new_page(viewport={'width':width,'height':850})
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=45000)
   if width<700:page.locator('#right-collapse').click()
   page.locator('#scene3d-enable').check()
   if width<700:page.locator('#left-collapse').click()
   page.locator('#plot-mode').select_option('vector3d')
   page.locator('#command').fill('x')
   page.locator('#command-y').fill('y')
   page.locator('#command-z').fill('z')
   page.locator('#command-form button').click()
   if width<700:
    page.locator('#left-collapse').click()
    page.locator('#right-collapse').click()
   for lang,expected in [('zh',('中心对称半宽','区域不等式')),('en',('Centered half-range','Region inequality')),('zh',('中心对称半宽','区域不等式')),('en',('Centered half-range','Region inequality'))]:
    page.locator('#ui-language').select_option(lang)
    labels=page.locator('#properties .region-extras > label')
    assert labels.count()==2,(width,lang,labels.count())
    for i,caption in enumerate(expected):
     label=labels.nth(i)
     assert label.evaluate('(el)=>el.firstChild.textContent')==caption,(width,lang,i,label.inner_text())
     control=label.locator('input')
     assert control.get_attribute('aria-label')==caption,(width,lang,i,control.get_attribute('aria-label'))
     assert label.evaluate('(el)=>getComputedStyle(el).textAlign')=='left',(width,lang,i)
     assert label.evaluate('(el)=>getComputedStyle(el).alignItems')=='stretch',(width,lang,i)
   assert not errors,(width,errors)
   print('PASS Round139 region labels',width,flush=True)
   page.close()
 finally:browser.close()
