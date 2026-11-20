"""Compare the final cooperative painter merge against Round 221 in real Chromium."""
import argparse, base64, hashlib, json, statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
import browser_smoke

ROOT = Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--baseline',type=Path,help='Optional Round 221 source root for interleaved A/B benchmarking')
args=parser.parse_args()
BASE=args.baseline.resolve() if args.baseline else None
EXPECTED={32:'6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b',-38:'5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1'}

def measure(browser, root, label):
 browser_smoke.ROOT=root
 p=browser.new_page(viewport={'width':1280,'height':800})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.set_content(browser_smoke.inline_html(),wait_until='load')
  done=lambda:p.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=120000)
  p.locator('#scene3d-enable').check();p.locator('#plot-mode').select_option('implicit3d')
  p.locator('#command').fill('cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1')
  p.locator('#command-form button').click();done()
  p.locator('#scene3d-detail').fill('80');p.locator('#scene3d-detail').dispatch_event('change');done()
  data=[]
  for yaw in [32,-38,32,-38]:
   p.evaluate('''() => {window.__heartbeat={samples:[],last:performance.now(),start:performance.now()};window.__heartbeat.timer=setInterval(()=>{const n=performance.now();window.__heartbeat.samples.push(n-window.__heartbeat.last);window.__heartbeat.last=n},8);}''')
   p.locator('#scene3d-yaw').fill(str(yaw));p.locator('#scene3d-yaw').dispatch_event('change');done()
   timing=p.evaluate('''() => {clearInterval(window.__heartbeat.timer);const h=window.__heartbeat;return {elapsed:performance.now()-h.start,maxGap:Math.max(0,...h.samples),gapsOver50:h.samples.filter(v=>v>50).length}}''')
   href=p.locator('#drawing image[data-3d-raster]').get_attribute('href')
   sha=hashlib.sha256(base64.b64decode(href.split(',',1)[1])).hexdigest()
   assert sha==EXPECTED[yaw],(label,yaw,sha)
   data.append({'yaw':yaw,**timing})
  assert not errors,errors
  return data
 finally:p.close()

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  results={'baseline':[],'candidate':[]}
  for label,path in ([('baseline',BASE),('candidate',ROOT),('candidate',ROOT),('baseline',BASE)] if BASE else [('candidate',ROOT)]):
   runs=measure(browser,path,label);results[label].extend(runs)
   print(label,'median elapsed',round(statistics.median(x['elapsed'] for x in runs),1),'max gap',round(max(x['maxGap'] for x in runs),1),flush=True)
  summary={label:{'medianElapsed':round(statistics.median(x['elapsed'] for x in runs),1),'medianMaxGap':round(statistics.median(x['maxGap'] for x in runs),1),'worstGap':round(max(x['maxGap'] for x in runs),1),'gapsOver50':sum(x['gapsOver50'] for x in runs)} for label,runs in results.items() if runs}
  print('ROUND222_COMPARISON_PASS',json.dumps(summary,indent=2))
 finally:browser.close()
