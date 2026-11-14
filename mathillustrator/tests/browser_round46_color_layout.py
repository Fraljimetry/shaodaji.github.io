"""Chromium R46: real color inspectors, 2D/3D vector gradients, persistence, and compact 3D fields."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(40000)
   errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   get=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def complete():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=48000)
   def add(mode,a,b='',c=''):
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(a)
    if b:page.locator('#command-y').fill(b)
    if c:page.locator('#command-z').fill(c)
    page.locator('#command-form button').click()
    complete()
   def palette_layout(scope):
    wrap=page.locator(scope)
    parent=wrap.bounding_box();left=wrap.locator('.plot-color-slot,.style-stroke').bounding_box()
    right=wrap.locator('.plot-color-options,.style-color-range').bounding_box()
    swatch=wrap.locator('.color-swatches').bounding_box()
    assert left['x']<right['x'],(left,right)
    assert swatch['x']>=left['x']-1 and swatch['x']+swatch['width']<=right['x']+1,(swatch,left,right)
    assert abs((swatch['x']+swatch['width']/2)-(left['x']+left['width']/2))<5,(swatch,left)
    assert parent['width']>220,parent
   # 2D vector field: mode independent of alpha and editable single color.
   add('vectorField','x','y')
   assert len(get()['objects'])==1 and get()['objects'][0]['type']=='vectorField'
   palette_layout('#properties .vector-style-grid')
   assert page.locator('#properties .vector-style-grid input[type=color]').is_enabled()
   page.locator('#properties .vector-style-grid .style-color-range input').check()
   assert get()['objects'][0]['colorRange'] is True
   assert page.locator('#properties .vector-style-grid input[type=color]').is_disabled()
   strokes=page.locator('#drawing g.clickable path[stroke]').evaluate_all('(els) => [...new Set(els.map(p=>p.getAttribute("stroke"))) ]')
   assert len(strokes)>=3,strokes
   page.locator('#properties .vector-style-grid .style-color-range input').uncheck()
   assert get()['objects'][0]['colorRange'] is False
   assert page.locator('#properties .vector-style-grid input[type=color]').is_enabled()
   # 3D surface palette stays in left column, right column has color-range and alpha.
   page.locator('#scene3d-enable').check();complete()
   assert page.locator('#fast-3d-orbit').is_visible()
   assert page.locator('#scene3d-enable').is_visible()
   add('surface3d','x+y')
   palette_layout('#properties .plot-color-grid')
   assert page.locator('#properties .plot-color-options input[type=number]').count()==1
   page.locator('#properties .plot-color-options input[type=checkbox]').check();complete()
   assert get()['scene3d']['plots'][0]['colorRange'] is True
   assert page.locator('#properties .plot-color-slot input[type=color]').is_disabled()
   fills=page.locator('#drawing polygon').evaluate_all('(els) => [...new Set(els.map(e=>e.getAttribute("fill")))].filter(Boolean)')
   assert len(fills)>=5,fills[:10]
   page.locator('#properties .plot-color-options input[type=checkbox]').uncheck();complete()
   assert page.locator('#properties .plot-color-slot input[type=color]').is_enabled()
   # Parametric surface parameter ranges form one exact 2×2 grid.
   add('parametric3d','u','v','u*v')
   fields=page.locator('#properties .parametric-range-grid>.field')
   assert fields.count()==4
   boxes=[f.bounding_box() for f in fields.all()]
   assert abs(boxes[0]['y']-boxes[1]['y'])<3 and abs(boxes[2]['y']-boxes[3]['y'])<3,boxes
   assert boxes[0]['x']<boxes[1]['x'] and boxes[2]['y']>boxes[0]['y'],boxes
   # Both mesh and vector3d range coloring coexist within 3-visible rule.
   add('vector3d','x','y','z')
   assert len([p for p in get()['scene3d']['plots'] if not p['hidden']])==3
   palette_layout('#properties .plot-color-grid')
   page.locator('#properties .plot-color-options input[type=checkbox]').check();complete()
   assert get()['scene3d']['plots'][2]['colorRange'] is True
   colored=page.locator('#drawing line[stroke]').evaluate_all('(els)=>[...new Set(els.map(e=>e.getAttribute("stroke")))]')
   assert len(colored)>4,colored
   # Re-click to demonstrate independent scene preference and save-safe versioned JSON.
   page.locator('#fast-3d-orbit').uncheck();assert not page.locator('#fast-3d-orbit').is_checked()
   s=get();assert s['objects'][0]['colorRange'] is False
   assert [p['colorRange'] for p in s['scene3d']['plots']]==[False,False,True]
   # JSON can be exported and reopened without stripping the new property.
   page.locator('#save').click()
   with page.expect_download(timeout=12000) as event:
    page.locator('#save').click()
   download=event.value
   path=download.path();loaded=json.load(open(path))
   assert loaded['scene3d']['plots']==s['scene3d']['plots']
   assert not errors,errors
   print('PASS ROUND46_CHROMIUM: 2D vector gradient, 3D surface/vector range, centered palette, opacity, 2x2 parametric bounds, Interface, JSON')
  finally:browser.close()
if __name__=='__main__':run()
