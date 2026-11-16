"""R198 real Chromium integration: dense geometry, plotting, 3D scene, export."""
import os,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
OUT=Path(os.getenv('MI198_OUTPUT','/mnt/data/mi198_results'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1660,'height':1040},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda dialog:dialog.accept())
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
  snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
  def cmd(t):
   page.locator('#command').fill(t)
   page.locator('#command').press('Enter')
  for i in range(1,25):cmd(f'P{i}=({(i%8)*1.5-5},{(i//8)*2-2})')
  for i in range(1,19):cmd(f'Segment(P{i},P{i+1})')
  for i in range(1,13):cmd(f'Circle(P{i},P{i+1})')
  for i in range(1,10):cmd(f'Angle(P{i},P{i+1},P{i+2})')
  page.wait_for_timeout(250)
  geometry=snap();(OUT/'geometry.json').write_text(json.dumps(geometry,indent=2));assert len(geometry['objects'])>=50,len(geometry['objects'])
  page.locator('#fit').click();page.wait_for_timeout(200)
  page.locator('#drawing').screenshot(path=str(OUT/'geometry.png'))
  with page.expect_download(timeout=20000) as ev:
   page.locator('#export-open').click();page.get_by_role('button',name='SVG',exact=True).click()
  svg=Path(ev.value.path()).read_text();assert '<svg' in svg
  print('GEOMETRY',len(geometry['objects']),'SVG',len(svg),flush=True)
  page.locator('#new').click()
  for source in ['sin(8*x)*cos(3*x)','1/(x-1)','tan(x)','exp(-x*x/5)*sin(20*x)','sqrt(abs(x))','sin(x*x)','atan(30*x)','log(abs(x))']:
   cmd(source)
  page.wait_for_timeout(450)
  two=snap();(OUT/'plot2d.json').write_text(json.dumps(two,indent=2));assert len(two['objects'])>=6,len(two['objects'])
  page.locator('#drawing').screenshot(path=str(OUT/'plot2d.png'))
  print('PLOT2D',len(two['objects']),flush=True)
  page.locator('#new').click()
  page.locator('#scene3d-enable').check()
  for kind,expr in [('surface3d','sin(x*y)/(1+x*x+y*y)'),('surface3d','cos(x)+sin(y)'),('implicit3d','x*x+y*y+z*z=9')]:
   page.locator('#plot-mode').select_option(kind)
   cmd(expr)
  page.wait_for_timeout(750)
  three=snap();assert len(three['scene3d']['plots'])==3,len(three['scene3d']['plots'])
  page.locator('#scene3d-fix-region').check()
  fixed=three['scene3d']['options'].get('fixedBounds')
  page.locator('#plot-mode').select_option('surface3d');cmd('sin(x)+cos(y)')
  page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=60000)
  after=snap();(OUT/'plot3d.json').write_text(json.dumps(after,indent=2));assert len(after['scene3d']['plots'])==4
  assert after['scene3d']['options']['fixRegion'] is True
  assert len([p for p in after['scene3d']['plots'] if not p['hidden']])<=3
  page.locator('#drawing').screenshot(path=str(OUT/'plot3d.png'))
  print('PLOT3D',len(after['scene3d']['plots']),'visible',sum(not p['hidden'] for p in after['scene3d']['plots']),flush=True)
  assert not errors,errors
  print('ROUND198_CHROMIUM_PASS',flush=True)
 finally:browser.close()
