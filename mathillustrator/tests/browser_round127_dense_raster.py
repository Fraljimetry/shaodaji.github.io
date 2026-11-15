"""Actual Chromium dense-mesh regression using the production app module."""
import os,time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
EXPR='4*(((3+sqrt(5))/2)^2*x^2-y^2)*(((3+sqrt(5))/2)^2*y^2-z^2)*(((3+sqrt(5))/2)^2*z^2-x^2)-(1+2*((3+sqrt(5))/2))*(x^2+y^2+z^2-1)^2=0'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1400,'height':900})
  errors=[]
  page.on('pageerror',lambda exc:errors.append(str(exc)))
  page.on('dialog',lambda dialog:dialog.accept())
  page.set_content(inline_html(expose_state=True),wait_until='load')
  page.locator('#scene3d-enable').check()
  page.locator('#plot-mode').select_option('implicit3d')
  page.locator('#command').fill(EXPR)
  page.locator('#command-form button').click()
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  page.locator('#scene3d-detail').fill('96')
  t=time.perf_counter()
  page.locator('#scene3d-detail').dispatch_event('change')
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  elapsed=time.perf_counter()-t
  info=page.locator('#render-info').inner_text()
  count=page.locator('#drawing polygon').count()
  raster=page.locator('#drawing image[data-3d-raster]').count()
  assert raster==1,(raster,info,errors)
  assert count==0,count
  assert 'PLOT LIMIT' not in info, info
  assert not errors, errors
  data=page.locator('#drawing image[data-3d-raster]').get_attribute('href')
  assert data.startswith('data:image/png;base64,') and len(data)>10000,len(data)
  # Orbit must reuse the complete implicit world mesh, not resample it.
  page.locator('#scene3d-yaw').fill('20')
  page.locator('#scene3d-yaw').dispatch_event('change')
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  assert page.locator('#drawing image[data-3d-raster]').count()==1
  assert not errors,errors
  print('PASS ROUND127_CHROMIUM dense raster, preserved orbit, PNG pixels',round(elapsed*1000),'ms',info)
 finally:browser.close()
