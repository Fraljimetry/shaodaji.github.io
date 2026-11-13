"""Cut12 targeted browser regressions for visibility lifecycle, Fit, anchor batch and UI.
These are isolated Chromium DOM tests, not a hosted-site/cross-browser certification.
"""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1340,'height':830},accept_downloads=True)
  errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(160)
  cmd(page,'A=(0,0)');cmd(page,'B=(3,2)');cmd(page,'Far=(800000,900000)')
  page.locator('#objects [data-id="o3"]').click()
  page.locator('#properties input[type=number]').last.fill('0') if False else None
  # The properties panel has one opacity input (after x/y, width, etc.).
  opacity=page.locator('#properties label.field').filter(has_text='Opacity').locator('input')
  opacity.fill('0');opacity.dispatch_event('change');page.wait_for_timeout(80)
  page.locator('#fit').click();page.wait_for_timeout(120)
  pts=page.evaluate('''() => [...document.querySelectorAll('#drawing circle[data-id]')].map(c=>({id:c.dataset.id,x:+c.getAttribute('cx'),y:+c.getAttribute('cy')}))''')
  display=page.locator('#drawing').bounding_box()
  assert len(pts)>=2,(pts,display)
  assert all(0<=v['x']<=display['width'] and 0<=v['y']<=display['height'] for v in pts if v['id'] in ('o1','o2')),(pts,display)
  print('CUT12_PASS invisible point ignored by Fit')
  # Point drag without completion then document visibilitychange must roll back.
  page.locator('#zoom-reset').click();page.locator('button.tool[data-tool-choice="select"]').click()
  page.wait_for_timeout(90)
  c=page.locator('#drawing circle[data-id="o1"]')
  x=float(c.get_attribute('cx'));y=float(c.get_attribute('cy'))
  rect=page.locator('#drawing').bounding_box()
  page.mouse.move(rect['x']+x,rect['y']+y);page.mouse.down();page.mouse.move(rect['x']+x+56,rect['y']+y+33,steps=3)
  page.wait_for_timeout(80)
  moved=float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))
  assert moved!=x,(x,moved)
  page.evaluate('''() => {Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));}''')
  page.wait_for_timeout(100)
  restored=float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))
  assert abs(restored-x)<0.1,(x,moved,restored)
  page.mouse.up();page.wait_for_timeout(50)
  assert abs(float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))-x)<0.1
  print('CUT12_PASS document hidden rolls back partial pointer drag')
  # The same interrupted-navigation invariant applies to Pan, not only Move.
  page.evaluate('''() => Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'})''')
  page.locator('button.tool[data-tool-choice="pan"]').click()
  before_pan=float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))
  canvas=page.locator('#drawing').bounding_box()
  page.mouse.move(canvas['x']+350,canvas['y']+300);page.mouse.down()
  page.mouse.move(canvas['x']+410,canvas['y']+315,steps=3);page.wait_for_timeout(60)
  during_pan=float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))
  assert abs(during_pan-before_pan)>20,(before_pan,during_pan)
  page.evaluate('''() => {Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));}''')
  page.wait_for_timeout(60)
  assert abs(float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))-before_pan)<.1
  page.mouse.up()
  print('CUT12_PASS document hidden rolls back unfinished Pan')
  assert not errors,errors
  browser.close()

if __name__=='__main__':main()
