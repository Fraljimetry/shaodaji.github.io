"""Round 242: Find and Algebra use equal sized controls and preserve shared behavior."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   for width in (960,1280,1600):
    page=browser.new_page(viewport={'width':width,'height':860});errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
    assert page.locator('#unified-algebra-input').is_visible()
    def geometry(selector):
     return page.locator(selector).evaluate('''e=>{let r=e.getBoundingClientRect(),s=getComputedStyle(e);return {width:r.width,height:r.height,pad:s.padding,font:s.fontSize,line:s.lineHeight,border:s.borderWidth}}''')
    algebra=geometry('#unified-algebra-input')
    page.locator('#unified-algebra-input').fill('a = Slider(0, 10, 0.1, 2)')
    page.locator('#object-input-toggle').click()
    find=geometry('#object-search')
    for k in ('height','width'):
     assert abs(algebra[k]-find[k])<0.6,(width,k,algebra,find)
    for k in ('pad','font','line','border'):
     assert algebra[k]==find[k],(width,k,algebra,find)
    assert page.locator('#object-input-toggle').get_attribute('title')=='Switch to Algebra input'
    page.locator('#object-search').fill('nonexistent')
    page.locator('#object-input-toggle').click()
    assert page.locator('#unified-algebra-input').input_value()=='a = Slider(0, 10, 0.1, 2)'
    page.locator('#unified-algebra-input').press('Enter')
    assert page.locator('#objects [data-slider="a"]').count()==1
    page.locator('#object-input-toggle').click()
    assert page.locator('#object-search').input_value()=='nonexistent'
    assert page.locator('#objects [data-slider="a"]').count()==0
    page.locator('#object-search').fill('a')
    assert page.locator('#objects [data-slider="a"]').count()==1
    page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
    assert page.locator('#properties .slider-property-value-range').count()==1
    assert not errors,errors
    page.close()
   print('ROUND242_INPUT_PARITY_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
