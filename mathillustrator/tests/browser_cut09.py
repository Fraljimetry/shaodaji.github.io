"""Cut 09: publication precision, stale raster completion, blur rollback and crop pixels.
Runs against the isolated Chromium DOM, not a deployed URL.
"""
import os, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download
from browser_cut07_properties import state


def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  p=browser.new_page(viewport={'width':1420,'height':900},accept_downloads=True)
  errors=[];downloads=[]
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('download',lambda d:downloads.append(d.suggested_filename))
  p.on('dialog',lambda d:d.accept())
  p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(120)
  cmd(p,'A=(0,0)');cmd(p,'B=(0.000001,0)');cmd(p,'Segment(A,B)')
  p.locator('#export-open').click()
  assert p.get_by_role('button',name='TikZ / PGF').is_disabled(),'microscopic edge rounds to zero in exported TikZ'
  assert not p.get_by_role('button',name='SVG',exact=True).is_disabled()
  p.locator('#export-close').click()
  cmd(p,'C=(400,0)')
  p.locator('#export-open').click()
  assert p.get_by_role('button',name='TikZ / PGF').is_disabled(),'large TeX dimension not gated'
  p.locator('#export-close').click()
  print('CUT09_BROWSER_PASS TikZ precision and dimension export gating')
  # Start a slow real PNG encoding and then change the project before the encoder
  # calls back. A completed old render must never be downloaded as current art.
  p.evaluate('''() => {
   window.__lateEncode=0;
   const old=HTMLCanvasElement.prototype.toBlob;
   HTMLCanvasElement.prototype.toBlob=function(cb,...args){window.__lateEncode++;setTimeout(()=>old.call(this,cb,...args),850);};
  }''')
  p.locator('#export-open').click()
  p.get_by_role('button',name='PNG',exact=True).click()
  p.wait_for_function('window.__lateEncode>0',timeout=7000)
  assert p.locator('#export-options button:not([disabled])').count()==0,'double exports should be disabled while encoding'
  p.locator('#export-close').click()
  cmd(p,'D=(2,2)')
  p.wait_for_timeout(1250)
  assert 'mathillustrator.png' not in downloads,'stale image was downloaded after document changed'
  assert 'canceled' in p.locator('#toast').inner_text().lower(),'cancellation should be visible'
  assert len(state(p)['objects'])==5
  print('CUT09_BROWSER_PASS delayed encoder canceled on intervening project edit')
  # Page blur is an interrupted gesture, not a successful drag transaction.
  d=next(o for o in state(p)['objects'] if o['name']=='D')
  p.locator('#zoom-reset').click()
  p.locator('#drawing').wait_for()
  point=p.locator(f'circle[data-id="{d["id"]}"]')
  box=point.bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
  p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+76,y+40,steps=3)
  assert next(o for o in state(p)['objects'] if o['name']=='D')['xy']!=[2,2], 'drag did not start'
  p.evaluate("window.dispatchEvent(new Event('blur'))")
  assert next(o for o in state(p)['objects'] if o['name']=='D')['xy']==[2,2]
  p.mouse.up()
  assert next(o for o in state(p)['objects'] if o['name']=='D')['xy']==[2,2]
  print('CUT09_BROWSER_PASS interrupted gesture rollback on window blur')
  assert not errors, errors
  browser.close()

if __name__=='__main__':run()
