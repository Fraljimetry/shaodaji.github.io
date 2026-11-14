"""Round 51P: Point size input aligns horizontally with Opacity input."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   for width in (1450,980,700):
    page=browser.new_page(viewport={'width':width,'height':900})
    page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
    page.wait_for_timeout(100)
    if page.locator('#right-collapse').get_attribute('aria-expanded')=='false':
     page.locator('#right-collapse').click()
    opacity=page.locator('#default-opacity').bounding_box()
    point=page.locator('#point-size').bounding_box()
    line=page.locator('#default-width').bounding_box()
    assert opacity and point and line,(width,opacity,point,line)
    assert abs(opacity['x']-point['x'])<1,(width,opacity,point)
    assert abs(opacity['width']-point['width'])<1,(width,opacity,point)
    assert point['y']>=opacity['y']+opacity['height']+2,(width,opacity,point)
    assert point['x']+point['width'] < line['x'],(width,point,line)
    page.close()
   print('ROUND51P_CHROMIUM_PASS: Point size input aligned with Opacity at 1450/980/700')
  finally:browser.close()

if __name__=='__main__':main()
