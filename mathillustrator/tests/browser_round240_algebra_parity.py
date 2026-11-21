"""Round 240: header cleanliness and unified Objects/Algebra compatibility."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':860});errors=[]
   page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def enter(expr):
    page.locator('#unified-algebra-input').fill(expr)
    page.locator('#unified-algebra-input').press('Enter')
   for expression in ('a = Slider(0,10,0.1,2)','A = (a, 0)','B = (0, 0)','s = Segment(A,B)'):
    enter(expression)
   assert len(snap()['objects'])==3
   row=page.locator('#objects [data-slider="a"]')
   assert row.locator('.slider-algebra-glyph circle').count()==1
   row.locator('.algebra-entry-label').click()
   assert page.locator('.properties-head #properties-selected-glyph').count()==0
   assert page.locator('#properties-heading-label').inner_text()=='Properties'
   assert page.locator('#properties .slider-property-value-range').count()==1
   before=snap()
   page.locator('#properties-toggle').click()
   assert page.locator('#properties').is_hidden()
   page.locator('#properties-toggle').click()
   assert page.locator('#properties').is_visible()
   assert before==snap()
   # Find is an input mode only; switching must preserve document and geometry.
   page.locator('#object-input-toggle').click()
   assert page.locator('#object-search').is_visible()
   page.locator('#object-input-toggle').click()
   assert page.locator('#unified-algebra-input').is_visible()
   assert snap()==before
   # Slider retains hollow glyph; points and segments remain ordinary editable Objects.
   page.locator('#objects [data-id]').first.click()
   assert page.locator('#properties .field').count()>0
   assert page.locator('#properties-selected-glyph').count()==0
   assert not errors,errors
   print('ROUND240_ALGEBRA_PARITY_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
