"""Round 238: Enter-only Algebra; slider glyph belongs in the Objects list, not Properties heading."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':850});errors=[]
   page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   form=page.locator('#unified-algebra-form')
   assert form.locator('button').count()==0
   for source in ['a = Slider(0,10,0.1,2)','A = (clamp(a,0,3), mod(8,3))',
                  'B = (4,0)','p = RegularPolygon(A,B,2^3)',
                  'N = Node(deg(pi)/90, cbrt(27), "X")']:
    page.locator('#unified-algebra-input').fill(source)
    page.locator('#unified-algebra-input').press('Enter')
    assert page.locator('#unified-algebra-input').input_value()=='',source
   assert page.locator('#objects [data-slider="a"]').count()==1
   page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
   assert page.locator('#properties-selected-glyph').count()==0
   glyph=page.locator('#objects [data-slider="a"] .slider-algebra-glyph')
   assert glyph.is_visible() and glyph.locator('circle').count()==1
   assert glyph.locator('circle').get_attribute('fill') == 'none'  # R245 approved hollow handle
   page.locator('#object-input-toggle').click()
   assert page.locator('#object-search').is_visible()
   page.locator('#object-input-toggle').click()
   assert page.locator('#unified-algebra-input').is_visible()
   assert not errors,errors
   print('ROUND238_UNIFIED_ALGEBRA_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
