"""Chromium e2e: Automatic/Direct selector, swap-side checkbox and new defaults."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  p=b.new_page(viewport={'width':1450,'height':900});p.set_default_timeout(12000)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(inline_html(expose_state=True),wait_until='load')
  box=p.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
  p.locator('[data-tool-choice="node"]').click()
  p.once('dialog',lambda dialog:dialog.accept('A'));p.mouse.click(cx-130,cy)
  p.locator('[data-tool-choice="node"]').click();p.once('dialog',lambda dialog:dialog.accept('B'));p.mouse.click(cx+130,cy)
  def snapshot():return json.loads(p.evaluate('window.__round36Snapshot()'))
  nodes=[o for o in snapshot()['objects'] if o['type']=='node'];assert len(nodes)==2,nodes
  p.locator('[data-tool-choice="morphism"]').click()
  p.mouse.click(cx-130,cy)
  p.once('dialog',lambda dialog:dialog.accept('f'))
  p.mouse.click(cx+130,cy)
  morph=[o for o in snapshot()['objects'] if o['type']=='morphism'];assert len(morph)==1,morph
  m=morph[0];assert m['routing']=='scene-crossings' and m['style']['width']==1 and m['labelDistance']==10,m
  p.locator(f'.objects .object[data-id="{m["id"]}"]').click()
  sel=p.locator('#morphism-routing');assert sel.locator('option').count()==2,sel.inner_text()
  assert sel.input_value()=='scene-crossings'
  assert p.get_by_label('Swap label side').count()==1
  assert p.get_by_label('Avoid collisions').count()==0
  sel.select_option('direct')
  assert [o for o in snapshot()['objects'] if o['type']=='morphism'][0]['labelAvoid']==False
  sel.select_option('scene-crossings')
  assert [o for o in snapshot()['objects'] if o['type']=='morphism'][0]['labelAvoid']==True
  assert not errors,errors
  print('ROUND52_ROUTING_CHROMIUM_PASS two options, default style, label avoidance and swap')
 finally:b.close()
