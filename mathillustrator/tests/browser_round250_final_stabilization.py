"""Actual Chromium coverage for final Smart Input integration and popup geometry."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for size in [({'width':1280,'height':800}),({'width':760,'height':720})]:
   page=browser.new_page(viewport=size)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load')
   algebra=page.locator('#unified-algebra-input')
   algebra.fill('alpha = Slider(0, 10, 0.5, 2)');algebra.press('Enter')
   assert page.locator('[data-slider="alpha"]').count()==1
   algebra.fill('alp')
   assert page.locator('#unified-algebra-input-suggestions').get_by_text('alpha',exact=True).count()==1, 'Slider name omitted from Algebra suggestions'
   algebra.fill('Node(1, 2, "sin')
   assert page.locator('#unified-algebra-input-suggestions').is_hidden(),'Function suggested inside quoted label'
   plot=page.locator('#command')
   page.locator('#plot-mode').select_option('parametric')
   plot.fill('t')
   assert page.locator('#command-suggestions').get_by_text('t',exact=True).count()==1,'2D parameter missing'
   plot.fill('x+')
   plot.press('Control+Space')
   assert page.locator('#command-suggestions').get_by_text('sin(…)',exact=True).count()==1,'Ctrl+Space failed after operator'
   plot.fill('sin(')
   plot.press('Control+Space')
   popup=page.locator('#command-suggestions')
   status=page.locator('#command-suggestions + .input-assist-status')
   if popup.is_visible() and status.is_visible():
    rb=popup.bounding_box();sb=status.bounding_box()
    assert abs(sb['y']-(rb['y']+rb['height']))<14,(rb,sb)
   # On multi-component inputs, completion follows the active component rather than leftmost input.
   y=page.locator('#command-y');y.fill('sin(')
   ps=page.locator('#command-y-suggestions + .input-assist-status')
   if ps.is_visible():
    ib=y.bounding_box();hb=ps.bounding_box();assert hb['x']>=ib['x']-15,(ib,hb)
   # Switching the Objects field must not cover list rows with an unsolicited popup.
   page.locator('#object-input-toggle').click()
   page.locator('#object-input-toggle').click()
   assert page.locator('#unified-algebra-input-suggestions').is_hidden()
   page.locator('#objects [data-slider="alpha"]').click()
   assert page.locator('#properties').is_visible()
   assert not errors,errors
   page.close()
  print('ROUND250_FINAL_EDITOR_CHROMIUM_PASS')
 finally:browser.close()
