"""R48 real Chromium: 3D lit gradient, square palettes, compact 2-column fields,
3D vector line width/legacy JSON; ensure original 2D vector appearance remains intact."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(40000)
   failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def ready():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=45000)
   def add(mode,*inputs):
    page.locator('#plot-mode').select_option(mode)
    for selector,value in zip(['#command','#command-y','#command-z'],inputs):page.locator(selector).fill(value)
    page.locator('#command-form button').click();ready()
   def squares(parent):
    tiles=page.locator(parent+' .color-swatches>.color-swatch')
    assert tiles.count()==10
    boxes=[tile.bounding_box() for tile in tiles.all()]
    grid=page.locator(parent+' .color-swatches').bounding_box()
    slot=page.locator(parent).bounding_box()
    for b in boxes:
     assert abs(b['width']-b['height'])<.6,b
     assert 15<=b['width']<=20.1,b
    assert abs((grid['x']+grid['width']/2)-(slot['x']+slot['width']/2))<1.5,(grid,slot)
    rowx=[b['x'] for b in boxes[:5]]
    assert all(abs((rowx[i+1]-rowx[i])-(rowx[1]-rowx[0]))<1.5 for i in range(1,4)),boxes
    assert all(abs(boxes[i]['x']-boxes[i+5]['x'])<1 for i in range(5)),boxes
   def same_line(field):
    return page.locator(field).evaluate('node=>{const r=document.createRange();r.selectNodeContents(node.firstChild);const label=r.getBoundingClientRect(),input=node.querySelector("input").getBoundingClientRect();return {label:{x:label.x,y:label.y,w:label.width,h:label.height},input:{x:input.x,y:input.y,w:input.width,h:input.height},field:node.getBoundingClientRect().toJSON()}}')
   # 2D original inspector: color left, color range on its right, two-column form.
   print('stage vector2d',flush=True);add('vectorField','x','y')
   left=page.locator('#properties .vector-style-grid .style-stroke').bounding_box()
   right=page.locator('#properties .vector-style-grid .style-color-range').bounding_box()
   assert right['x']>left['x']+left['width']-3,(left,right)
   squares('#properties .vector-style-grid .style-stroke')
   assert state()['objects'][0]['style']['width']==2
   # Three-dimensional Interface uses first-left and first-right in same row.
   print('stage switch3d',flush=True);page.locator('#scene3d-enable').check();ready()
   a=page.locator('#scene3d-enable').bounding_box();b=page.locator('#fast-3d-orbit').bounding_box()
   assert a['x']<b['x'] and abs(a['y']-b['y'])<3,(a,b)
   print('stage surface3d',flush=True);add('surface3d','sin(x)*cos(y)')
   squares('#properties .plot-color-slot')
   page.locator('#properties .plot-color-options input[type=checkbox]').check();ready()
   # The same faces have stronger brightness variation under illumination.
   lit=page.locator('#drawing polygon').evaluate_all('(els)=>els.map(e=>e.getAttribute("fill")).filter(s=>s&&s.startsWith("rgb"))')
   assert len(lit)>200
   print('stage lighting off',flush=True);page.locator('#scene3d-lighting').uncheck();ready()
   unlit=page.locator('#drawing polygon').evaluate_all('(els)=>els.map(e=>e.getAttribute("fill")).filter(s=>s&&s.startsWith("rgb"))')
   assert len(lit)==len(unlit)
   def brightness(s):return sum(map(int,s[4:-1].split(',')))
   diff=[brightness(off)-brightness(on) for on,off in zip(lit,unlit)]
   assert max(diff)>70,max(diff)
   assert min(diff)>=-5,min(diff)
   page.locator('#scene3d-lighting').check();ready()
   # Four parametric inputs stay 2x2 but each label and value share one baseline.
   print('stage parametric3d',flush=True);add('parametric3d','u','v','u*v')
   for i in range(1,5):
    result=same_line(f'#properties .parametric-range-grid>.field:nth-child({i})')
    assert result['input']['x']>result['label']['x']+result['label']['w']-1,result
    assert abs((result['input']['y']+result['input']['h']/2)-(result['label']['y']+result['label']['h']/2))<6,result
   # 3D vector Line width inspector edits the visible SVG without new mesh.
   print('stage vector3d',flush=True);add('vector3d','x','y','z')
   squares('#properties .plot-color-slot')
   numbers=page.locator('#properties .plot-color-options>.field')
   assert numbers.count()==2
   for i in range(1,3):
    result=same_line(f'#properties .plot-color-options>.field:nth-child({i+1})')
    assert result['input']['x']>result['label']['x']+result['label']['w']-1,result
   line_width=page.locator('#properties .plot-color-options>.field').filter(has_text='Line width').locator('input')
   assert line_width.input_value()=='1.5'
   print('stage width',flush=True);line_width.fill('5.5');line_width.press('Tab');ready()
   assert state()['scene3d']['plots'][-1]['lineWidth']==5.5
   svg_widths=page.locator('#drawing line[stroke-width="5.5"]').count()
   assert svg_widths>10,svg_widths
   print('stage save',flush=True);page.locator('#save').click()
   with page.expect_download(timeout=12000) as event:print('stage save',flush=True);page.locator('#save').click()
   backup=json.load(open(event.value.path()))
   assert backup['scene3d']['plots'][-1]['lineWidth']==5.5
   assert not failures,failures
   print('PASS ROUND48 CHROMIUM: stronger stable gradient, 2D+3D square centered palettes, 3D Interface, inline 2x2 parametric, vector width+JSON')
  finally:browser.close()
if __name__=='__main__':run()
