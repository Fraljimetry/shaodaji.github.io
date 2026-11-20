import sys,os,time,json,statistics,hashlib,base64
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import browser_smoke
from playwright.sync_api import sync_playwright
results=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for path in [str(Path(__file__).resolve().parents[1])]:
  browser_smoke.ROOT=Path(path)
  p=b.new_page(viewport={'width':1280,'height':800});p.set_content(browser_smoke.inline_html(),wait_until='load')
  done=lambda:p.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  p.locator('#scene3d-enable').check();p.locator('#plot-mode').select_option('implicit3d');p.locator('#command').fill('cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1');p.locator('#command-form button').click();done();p.locator('#scene3d-detail').fill('80');p.locator('#scene3d-detail').dispatch_event('change');done()
  samples=[]
  for yaw in [32,-38]*4:
   t=time.perf_counter();p.locator('#scene3d-yaw').fill(str(yaw));p.locator('#scene3d-yaw').dispatch_event('change');done();ms=(time.perf_counter()-t)*1000
   href=p.locator('#drawing image[data-3d-raster]').get_attribute('href');sha=hashlib.sha256(base64.b64decode(href.split(',',1)[1])).hexdigest();samples.append({'yaw':yaw,'ms':round(ms,2),'sha':sha})
  results.append({'path':path,'median_ms':statistics.median([s['ms'] for s in samples]),'samples':samples});p.close()
 b.close()
assert all(set(s['sha'] for s in r['samples']) == {'5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1','6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b'} for r in results)
print('PASS ROUND216_CAMERA',json.dumps(results,indent=2))
