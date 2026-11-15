"""Round 138: exercise language switching and 3D/2D dynamic controls in Chromium."""
import os,sys,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=45000)
   page.locator('#ui-language').select_option('zh')
   if width<700:page.locator('#right-collapse').click()
   for text in ('三维绘图模式','界面'):
    assert page.get_by_text(text,exact=True).count(),(width,text)
   page.locator('#scene3d-enable').check()
   assert page.locator('#settings-3d').get_by_text('三维可视化').count()
   for text in ('网格精度','不透明度','视角水平角 (°)','视角俯仰角 (°)'):
    assert page.locator('#settings-3d').get_by_text(text,exact=True).count(),(width,text)
   assert page.locator('#plot-mode option:checked').inner_text()=='函数'
   page.locator('#scene3d-yaw').fill('21.25');page.locator('#scene3d-yaw').dispatch_event('change')
   assert page.locator('#scene3d-yaw').input_value()=='21.25'
   if width<700:page.locator('#left-collapse').click()
   page.locator('#plot-mode').select_option('vector3d')
   assert page.locator('#plot-mode option:checked').inner_text()=='向量场'
   page.locator('#command').fill('x');page.locator('#command-y').fill('y');page.locator('#command-z').fill('z')
   page.locator('#command-form button').click()
   if width<700:
    page.locator('#left-collapse').click();page.locator('#right-collapse').click()
   assert page.locator('#properties').get_by_text('中心对称半宽').count()
   assert page.locator('#properties').get_by_text('区域不等式').count()
   page.locator('#ui-language').select_option('en')
   assert page.locator('#settings-3d').get_by_text('Mesh detail',exact=True).count()
   assert page.locator('#plot-mode option:checked').inner_text()=='Vector field'
   page.locator('#ui-language').select_option('zh')
   assert page.locator('#plot-mode option:checked').inner_text()=='向量场'
   assert not errors,errors
   geometry=page.evaluate('''() => [...document.querySelectorAll('#settings-3d input, #settings-3d select, #properties input, #properties select')].filter(el=>el.getClientRects().length).map(el=>({id:el.id||el.getAttribute('aria-label')||el.type, x:el.getBoundingClientRect().left, right:el.getBoundingClientRect().right, width:el.getBoundingClientRect().width, parentRight:el.closest('label')?.getBoundingClientRect().right})).filter(el=>el.width<10 || el.x < -1 || el.right > window.innerWidth+1 || (el.parentRight && el.right > el.parentRight+2))''')
   assert not geometry,(width,geometry)
   # Check visible static english residues in primary panels.
   leftovers=page.evaluate('''() => [...document.querySelectorAll('#settings-3d label, #settings-3d h3, #properties label, #rightpanel label')].filter(el => el.getClientRects().length && /^[A-Za-z][A-Za-z\\s()°-]+$/.test(el.childNodes[0]?.textContent?.trim()||'') && !/^(F|X|Y|Z)\\(/.test(el.textContent)).map(el => el.childNodes[0].textContent.trim()).slice(0,25)''')
   print('PASS zh switch',width,'residues',leftovers,flush=True)
   page.close()
 finally:browser.close()
