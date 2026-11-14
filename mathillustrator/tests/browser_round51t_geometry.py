"""Focused Chromium UI tests for R51T's geometry cleanup."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1450,'height':920});page.set_default_timeout(12000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(expose_state=True),wait_until='load')
  assert page.locator('#polygon-sides').count()==0
  snapshot=lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
  box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
  def tool(t):page.locator(f'[data-tool-choice="{t}"]').click()
  def click(x,y):page.mouse.click(cx+x,cy+y);page.wait_for_timeout(60)
  tool('polygon');click(60,40);click(150,30);click(160,130)
  assert not [x for x in snapshot()['objects'] if x['type']=='polygon']
  page.keyboard.press('Enter');page.wait_for_timeout(80)
  assert not [x for x in snapshot()['objects'] if x['type']=='polygon'],'Enter must not close polygons'
  click(60,40)
  assert len([x for x in snapshot()['objects'] if x['type']=='polygon'])==1
  tool('regularPolygon')
  page.once('dialog',lambda d:d.accept('7'))
  click(-140,-70);click(-80,-70)
  sides=[x['sides'] for x in snapshot()['objects'] if x['type']=='regularPolygon']
  assert sides==[7],sides
  tool('ellipse');click(-150,100);click(-100,100);click(-110,145)
  ellipses=[x for x in snapshot()['objects'] if x['type']=='ellipse']
  assert ellipses and ellipses[-1]['ellipseFilled'] is False
  assert page.locator(f'#drawing ellipse[data-id="{ellipses[-1]["id"]}"]').count()==1
  assert page.locator(f'#drawing ellipse[data-id="{ellipses[-1]["id"]}"]').get_attribute('fill')=='none'
  assert not errors,errors
  print('ROUND51T_CHROMIUM_PASS closure, prompt, ellipse fill, startup')
 finally:browser.close()
