"""Round 177: populated point and plotting UI have reversible live translations."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,768):
   p=b.new_page(viewport={'width':width,'height':850})
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(legacy_search_expanded=False),wait_until='domcontentloaded',timeout=90000)
   p.locator('#command').fill('P=(0,0)');p.locator('#command').press('Enter')
   p.wait_for_timeout(120)
   p.locator('#objects .object').first.evaluate('(e)=>e.click()')
   for lang in ('zh','en','zh','en'):
    p.locator('#ui-language').select_option(lang)
    content=p.locator('#properties').inner_text()
    assert ('不透明度' if lang=='zh' else 'Opacity') in content,(width,lang,content[:500])
    assert ('大小' if lang=='zh' else 'Size') in content,(width,lang,content[:500])
   # Switching to 3D and cycling plot modes must not retain old-language options.
   p.locator('#scene3d-enable').evaluate("e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}))}")
   for lang in ('zh','en','zh','en'):
    p.locator('#ui-language').select_option(lang)
    options=p.locator('#plot-mode option').all_text_contents()
    assert ('参数曲面' if lang=='zh' else 'Parametric surface') in options,(width,lang,options)
    assert ('隐式曲面' if lang=='zh' else 'Implicit surface') in options,(width,lang,options)
   assert not errors,(width,errors)
   print('ROUND177_POPULATED_PASS',width,flush=True)
   p.close()
 finally:b.close()
