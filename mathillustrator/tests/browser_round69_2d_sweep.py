"""Round69 Chromium: 2D implicit poles, transformed-line invisible hit overlays, editing and SVG."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1460,'height':940},accept_downloads=True)
  page.set_default_timeout(4500)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
  page.wait_for_timeout(180)
  snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
  def cmd(s):
   page.locator('#command').fill(s);page.locator('#command-form button').click();page.wait_for_timeout(90)
  page.locator('#plot-mode').select_option('implicit')
  cmd('1/x')
  curve=snapshot()['objects'][-1]
  assert curve['type']=='implicit'
  assert page.locator(f'#drawing path[data-id="{curve["id"]}"]').first.get_attribute('d')=='','Pole should not produce false contour'
  cmd('x=0')
  straight=snapshot()['objects'][-1]
  assert page.locator(f'#drawing path[data-id="{straight["id"]}"]').first.get_attribute('d'),'Genuine implicit zero line lost'
  cmd('x^2+y^2=1')
  disk=snapshot()['objects'][-1]
  assert page.locator(f'#drawing path[data-id="{disk["id"]}"]').first.get_attribute('d'),'Genuine circle lost'
  page.locator('#plot-mode').select_option('function')
  cmd('A=(0,0)');cmd('B=(2,0)');cmd('Line(A,B)')
  source=next(o for o in snapshot()['objects'] if o['type']=='line')
  page.locator('[data-tool-choice="rotation"]').click()
  page.wait_for_timeout(300)
  box=page.locator(f'#drawing [data-id="{source["id"]}"]').first.bounding_box()
  assert box,source
  page.mouse.click(box['x']+box['width']*.65,box['y']+box['height']/2)
  page.once('dialog',lambda d:d.accept('90'))
  point=next(o for o in snapshot()['objects'] if o['type']=='point' and o['name']=='A')
  page.locator(f'#drawing [data-id="{point["id"]}"]').first.click(force=True)
  page.wait_for_timeout(130)
  derived=next(o for o in snapshot()['objects'] if o['type']=='transformCopy' and o['refs'][0]==source['id'])
  page.locator('[data-tool-choice="select"]').click()
  page.locator(f'#objects .object[data-id="{derived["id"]}"]').click()
  page.wait_for_timeout(85)
  prop=page.locator('#properties .field').filter(has_text='Opacity').locator('input')
  assert prop.count()>0
  prop.fill('0');prop.dispatch_event('change');page.wait_for_timeout(150)
  assert next(o for o in snapshot()['objects'] if o['id']==derived['id'])['style']['opacity']==0
  hits=page.locator(f'#drawing [data-id="{derived["id"]}"]')
  assert hits.count()==0, f'Invisible transformed line still has {hits.count()} editor hit objects'
  # Returning from zero to an opaque line reinstates exactly one picking overlay.
  prop=page.locator('#properties .field').filter(has_text='Opacity').locator('input')
  prop.fill('1');prop.dispatch_event('change');page.wait_for_timeout(130)
  assert page.locator(f'#drawing [data-id="{derived["id"]}"]').count()==2
  page.locator('#export-open').click()
  with page.expect_download(timeout=10000) as event:
   page.get_by_role('button',name='SVG',exact=True).click()
  import tempfile
  from pathlib import Path
  output=Path(tempfile.mkdtemp())/'round69.svg';event.value.save_as(output)
  svg=output.read_text()
  assert svg.count(f'data-id="{derived["id"]}"')==1,'Editor-only transparent overlay leaked into SVG export'
  assert not errors,errors
  print('ROUND69_CHROMIUM_PASS: implicit pole vs genuine contours, affine-line opacity and hit-target restoration, no JS errors')
 finally:browser.close()
