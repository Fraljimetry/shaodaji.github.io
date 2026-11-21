"""Round 279: retained Properties controls track committed model, derived measurements and plot formulas."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import json

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   page=browser.new_page(viewport={'width':1200,'height':840})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load')
   page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
   def enter(text):
    editor=page.locator('#unified-algebra-input');editor.fill(text);editor.press('Enter')
   enter('a = Slider(1, 12, 0.01, 2, 0.5, periodic)')
   enter('P = Point(a, 0)')
   enter('Q = Point(0, 0)')
   enter('S = Segment(P, Q)')
   row=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='S'))
   row.click()
   measured=page.locator('#properties .measurement-value')
   assert measured.count()==1,(theme,'measurement missing')
   assert float(measured.input_value())==2,(theme,measured.input_value())
   # Keep a Properties control focused so the tree is deliberately not rebuilt.
   name=page.get_by_label('Name',exact=True);name.focus()
   page.locator('#objects [data-slider="a"] .slider-play-toggle').click()
   name.focus()
   initial=float(measured.input_value())
   page.wait_for_timeout(250)
   after=float(measured.input_value())
   snap=json.loads(page.evaluate('window.__round36Snapshot()'))
   value=next(sl['value'] for sl in snap['algebra']['sliders'] if sl['name']=='a')
   assert abs(after-value)<1e-5,(theme,'stale measurement',initial,after,value)
   assert abs(after-initial)>0.01,(theme,'measurement did not follow animated endpoint')
   page.locator('#objects [data-slider="a"] .slider-play-toggle').click()
   enter('f(x) = sin(x)')
   plot=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='f'))
   plot.click()
   ex=page.get_by_label('Expression',exact=True)
   assert ex.count()==1,(theme,'plot semantic expression absent')
   ex.fill('cos(x)');ex.press('Enter')
   fx=page.get_by_label('f(x)',exact=True)
   assert fx.input_value()=='cos(x)',(theme,'plot formula stale',fx.input_value())
   assert not errors,(theme,errors)
   page.close()
  print('ROUND279_FIELD_SYNC_CHROMIUM_PASS')
 finally:browser.close()
