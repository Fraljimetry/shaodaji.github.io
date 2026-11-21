"""Verify the same toggle truly alternates </> and magnifier, including hints."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   for width in (960,1280,1600):
    page=browser.new_page(viewport={'width':width,'height':800})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
    button=page.locator('#object-input-toggle')
    algebra=page.locator('#object-algebra-icon')
    find=page.locator('#object-find-icon')
    assert algebra.is_visible() and not find.is_visible()
    assert button.get_attribute('title')=='Switch to Find'
    assert page.locator('#unified-algebra-input').is_visible()
    button.click()
    assert find.is_visible() and not algebra.is_visible()
    assert button.get_attribute('title')=='Switch to Algebra input'
    assert page.locator('#object-search').is_visible()
    button.click()
    assert algebra.is_visible() and not find.is_visible()
    assert button.get_attribute('title')=='Switch to Find'
    page.locator('#unified-algebra-input').fill('A = (rad(180), cbrt(27))')
    page.locator('#unified-algebra-input').press('Enter')
    assert page.locator('#objects [data-id]').count()>0
    assert not errors,errors
    page.close()
   print('ROUND243_GLYPH_AND_ALGEBRA_CHROMIUM_PASS')
  finally:browser.close()

if __name__=='__main__':run()
