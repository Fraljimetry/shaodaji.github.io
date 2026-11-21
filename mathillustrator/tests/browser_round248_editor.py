"""Round 248: input editor behavior in actual Chromium."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1280,'height':800})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(expose_state=True),wait_until='load')
  algebra=page.locator('#unified-algebra-input')
  algebra.fill('s = Segment(A, ')
  hint=page.locator('#unified-algebra-input-suggestions + .input-assist-status')
  assert hint.is_visible(), 'Argument hint missing'
  assert 'point B' in hint.inner_text(),hint.inner_text()
  algebra.fill('sqrt(2]')
  assert 'Mismatched' in hint.inner_text(),hint.inner_text()
  algebra.fill('sin(')
  algebra.press('Backspace')
  assert algebra.input_value()=='sin',algebra.input_value()
  algebra.fill('cos')
  algebra.press('(')
  assert algebra.input_value()=='cos()'
  algebra.press(')')
  assert algebra.evaluate('(el)=>el.selectionStart')==5
  algebra.fill('a = Slider(0, 10, 0.1, 2)')
  algebra.press('Enter')
  assert page.locator('[data-slider="a"]').count()==1
  plot=page.locator('#command')
  plot.fill('max(2, min(3, 5))')
  assert page.locator('#command-suggestions + .input-assist-status').is_hidden()
  plot.fill('sqr')
  plot.press('Tab')
  assert plot.input_value()=='sqrt()'
  plot.press('Control+Space')
  page.locator('#scene3d-enable').check(force=True)
  page.locator('#plot-mode').select_option('implicit3d')
  plot.fill('')
  plot.press('Control+Space')  # explicit request after mode switch resets the field
  assert page.locator('#command-suggestions').get_by_text('x^2+y^2+z^2=4').count()==1
  assert not errors,errors
  print('ROUND248_EDITOR_CHROMIUM_PASS')
 finally:browser.close()
