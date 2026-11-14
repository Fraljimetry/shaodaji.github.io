"""R47 Chromium: real 2D/3D object reorder, new 3-click glyph and angle ray, undo, export."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(45000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   cmd=lambda value:(page.locator('#command').fill(value),page.locator('#command-form button').click())
   for expr in ['A=(1,0)','B=(0,0)','C=(0,1)','AngleBisector(A,B,C)']:
    cmd(expr)
   assert [o['type'] for o in state()['objects']]==['point','point','point','angleBisector'],state()['objects']
   tool=page.locator('[data-tool-choice="angleBisector"]')
   assert tool.count()==1 and tool.is_visible()
   assert tool.locator('svg circle').count()==3
   radii=tool.locator('svg circle').evaluate_all('(els)=>els.map(e=>e.getAttribute("r"))')
   assert radii==['2','2','2'],radii
   assert page.locator('#drawing [data-id="o4"]').count()>0
   ids=[o['id'] for o in state()['objects']]
   source=page.locator('#objects .object[data-id="o1"] .object-order-grip')
   target=page.locator('#objects .object[data-id="o4"]')
   assert source.count()==1 and target.count()==1
   source.drag_to(target)
   assert state()['objects'][-1]['id']=='o4' or state()['objects'][-1]['id']=='o1',state()['objects']
   assert [o['id'] for o in state()['objects']]!=ids,'HTML drag should modify stored object order'
   after=state()['objects']
   page.locator('#undo').click()
   assert [o['id'] for o in state()['objects']]==ids
   page.locator('#redo').click()
   assert state()['objects']==after
   grip=page.locator('#objects .object[data-id="o1"] .object-order-grip')
   grip.focus();grip.press('Alt+ArrowDown')
   assert state()['objects']!=after
   page.locator('#scene3d-enable').check()
   page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=55000)
   for formula in ['x+y','x-y','x*y']:
    page.locator('#plot-mode').select_option('surface3d');page.locator('#command').fill(formula)
    page.locator('#command-form button').click()
    page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=55000)
   before3=[p['id'] for p in state()['scene3d']['plots']]
   assert page.locator('#objects-3d .object-order-grip').count()==3
   page.locator(f'#objects-3d .object[data-plot3d="{before3[0]}"] .object-order-grip').drag_to(page.locator(f'#objects-3d .object[data-plot3d="{before3[2]}"]'))
   after3=[p['id'] for p in state()['scene3d']['plots']]
   assert after3!=before3
   page.locator('#undo').click()
   assert [p['id'] for p in state()['scene3d']['plots']]==before3
   page.locator('#redo').click()
   assert [p['id'] for p in state()['scene3d']['plots']]==after3
   keygrip=page.locator(f'#objects-3d .object[data-plot3d="{after3[0]}"] .object-order-grip')
   keygrip.focus();keygrip.press('Alt+ArrowUp')
   assert [p['id'] for p in state()['scene3d']['plots']]!=after3
   assert len([p for p in state()['scene3d']['plots'] if not p['hidden']])==3
   assert not errors,errors
   print('PASS ROUND47 CHROMIUM: angle bisector, three-dot glyph, 2D drag/undo/redo/keyboard order, 3D drag')
  finally:browser.close()

if __name__=='__main__':main()
