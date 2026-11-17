"""Round205 actual headless Chromium dense 3D rendering / orbit / export / stale task checks."""
import base64, hashlib, json, os
from xml.etree import ElementTree as ET
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':800},accept_downloads=True)
   page.set_default_timeout(30000)
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(expose_state=True),wait_until='load')
   done=lambda:page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=90000)
   page.locator('#scene3d-enable').check()
   page.locator('#plot-mode').select_option('surface3d')
   page.locator('#command').fill('sin(x)*cos(y)')
   page.locator('#command-form button').click();done()
   page.locator('#scene3d-detail').fill('90');page.locator('#scene3d-detail').dispatch_event('change');done()
   raster=page.locator('#drawing image[data-3d-raster]')
   assert raster.count()==1,('expected device-scale raster for medium-dense 3D',page.locator('#render-info').inner_text())
   assert page.locator('#drawing polygon').count()==0
   data=raster.get_attribute('href');assert data.startswith('data:image/png;base64,')
   raw=base64.b64decode(data.split(',',1)[1]);assert raw[:8]==b'\x89PNG\r\n\x1a\n' and len(raw)>12000
   before=hashlib.sha256(raw).hexdigest()
   # Rapid repeated camera edits cancel outstanding frame tasks; finish with a
   # settled final orientation and check the screen is not stuck on an old frame.
   for yaw in [-80,-45,-10,30,80,130,-100,65,10,35,90,0]:
    page.locator('#scene3d-yaw').fill(str(yaw));page.locator('#scene3d-yaw').dispatch_event('change')
   done()
   assert raster.count()==1
   after=hashlib.sha256(base64.b64decode(raster.get_attribute('href').split(',',1)[1])).hexdigest()
   assert before!=after, 'camera changes did not repaint'
   assert 'PLOT LIMIT' not in page.locator('#render-info').inner_text()
   # Export remains full-resolution SVG, even when editing display is a raster.
   page.locator('#export-open').click()
   with page.expect_download(timeout=90000) as d:page.locator('#export-options button',has_text='SVG').click()
   output=d.value.path().read_bytes()
   root=ET.fromstring(output)
   faces=root.findall('.//{http://www.w3.org/2000/svg}polygon')
   assert len(faces)==16200,len(faces)
   assert len(json.loads(page.evaluate('window.__round36Snapshot()'))['scene3d']['plots'])==1
   # Switch to 2D and back, ensure no stale raster is injected into the 2D scene.
   page.locator('#scene3d-enable').uncheck()
   assert page.locator('#drawing image[data-3d-raster]').count()==0
   page.locator('#scene3d-enable').check();done();assert raster.count()==1
   assert not errors,errors
   print('PASS ROUND205_CHROMIUM',json.dumps({'rasterBytes':len(raw),'svgFaces':len(faces),'orbitChanges':12,'2d3d':True,'pageErrors':errors}))
  finally:browser.close()
if __name__=='__main__':run()
