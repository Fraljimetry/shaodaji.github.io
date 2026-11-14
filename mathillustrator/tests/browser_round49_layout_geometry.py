"""R49 real Chromium: consistent stroke-only layout, 2D vector collision, 3D switches,
parametric labels and glyph-correct dependent perpendicular foot."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   page.set_default_timeout(25000)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expression):
    page.locator('#command').fill(expression);page.locator('#command-form button').click();page.wait_for_timeout(85)
   def add_plot(mode,*exprs):
    page.locator('#plot-mode').select_option(mode)
    for sel,txt in zip(['#command','#command-y','#command-z'],exprs):page.locator(sel).fill(txt)
    page.locator('#command-form button').click()
    page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=55000)
   def bbox(sel):return page.locator(sel).bounding_box()
   def overlap(a,b):return max(0,min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x']))*max(0,min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y']))
   def stroke_only(expect_mode=False):
    root='#properties .style-controls-grid.stroke-only-grid'
    assert page.locator(root).count()==1
    left=bbox(root+' .style-stroke');opacity=bbox(root+' .style-opacity');width=bbox(root+' .style-width')
    assert left['x']+left['width']<=opacity['x']+2,(left,opacity)
    assert overlap(left,opacity)<1 and overlap(left,width)<1,(left,opacity,width)
    assert abs(opacity['x']-width['x'])<1.5 and abs(opacity['width']-width['width'])<1.5
    left_input=bbox(root+' .style-stroke input[type=color]');assert abs(left_input['width']-left['width'])<2
    a=bbox(root+' .style-opacity input');b=bbox(root+' .style-width input')
    assert abs(a['width']-b['width'])<1.5 and abs(a['x']-b['x'])<1.5,(a,b)
    assert a['width']>22,(a,b)
    if expect_mode:
     color_range=bbox(root+' .style-color-range');assert color_range['x']>left['x']+left['width']-2
     assert overlap(color_range,left)<1 and overlap(color_range,opacity)<1
    tiles=page.locator(root+' .style-stroke .color-swatch');assert tiles.count()==10
    for tile in tiles.all():
     box=tile.bounding_box();assert abs(box['width']-box['height'])<1,box
   print('stage 2d vector',flush=True)
   add_plot('vectorField','x','y');stroke_only(True)
   assert page.locator('#properties .style-controls-grid .style-fill').count()==0
   print('stage foot',flush=True)
   page.locator('#plot-mode').select_option('function');
   for expression in ['A=(-2,0)','B=(2,0)','P=(0,3)','Line(A,B)']:
    cmd(expression)
   assert page.locator('[data-tool-choice="perpendicularFoot"]').count()==1
   tool=page.locator('[data-tool-choice="perpendicularFoot"]')
   assert tool.locator('svg circle').count()==2,tool.inner_html()
   assert tool.locator('svg circle').evaluate_all('(els)=>els.map(e=>e.getAttribute("r"))')==['2','2']
   tool.click()
   # Source point is clicked first, then the line. No third invisible click.
   page.locator('#drawing [data-id="o4"]').first.click();page.wait_for_timeout(160)
   line=page.locator('#drawing [data-id="o5"]').first
   anchor=line.evaluate('(el)=>{let r=el.getBoundingClientRect();return {x:r.x+r.width*.7,y:r.y+r.height/2}}')
   page.mouse.click(anchor['x'],anchor['y']);page.wait_for_timeout(180)
   feet=[o for o in state()['objects'] if o['type']=='perpendicularFoot']
   assert len(feet)==1,state()['objects']
   assert feet[0]['refs']==['o4','o5']
   root=page.locator(f'#drawing [data-id="{feet[0]["id"]}"]');assert root.count()>0
   page.locator(f'#objects .object[data-id="{feet[0]["id"]}"]').click()
   stroke_only(False)
   print('stage filled',flush=True)
   cmd('Circle(A,B)')
   page.locator('#objects .object').filter(has_text='Circle ').first.click()
   assert page.locator('#properties .style-controls-grid .style-fill').count()==0 # circle has no fill
   cmd('Polygon(A,B,P)')
   page.locator('#objects .object').filter(has_text='Polygon ').first.click()
   assert page.locator('#properties .style-controls-grid .style-fill').count()==1
   assert page.locator('#properties .style-controls-grid.stroke-only-grid').count()==0
   bottom=bbox('#properties .style-controls-grid .style-width');color=bbox('#properties .style-controls-grid .style-fill')
   assert bottom['y']>=color['y']+color['height']-4,(bottom,color)
   print('stage 3d checkboxes',flush=True)
   page.locator('#scene3d-enable').check()
   checks=page.locator('#settings-3d .checks-3d>.check')
   assert checks.count()==4
   bb=[x.bounding_box() for x in checks.all()]
   assert abs(bb[0]['y']-bb[1]['y'])<3 and abs(bb[2]['y']-bb[3]['y'])<3,bb
   assert bb[2]['y']-bb[0]['y']<29,bb
   assert bb[0]['x']<bb[1]['x'] and bb[2]['x']<bb[3]['x'],bb
   print('stage param 3d',flush=True)
   add_plot('parametric3d','cos(u)','sin(v)','u+v')
   label_text=page.locator('#properties .parametric-range-grid>.field').all_text_contents()
   assert label_text==['u min','u max','v min','v max'],label_text
   print('stage 3d vector',flush=True)
   add_plot('vector3d','x','y','z')
   nums=page.locator('#properties .plot-color-options>.field')
   assert nums.count()==2
   # 3D opacity + width have identical input lengths and x origins.
   boxes=[f.locator('input').bounding_box() for f in nums.all()]
   assert abs(boxes[0]['x']-boxes[1]['x'])<1.5 and abs(boxes[0]['width']-boxes[1]['width'])<1.5,boxes
   assert 'Width' in nums.nth(1).inner_text()
   assert not errors,errors
   print('PASS ROUND49 CHROMIUM: stroke-only + filled control alignment, no vector collision, 3D compact checkboxes/labels, two-click foot, 3D vector widths',flush=True)
  finally:browser.close()

if __name__=='__main__': main()
