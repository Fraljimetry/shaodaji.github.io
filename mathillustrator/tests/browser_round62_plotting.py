"""Round62 plotting boundaries and 2D/3D UI with inline isolated Chromium module harness."""
import json,math,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, ROOT

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1420,'height':920},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   assert page.locator('.startup-error:visible').count()==0
   page.locator('#plot-mode').select_option('function')
   page.locator('#command').fill('x^2');page.locator('#command-form button').click()
   assert snap()['objects'][-1]['type']=='function'
   baseline=len(snap()['objects'])
   page.locator('#command').fill('unknown(x)');page.locator('#command-form button').click()
   assert len(snap()['objects'])==baseline,'Invalid 2D formulas must not mutate documents'
   page.locator('#plot-mode').select_option('domainColoring')
   page.locator('#command').fill('z^2+1');page.locator('#command-form button').click()
   assert snap()['objects'][-1]['type']=='domainColoring'
   assert page.locator('#drawing image').count()>=1
   page.locator('#scene3d-enable').check(force=True)
   assert page.locator('#plot-mode option').count()==5
   page.locator('#plot-mode').select_option('surface3d')
   page.locator('#command').fill('sqrt(x+y+0.2)');page.locator('#command-form button').click()
   assert snap()['scene3d']['plots'][-1]['kind']=='surface3d'
   region=page.locator('#properties .plot-region-editor')
   original=dict(snap()['scene3d']['plots'][-1]['bounds'])
   assert region.get_by_role('button',name='Apply ±').count()==0
   centered=region.get_by_label('Centered half-range')
   assert centered.count()==1
   centered.fill('2pi')
   assert snap()['scene3d']['plots'][-1]['bounds']==original
   centered.press('Enter')
   samples=[float(region.get_by_label(k).input_value()) for k in ['x min','x max','y min','y max','z min','z max']]
   assert all(abs(abs(v)-2*math.pi)<1e-9 for v in samples),samples
   assert abs(snap()['scene3d']['plots'][-1]['bounds']['xMax']-2*math.pi)<1e-9
   page.locator('#undo').click();assert snap()['scene3d']['plots'][-1]['bounds']==original
   page.locator('#redo').click();assert abs(snap()['scene3d']['plots'][-1]['bounds']['zMax']-2*math.pi)<1e-9
   page.locator('#properties .plot-region-editor').get_by_label('x min').fill('alert(1)')
   page.locator('#properties .plot-region-editor').get_by_label('x min').press('Enter')
   assert abs(snap()['scene3d']['plots'][-1]['bounds']['xMin']+2*math.pi)<1e-9
   assert not errors,errors
   # Render existing bilingual guide: the code-command sample must be absent.
   guide=(ROOT/'tutorial.html').read_text()
   assert 'id="plots2d"' in guide and '2D plotting workflows' in guide
   assert '5. 二维绘图' in guide
   assert 'Segment(A, B)' not in guide
   print('ROUND62_PLOTTING_CHROMIUM_PASS: 2D invalid rollback, complex backdrop, 3D finite surface, pi bounds, symmetry, atomic Enter, undo/redo, bilingual guide')
  finally:browser.close()
if __name__=='__main__':run()
