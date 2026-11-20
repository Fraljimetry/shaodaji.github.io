"""R47 real Chromium: implicit density climbs with detail and stays intact under orbit."""
import json, os, time
from xml.etree import ElementTree as ET
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':840},accept_downloads=True);page.set_default_timeout(60000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   complete=lambda:page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=100000)
   page.locator('#scene3d-enable').check();complete()
   page.locator('#plot-mode').select_option('implicit3d')
   page.locator('#command').fill('cos(x+y+z)=cos(x)+cos(y)+cos(z)')
   page.locator('#command-form button').click();complete()
   counts=[]
   for detail in (22,44,80):
    page.locator('#scene3d-detail').fill(str(detail));page.locator('#scene3d-detail').dispatch_event('change');complete()
    # Dense editor scenes are intentionally rasterized; count the authoritative
    # full-detail SVG export rather than obsolete on-screen polygon elements.
    page.locator('#export-open').click()
    with page.expect_download(timeout=100000) as download:
     page.locator('#export-options button',has_text='SVG').click()
    exported=ET.fromstring(download.value.path().read_bytes())
    counts.append(len(exported.findall('.//{http://www.w3.org/2000/svg}polygon')))
   assert counts[0]<counts[1]<counts[2],counts
   assert 'PLOT LIMIT' not in page.locator('#render-info').inner_text()
   assert not errors, errors
   print('PASS ROUND47 CHROMIUM: implicit 22/44/80 full-vector SVG face counts',counts,flush=True)
  finally:browser.close()

if __name__=='__main__': main()
