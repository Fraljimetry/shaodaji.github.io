"""Actual Chromium translation regression for populated 3D list and status footer."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,768):
   page=b.new_page(viewport={'width':width,'height':830})
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='domcontentloaded',timeout=90000)
   page.locator('#scene3d-enable').evaluate("e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}))}")
   page.locator('#plot-mode').select_option('surface3d' if width==390 else 'implicit3d')
   page.locator('#command').fill('0' if width==390 else 'x*x+y*y+z*z-4')
   page.locator('#command').press('Enter')
   page.wait_for_function("document.querySelector('#objects-3d .object-label strong') && !document.querySelector('#render-info').textContent.includes('rendering')",timeout=85000)
   original=page.locator('#objects-3d .object-label strong').first.inner_text()
   assert original.startswith('Surface' if width==390 else 'Implicit surface'),(width,original)
   for lang in ('zh','en','zh','en'):
    page.locator('#ui-language').select_option(lang)
    label=page.locator('#objects-3d .object-label strong').first.inner_text()
    status=page.locator('#render-info').inner_text()
    if lang=='zh':assert label.startswith('曲面' if width==390 else '隐式曲面') and '个三维图形' in status,(width,label,status)
    else:assert label==original and '3D plots' in status,(width,label,status)
   assert not errors,(width,errors)
   print('ROUND200_TRANSLATION_PASS',width,flush=True)
   page.close()
 finally:b.close()
