"""Round 68 real Chromium: transformed geometric roles, selection and diagram coexistence."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1480,'height':960})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.set_default_timeout(3000)
   page.wait_for_timeout(200)
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expr):
    page.locator('#command').fill(expr);page.locator('#command-form button').click();page.wait_for_timeout(120)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click();page.wait_for_timeout(85)
   def clickobj(id):
    page.locator(f'#drawing [data-id="{id}"]').first.click(force=True);page.wait_for_timeout(115)
   cmd('O=(0,0)');cmd('P=(1,0)');cmd('Circle(O,P)')
   tool('dilation')
   circlebox=page.locator('#drawing [data-id="o3"]').first.bounding_box()
   assert circlebox,circlebox
   # Arc click 8px from the defining point P: close enough for the
   # snap index to see P, but outside its 5px marker. The SVG target is circle.
   radius=circlebox['width']/2
   page.mouse.click(circlebox['x']+radius+(radius*radius-64)**.5,circlebox['y']+radius-8)
   page.wait_for_timeout(115)
   page.once('dialog',lambda d:d.accept('2'));clickobj('o1')
   image=next(o for o in snapshot()['objects'] if o['type']=='transformCopy')
   locator=page.locator(f'#drawing [data-id="{image["id"]}"]').first
   assert locator.count()==1 and locator.evaluate('(el)=>el.tagName.toLowerCase()')=='circle','Affine image must be exact SVG circle'
   assert image['refs']==['o3','o1']
   # Source selection clicks the actual circle's stroke, never its empty center.
   tool('pointOnObject');box=locator.bounding_box()
   assert box and box['width']>80,box
   page.mouse.click(box['x']+box['width']-1.5,box['y']+box['height']/2)
   page.wait_for_timeout(80)
   page.mouse.click(box['x']+box['width']/2,box['y']+2)
   page.wait_for_timeout(130)
   constraint=next(o for o in snapshot()['objects'] if o['type']=='pointOnObject')
   assert constraint['refs']==[image['id']],constraint
   assert page.locator(f'#drawing [data-id="{constraint["id"]}"]').count()==1
   # Dilation of constrained point should render as point marker, with per-point style.
   tool('dilation');clickobj(constraint['id'])
   page.once('dialog',lambda d:d.accept('2'));clickobj('o1')
   q=next(o for o in snapshot()['objects'] if o['type']=='transformCopy' and o['refs'][0]==constraint['id'])
   tool('select');clickobj(q['id'])
   point_markup=page.locator(f'#drawing [data-id="{q["id"]}"]').first
   assert point_markup.evaluate('(el)=>el.tagName.toLowerCase()')=='circle'
   assert abs(float(point_markup.get_attribute('r'))-float(q['style']['pointSize']))<1e-9
   prop=page.locator('#properties')
   assert prop.get_by_text('Point size').count()>0,'Transformed point must offer Point size'
   point_input=prop.locator('label').filter(has_text='Point size').locator('input')
   point_input.fill('11');point_input.press('Tab');page.wait_for_timeout(100)
   assert snapshot()['objects'][-1]['style']['pointSize']==11
   assert float(page.locator(f'#drawing [data-id="{q["id"]}"]').first.get_attribute('r'))==11
   # A rotated infinite line must fill the viewport, rather than a short
   # ±15-world-unit sampled stroke, and be fully usable by follow-on tools.
   cmd('Line(O,P)')
   line=next(o for o in snapshot()['objects'] if o['type']=='line')
   tool('rotation')
   pbox=page.locator('#drawing [data-id="o1"]').first.bounding_box()
   page.mouse.click(pbox['x']+pbox['width']/2+24,pbox['y']+pbox['height']/2)
   page.wait_for_timeout(100)
   page.once('dialog',lambda d:d.accept('90'))
   clickobj('o1')
   rotated=next(o for o in snapshot()['objects'] if o['type']=='transformCopy' and o['refs'][0]==line['id'])
   rendered=page.locator(f'#drawing [data-id="{rotated["id"]}"]').first
   assert rendered.evaluate('(el)=>el.tagName.toLowerCase()')=='line'
   assert rendered.bounding_box()['height']>200,'Transformed infinite line is short or invisible'
   # Diagram tool switching: transient snap must still follow focus, never alter JSON.
   tool('node');snap=page.locator('#snap');assert snap.is_checked() and snap.is_disabled()
   tool('select');assert not snap.is_disabled() and not snap.is_checked()
   assert snapshot()['settings']['snap']==False
   assert not errors,errors
   print('ROUND68_CHROMIUM_PASS: exact affine circle, constrained-point construction, transformed point size, diagram snap restoration')
  finally:browser.close()
if __name__=='__main__':main()
