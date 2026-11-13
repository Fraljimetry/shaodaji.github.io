"""Subtle point events: clicks must not snap, pointer-up position is authoritative."""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
import os,json

def project(page):return json.loads(download(page,'Save').read_text())
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':800},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(80)
  cmd(page,'A=(0.13,0.26)')
  hit=page.locator('#drawing circle[data-id="o1"]');r=hit.bounding_box()
  x=r['x']+r['width']/2;y=r['y']+r['height']/2
  page.mouse.click(x,y);page.wait_for_timeout(60)
  assert project(page)['objects'][0]['xy']==[.13,.26],'Simple selection unexpectedly snapped an unsnapped point'
  page.mouse.move(x,y);page.mouse.down()
  page.eval_on_selector('#drawing','''(e,coords)=>e.dispatchEvent(new PointerEvent('pointerup',{
    pointerId:1,isPrimary:true,bubbles:true,button:0,clientX:coords.x,clientY:coords.y
  }))''',{'x':x+50,'y':y-55})
  page.mouse.up();page.wait_for_timeout(60)
  after=project(page)['objects'][0]['xy']
  assert after != [.13,.26],f'Endpoint was not used for point drag: {after}'
  page.locator('#undo').click();assert project(page)['objects'][0]['xy']==[.13,.26]
  assert not errors,errors
  print('CHROMIUM_CUT04_POINTER_PASS: click-to-select preserves off-grid precision, pointerup-only final movement, undo')
  browser.close()
if __name__=='__main__':run()
