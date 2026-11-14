"""Actual Chromium acceptance of temp3.docx omissions + camera/3D error paths.
Offline embedded JS modules, no live origin or GPU-level occlusion claim.
"""
import json,os,math,time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=b.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(35000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   scene=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))['scene3d']
   def finished():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=45000)
   def rect(css):return page.locator(css).bounding_box()
   def drag(css,dy):
    r=rect(css);x=r['x']+r['width']/2;y=r['y']+r['height']/2
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x,y+dy,steps=7);page.mouse.up()
   def add(mode,a,b=None,c=None):
    page.locator('#plot-mode').select_option(mode);page.locator('#command').fill(a)
    if b is not None:page.locator('#command-y').fill(b)
    if c is not None:page.locator('#command-z').fill(c)
    page.locator('#command-form button').click();finished()
   interface=page.locator('.interface-check-grid')
   assert interface.locator('input[type=checkbox]').count()==5
   assert page.evaluate("() => getComputedStyle(document.querySelector('.interface-check-grid')).gridTemplateColumns.split(' ').length")==2
   assert rect('.interface-check-grid')['y']>rect('#ui-font')['y']
   page.locator('#scene3d-enable').check();finished()
   assert page.locator('#auto-pan').is_hidden()
   assert page.locator('#scene3d-grid').is_visible() and page.locator('#scene3d-axes').is_visible()
   assert page.locator('.settings-2d-only:visible').count()==0
   add('domain3d','z^2+1')
   # Actual pointer action regression: old build collapsed 230px -> 38px.
   p0=rect('#properties-dock')['height'];drag('#properties-splitter',-120)
   assert rect('#properties-dock')['height']>=p0+105,(p0,rect('#properties-dock'))
   before=rect('#properties-dock')['height'];drag('#properties-splitter',70)
   assert rect('#properties-dock')['height']<before-55
   divider=page.locator('#properties-splitter');divider.focus();before=rect('#properties-dock')['height'];divider.press('ArrowUp')
   assert rect('#properties-dock')['height']>=before+7
   # Six region fields must be 3 x 2 underneath a full-width heading.
   region=page.locator('#properties .plot-region-editor');assert region.locator('input').count()==6
   boxes=[r.bounding_box() for r in region.locator('label.field').all()]
   assert abs(boxes[0]['y']-boxes[1]['y'])<3 and abs(boxes[2]['y']-boxes[3]['y'])<3 and abs(boxes[4]['y']-boxes[5]['y'])<3,boxes
   assert boxes[0]['y']>rect('#properties .plot-region-editor h4')['y']+10
   # Strict pi and e expressions; only successful Redraw replaces persisted numbers.
   region.locator('input').nth(0).fill('-pi');region.locator('input').nth(1).fill('pi');region.locator('input').nth(2).fill('-e');region.locator('input').nth(3).fill('e');region.locator('button').click();finished()
   assert math.isclose(scene()['plots'][0]['bounds']['xMin'],-math.pi)
   assert math.isclose(scene()['plots'][0]['bounds']['yMax'],math.e)
   region=page.locator('#properties .plot-region-editor');region.locator('input').nth(1).fill('alert(1)');region.locator('button').click()
   assert math.isclose(scene()['plots'][0]['bounds']['xMax'],math.pi),'bad expression must rollback atomically'
   # Domain phases still take priority; selecting new Single color enables the
   # 10-swatch palette without overriding the legacy phase default silently.
   assert page.locator('#properties .plot-color-slot .color-swatch').count()==10
   assert page.locator('#properties .plot-color-slot input[type=color]').is_disabled()
   page.locator('#properties select').filter(has=page.locator('option[value="solid"]')).select_option('solid');finished()
   color=page.locator('#properties .plot-color-slot .color-swatch[data-color="#ef4444"]');color.click();finished()
   assert scene()['plots'][0]['color']=='#ef4444'
   # World-fixed lighting: compare all polygons' color histograms at different yaw.
   page.locator('#scene3d-projection').select_option('orthographic');finished()
   sampled=lambda: sorted(page.locator('#drawing polygon').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("fill"))'))
   before=sampled();assert len(before)>200
   page.locator('#scene3d-yaw').fill('140');page.locator('#scene3d-yaw').dispatch_event('change');finished()
   assert before==sampled(),'world-anchored light/color must not change with camera orbit'
   page.locator('#scene3d-grid').check();page.locator('#scene3d-axes').check();finished()
   assert len(page.locator('#drawing line').all())>=18
   assert scene()['options']['grid'] and scene()['options']['axes']
   # Locked plots have familiar eye/lock/delete icons, with delete disabled.
   row=page.locator('#objects-3d .object').first
   assert row.locator('.plot3d-action svg').count()==3
   row.get_by_role('button',name='Lock',exact=True).click()
   assert scene()['plots'][0]['locked'] is True
   assert page.locator('#objects-3d .object').first.get_by_role('button',name='Delete').is_disabled()
   assert page.locator('#properties').get_by_text('Locked').count()==1
   page.locator('#objects-3d .object').first.get_by_role('button',name='Unlock').click()
   assert scene()['plots'][0]['locked'] is False
   # Right/left canvas orbits retain expected yaw-direction; finish persists to JSON.
   old=scene()['options']['yaw'];canvas=rect('#drawing');cx=canvas['x']+canvas['width']*.50;cy=canvas['y']+canvas['height']*.52
   page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx-75,cy,steps=7);page.mouse.up();finished()
   assert scene()['options']['yaw']>old
   # Multi-surface visibility/preservation, singular 3D geometry and exports.
   add('surface3d','sin(x)*cos(y)');add('parametric3d','cos(u)*sin(v)','sin(u)*sin(v)','cos(v)')
   assert sum(not q['hidden'] for q in scene()['plots'])==3
   add('implicit3d','x^2+y^2+z^2=1')
   assert sum(not q['hidden'] for q in scene()['plots'])==3 and len(scene()['plots'])==4
   assert page.locator('#drawing polygon').count()>100
   with page.expect_download() as dl:page.locator('#save').click()
   persisted=json.loads(dl.value.path().read_text());assert persisted['scene3d']['options']['grid'] and 'locked' in persisted['scene3d']['plots'][0]
   with page.expect_download(timeout=45000) as dl:
    page.locator('#export-open').click();page.locator('#export-options button').filter(has_text='SVG').click()
   svg=dl.value.path().read_text();assert '<polygon' in svg and '#97a2af' in svg
   page.locator('#scene3d-enable').uncheck()
   assert page.locator('.settings-2d-only').first.is_visible() and page.locator('#auto-pan').is_visible()
   page.locator('#scene3d-enable').check();finished()
   assert len(scene()['plots'])==4
   assert not errors,errors
   print('PASS ROUND43_CHROMIUM temp3: 2x2 Interface, real Properties drag+keyboard, π/e+rollback, color palette, stable light, guides, icon/lock, orbit, mixed surfaces, JSON/SVG, mode isolation')
  finally:b.close()

if __name__=='__main__':run()
