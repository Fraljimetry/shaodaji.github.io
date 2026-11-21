"""Round 263: live Properties are translated reversibly; mathematical formulas stay untouched."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   page=browser.new_page(viewport={'width':1240,'height':820})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=90000)
   page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
   box=page.locator('#unified-algebra-input')
   box.fill('a = Slider(0, 10, 0.5, 3)');box.press('Enter')
   page.locator('#objects [data-slider="a"]').click()
   page.locator('#ui-language').select_option('zh')
   names=page.locator('#properties label.field').all_text_contents()
   for name in ('名称','表达式','最小值','最大值','步长','数值','颜色'):
    assert any(name in x for x in names),(theme,name,names)
   assert page.get_by_label('表达式',exact=True).input_value().startswith('Slider(')
   assert '显示边框' in page.locator('#properties').inner_text()
   page.locator('#ui-language').select_option('en')
   names=page.locator('#properties label.field').all_text_contents()
   for name in ('Name','Expression','Minimum','Maximum','Step','Value','Color'):
    assert any(name in x for x in names),(theme,name,names)
   page.locator('#ui-language').select_option('zh')
   assert page.get_by_label('表达式',exact=True).count()==1
   assert not errors,(theme,errors)
   page.close()
  print('ROUND263_TRANSLATION_CHROMIUM_PASS')
 finally:browser.close()
