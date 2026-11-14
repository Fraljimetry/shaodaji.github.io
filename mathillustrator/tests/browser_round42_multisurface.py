"""Round 42 Chromium acceptance: mixed 3D surfaces, fair visibility, detail, UI geometry, persistence/export."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(25000)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def finished():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=45000)
   def add(mode,a,b=None,c=None):
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(a)
    if b is not None:page.locator('#command-y').fill(b)
    if c is not None:page.locator('#command-z').fill(c)
    page.locator('#command-form button').click()
    finished()
   page.locator('#scene3d-enable').check()
   assert page.locator('#settings-3d').is_visible()
   assert all(node.is_hidden() for node in page.locator('.settings-2d-only').all())
   assert page.locator('#scene3d-detail').get_attribute('max')=='96'
   assert not page.locator('body').get_by_text('Drag the canvas to orbit. Scroll to zoom.').count()
   assert page.locator('#scene3d-background').is_visible()
   add('surface3d','sin(x)*cos(y)')
   add('parametric3d','cos(u)*sin(v)','sin(u)*sin(v)','cos(v)')
   add('domain3d','z^2+1')
   assert len(snap()['scene3d']['plots'])==3 and sum(not o['hidden'] for o in snap()['scene3d']['plots'])==3
   # User screenshot: opacity numeric field must reach same right edge as select above.
   dim=page.evaluate('''() => {
    const fields=[...document.querySelectorAll('#properties > label.field')];
    const b=s=>{const r=s.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
    const scheme=fields.find(f=>f.textContent.includes('Color scheme')).querySelector('select');
    const opacity=fields.find(f=>f.textContent.includes('Object opacity')).querySelector('input');
    return {a:b(scheme),o:b(opacity)};
   }''')
   assert abs(dim['a']['right']-dim['o']['right'])<2,dim
   assert abs(dim['a']['width']-dim['o']['width'])<2,dim
   # The visual multi-surface test is modest enough for actual Chromium.
   page.locator('#scene3d-detail').fill('56');page.locator('#scene3d-detail').dispatch_event('change')
   finished()
   assert 'PLOT LIMIT' not in page.locator('#render-info').inner_text()
   assert page.locator('#drawing polygon').count()>2500
   stats=page.evaluate('''() => {
    const polygons=[...document.querySelectorAll('#drawing polygon')];let max=0;
    for(const polygon of polygons)for(const token of (polygon.getAttribute('points')||'').split(/[ ,]+/)){
     const n=Number(token);if(!Number.isFinite(n))return {bad:true};max=Math.max(max,Math.abs(n));
    }
    return {count:polygons.length,max,colors:new Set(polygons.map(p=>p.getAttribute('fill'))).size};
   }''')
   assert not stats.get('bad') and stats['max']<4500 and stats['colors']>30,stats
   page.screenshot(path='/mnt/data/r42work/mixed_3d.png')
   # 4th surface hides oldest; it is NOT deleted. Recover the old one explicitly.
   add('implicit3d','x^2+y^2+z^2=3')
   current=snap()['scene3d'];assert len(current['plots'])==4
   assert sum(not p['hidden'] for p in current['plots'])==3
   assert current['plots'][0]['hidden'] and not current['plots'][-1]['hidden']
   rows=page.locator('#objects-3d .object')
   assert rows.count()==4
   # Rows are newest first; the old surface is the bottom row.
   rows.last.locator('button').filter(has_text='Show').click()
   finished()
   current=snap()['scene3d']
   assert sum(not p['hidden'] for p in current['plots'])==3 and not current['plots'][0]['hidden']
   assert 'PLOT LIMIT' not in page.locator('#render-info').inner_text()
   with page.expect_download(timeout=25000) as download:page.locator('#save').click()
   saved=json.loads(download.value.path().read_text())
   assert len(saved['scene3d']['plots'])==4
   with page.expect_download(timeout=45000) as exported:
    page.locator('#export-open').click()
    page.locator('#export-options button').filter(has_text='SVG').click()
   assert exported.value.path().read_text().count('<polygon')>2500
   page.locator('#scene3d-enable').uncheck()
   assert all(node.is_visible() for node in page.locator('.settings-2d-only').all() if not node.locator('.section-body[hidden]').count())
   page.locator('#scene3d-enable').check()
   assert sum(not p['hidden'] for p in snap()['scene3d']['plots'])==3
   page.locator('#open-file').set_input_files({'name':'round42.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).scene3d.plots.length === 4')
   assert sum(not p['hidden'] for p in snap()['scene3d']['plots'])==3
   # Hide all but domain to exercise the full 96-point phase/modulus-band ceiling.
   for row in page.locator('#objects-3d .object').all():
    if 'Domain coloring' not in row.inner_text() and row.locator('button').filter(has_text='Hide').count():
     row.locator('button').filter(has_text='Hide').click()
   page.locator('#scene3d-detail').fill('96');page.locator('#scene3d-detail').dispatch_event('change')
   finished()
   assert page.locator('#drawing polygon').count()>10000
   assert 'PLOT LIMIT' not in page.locator('#render-info').inner_text()
   assert not errors,errors
   print(f'PASS ROUND42_CHROMIUM: {stats["count"]} polygons mixed, shared 3D camera, 3-visible rule, full 96 mesh, aligned Properties, 2D settings isolation, JSON/SVG')
  finally:browser.close()

if __name__=='__main__':run()
