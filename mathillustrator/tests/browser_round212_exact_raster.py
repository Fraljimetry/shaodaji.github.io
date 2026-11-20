"""Full-resolution production-equivalent implicit surface, raster identity and orbit latency."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import hashlib,base64,os,time,json
EXPR='cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1280,'height':800})
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(inline_html(),wait_until='load')
  page.locator('#scene3d-enable').check();page.locator('#plot-mode').select_option('implicit3d')
  page.locator('#command').fill(EXPR);page.locator('#command-form button').click()
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  trials=[]
  for detail in [48,80]:
   if detail==80:
    page.locator('#scene3d-yaw').fill('-38')
    page.locator('#scene3d-yaw').dispatch_event('change')
    page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
   t=time.perf_counter()
   page.locator('#scene3d-detail').fill(str(detail));page.locator('#scene3d-detail').dispatch_event('change')
   page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
   for yaw in [-38,32]:
    if yaw!=-38:
     t=time.perf_counter()
     page.locator('#scene3d-yaw').fill(str(yaw));page.locator('#scene3d-yaw').dispatch_event('change')
     page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
    data=page.locator('#drawing image[data-3d-raster]').get_attribute('href')
    raw=base64.b64decode(data.split(',',1)[1]);assert raw.startswith(b'\x89PNG\r\n\x1a\n')
    trials.append(dict(detail=detail,yaw=yaw,ms=round((time.perf_counter()-t)*1000),size=len(raw),sha256=hashlib.sha256(raw).hexdigest(),status=page.locator('#render-info').inner_text()))
  assert not errs,errs
  print(json.dumps(trials,indent=2))
 finally:browser.close()
