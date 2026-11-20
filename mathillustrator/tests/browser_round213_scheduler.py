"""Round 213: exact dense implicit fixture, cooperative responsiveness and cancellation.
Local Chromium with inline production modules, not a hosted-deployment test.
"""
import base64, hashlib, json, os, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

EXPRESSION='cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1'
EXPECTED={
 (48,-38):'9aa13306787abe31b732a273d6e72a86e70af3cf7cdfc5a48183fbf70efcf1e1',
 (48,32):'2612500490e5e73df57659b172b5329e23e5f68375ee611535da7c6d65507e74',
 (80,-38):'5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1',
 (80,32):'6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b',
}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1280,'height':800})
  errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
  page.set_content(inline_html(),wait_until='load')
  done=lambda:page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  page.locator('#scene3d-enable').check()
  page.locator('#plot-mode').select_option('implicit3d')
  page.locator('#command').fill(EXPRESSION)
  page.locator('#command-form button').click();done()
  samples=[]
  for detail,yaw in EXPECTED:
   page.locator('#scene3d-detail').fill(str(detail))
   page.locator('#scene3d-detail').dispatch_event('change')
   page.locator('#scene3d-yaw').fill(str(yaw))
   page.locator('#scene3d-yaw').dispatch_event('change')
   done()
   href=page.locator('#drawing image[data-3d-raster]').get_attribute('href')
   checksum=hashlib.sha256(base64.b64decode(href.split(',',1)[1])).hexdigest()
   assert checksum==EXPECTED[detail,yaw],(detail,yaw,checksum)
   samples.append([detail,yaw,checksum])
  # Observe real animation-frame progress while the expensive scene renders.
  page.evaluate('''window.__r213={frames:0};(function beat(){window.__r213.frames++;if(window.__r213.frames<1000)requestAnimationFrame(beat)})()''')
  before=page.evaluate('window.__r213.frames')
  page.locator('#scene3d-yaw').fill('-84');page.locator('#scene3d-yaw').dispatch_event('change');done()
  after=page.evaluate('window.__r213.frames')
  assert after>before,('browser frame loop starved',before,after)
  # Changing document mode invalidates the pending MessageChannel continuation.
  page.locator('#scene3d-yaw').fill('95');page.locator('#scene3d-yaw').dispatch_event('change')
  page.locator('#scene3d-enable').uncheck()
  page.wait_for_timeout(80)
  assert page.locator('#drawing image[data-3d-raster]').count()==0
  page.locator('#scene3d-enable').check();done()
  assert page.locator('#drawing image[data-3d-raster]').count()==1
  assert not errors,errors
  print('PASS ROUND213_CHROMIUM',json.dumps({'hashes':len(samples),'animationFramesDuringRender':after-before,'modeCancellation':True,'pageErrors':errors}))
 finally:browser.close()
