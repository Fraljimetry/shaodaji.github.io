"""Round 51R: live 2D/3D plot property consistency and atomic Enter redraw."""
import os,json,math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=b.new_page(viewport={'width':1450,'height':925})
   page.set_default_timeout(16000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def add(mode,a,b=None):
    page.locator('#plot-mode').select_option(mode);page.locator('#command').fill(a)
    if b is not None:page.locator('#command-y').fill(b)
    page.locator('#command-form button').click();page.wait_for_timeout(150)
   def prop():return page.locator('#properties')
   add('function','x^2');assert prop().get_by_text('f(x)',exact=True).count()==1
   add('parametric','cos(t)','sin(t)')
   assert page.locator('#parameter-symbol').is_hidden()
   assert prop().get_by_text('x(t)',exact=True).count()==1
   assert prop().get_by_text('y(t)',exact=True).count()==1
   assert prop().locator('select[aria-label="Parameter symbol"]').count()==0
   r=prop().locator('.parametric-range-grid');assert r.locator('input').count()==2
   boxes=[e.bounding_box() for e in r.locator('label').all()]
   assert abs(boxes[0]['y']-boxes[1]['y'])<3
   assert state()['objects'][-1]['parameter']=='t'
   r.get_by_label('t min').fill('-1');r.get_by_label('t min').press('Tab')
   assert state()['objects'][-1]['tMin']==-1
   add('implicit','x^2+y^2=1');assert prop().get_by_text('F(x, y)',exact=True).count()==1
   add('vectorField','-y','x');assert prop().get_by_text('X(x, y)',exact=True).count()==1
   region=prop().locator('.plot-region-editor');assert region.get_by_role('button',name='Apply ±').count()==1
   before=state()['objects'][-1]['region'].copy()
   region.get_by_label('x max').fill('5')
   region.get_by_label('x max').press('Tab')
   assert state()['objects'][-1]['region']==before,'blur should not redraw'
   region.get_by_label('x max').locator('..').dblclick(position={'x':7,'y':13})
   assert [float(i.input_value()) for i in region.locator('input:not([aria-label="Centered half-range"])').all()]==[-5,5,-5,5]
   assert state()['objects'][-1]['region']==before
   region.get_by_label('x max').press('Enter')
   assert state()['objects'][-1]['region']=={'xMin':-5,'xMax':5,'yMin':-5,'yMax':5}
   page.locator('#undo').click();assert state()['objects'][-1]['region']==before
   page.locator('#redo').click();assert state()['objects'][-1]['region']['yMax']==5
   region=prop().locator('.plot-region-editor')
   region.get_by_label('x min').fill('7');region.get_by_label('x min').press('Enter')
   assert state()['objects'][-1]['region']['xMin']==-5,'invalid range must rollback'
   print('ROUND51R_2D_CHROMIUM_PASS',flush=True)
   page.locator('#scene3d-enable').check(force=True)
   add('surface3d','sin(x)*cos(y)')
   assert prop().get_by_text('f(x, y)',exact=True).count()==1
   region=prop().locator('.plot-region-editor');assert region.get_by_role('button',name='Apply ±').count()==1
   bounds=state()['scene3d']['plots'][-1]['bounds'].copy()
   region.get_by_label('x max').fill('5')
   region.get_by_label('x max').locator('..').dblclick(position={'x':7,'y':13})
   assert [float(e.input_value()) for e in region.locator('input:not([aria-label="Centered half-range"])').all()]==[-5,5,-5,5,-5,5]
   assert state()['scene3d']['plots'][-1]['bounds']==bounds
   region.get_by_label('x max').press('Enter')
   assert state()['scene3d']['plots'][-1]['bounds']=={'xMin':-5,'xMax':5,'yMin':-5,'yMax':5,'zMin':-5,'zMax':5}
   region=prop().locator('.plot-region-editor');region.get_by_label('x min').fill('alert(1)');region.get_by_label('x min').press('Enter')
   assert state()['scene3d']['plots'][-1]['bounds']['xMin']==-5
   assert not errors,errors
   print('ROUND51R_3D_CHROMIUM_PASS',flush=True)
  finally:b.close()
if __name__=='__main__':main()
