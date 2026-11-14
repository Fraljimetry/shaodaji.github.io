"""Round38 bounded numeric stress: complex poles/branches, fields and export fail-closed."""
import json,os,time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1420,'height':860},accept_downloads=True)
   page.on('dialog',lambda dialog:dialog.accept())
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.locator('[data-tool-choice="select"]').wait_for(state='attached')
   start=time.monotonic()
   def add(mode,x,y=None):
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(x)
    if y is not None:page.locator('#command-y').fill(y)
    page.locator('#command-form button').click()
   for a,b in [('x','y'),('-y','x'),('sin(10x)','cos(10y)'),('1/(x^2+y^2)','xy'),('sin(y)','cos(x)'),('x*y','x^2-y^2')]:add('vectorField',a,b)
   for expression in ['z^2+1','1/z','sqrt(z)','log(z)','sin(1/z)','e^(i*pi*z)']:
    add('domainColoring',expression)
   for expression in ['1/x','sin(100x)/(1+x^2)','tan(x)']:add('function',expression)
   page.locator('#plot-mode').select_option('parametric')
   page.locator('#parameter-symbol').select_option('t')
   for x,y in [('cos(30t)','sin(30t)'),('t cos(t)','t sin(t)')]:add('parametric',x,y)
   for expression in ['x^2+y^2-4','xy=1','sin(x)cos(y)=0']:add('implicit',expression)
   data=json.loads(page.evaluate('window.__round36Snapshot()'))
   assert len(data['objects'])==20,len(data['objects'])
   assert page.locator('#drawing image').count()==6
   assert page.locator('#drawing path.clickable').count()>=14
   assert not errors,errors
   page.locator('#zoom-in').click();page.locator('#zoom-out').click()
   page.locator('#ui-language').select_option('zh')
   page.set_viewport_size({'width':390,'height':820})
   assert page.locator('#plot-mode').count()==1
   page.set_viewport_size({'width':1420,'height':860})
   page.locator('#ui-language').select_option('en')
   # A deliberately over-budget single field must warn and prevent false image success.
   page.locator('#plot-budget').select_option('20000')
   page.locator('[data-tool-choice="select"]').click()
   last_color=[o for o in data['objects'] if o['type']=='domainColoring'][-1]
   page.locator('#objects [data-id="'+last_color['id']+'"]').click()
   page.locator('#properties').get_by_label('Coloring resolution').fill('256')
   page.locator('#properties').get_by_label('Coloring resolution').press('Tab')
   assert 'PLOT LIMIT' in page.locator('#render-info').inner_text()
   page.locator('#export-open').click()
   assert page.locator('#export-options button').filter(has_text='SVG').is_disabled()
   assert page.locator('#export-options button').filter(has_text='JSON project').is_enabled()
   assert not errors,errors
   print(f'PASS Round38 stress: 20 plots (6 fields, 6 complex, 3 explicit, 2 parametric, 3 implicit), zoom, mobile, ZH, fail-closed image budget in {time.monotonic()-start:.2f}s')
  finally:browser.close()
if __name__=='__main__':run()
