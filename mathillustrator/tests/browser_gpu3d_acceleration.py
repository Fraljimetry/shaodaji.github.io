"""Historical gate entry: CPU/SVG 3D lifecycle and export fidelity.

The current renderer intentionally has no WebGL backend. Do not pretend
that a mocked GPU API proves acceleration or fallback behavior.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'))
  try:
   page=browser.new_page(viewport={'width':1300,'height':850},accept_downloads=True)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   page.locator('#scene3d-enable').check()
   page.locator('#plot-mode').select_option('surface3d')
   page.locator('#command').fill('sin(x)*cos(y)')
   page.locator('#command-form button').click()
   page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')")
   assert page.locator('#drawing polygon').count()>400
   assert page.locator('[data-3d-gpu]').count()==0
   page.locator('#scene3d-detail').fill('80')
   page.locator('#scene3d-detail').dispatch_event('change')
   page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=30000)
   count=page.locator('#drawing polygon').count()
   raster=page.locator('#drawing image[data-3d-raster]').count()
   assert count>6000 or raster==1,('unexpectedly incomplete dense mesh',count,raster)
   assert page.locator('[data-3d-gpu]').count()==0
   page.locator('#export-open').click()
   with page.expect_download() as event:
    page.locator('#export-options button').filter(has_text='SVG').click()
   svg=event.value.path().read_text()
   assert svg.count('<polygon')>=12800, 'Full-resolution SVG export must not inherit viewport rasterization'
   assert 'foreignObject' not in svg
   page.locator('#scene3d-enable').uncheck()
   assert page.locator('[data-3d-gpu]').count()==0
   assert not errors,errors
   print(json.dumps({'passed':True,'renderer':'CPU/SVG','denseInteractivePolygons':count,'denseRasterImages':raster,'exportedPolygons':svg.count('<polygon'),'actualGpuPixelVerification':False,'errors':errors}))
  finally:browser.close()
if __name__=='__main__':run()
