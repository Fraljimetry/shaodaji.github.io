"""Round 36 complex plotting browser regression, including singular and topologically tricky fields."""
import json,os,time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download

def go(page,mode,x,y=None):
 page.locator('#plot-mode').select_option(mode);page.locator('#command').fill(x)
 if y is not None:page.locator('#command-y').fill(y)
 page.locator('#command-form button').click()

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   p=b.new_page(viewport={'width':1520,'height':950},accept_downloads=True);p.on('dialog',lambda d:d.accept());errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load');p.locator('#plot-mode').wait_for()
   start=time.monotonic()
   explicit=['sin(30*x)/(1+x^2)','1/(x-1)','sqrt(abs(x))','tan(x)','sin(1/x)','x^3-2*x','exp(-x^2)','abs(x)','log(abs(x))','x^5']
   param=[('cos(u)','sin(v)'),('u*cos(u)','u*sin(v)'),('1/(u-3)','sin(v)'),('u^2','u^3-3*u'),('2*cos(u)-cos(2*u)','2*sin(v)-sin(2*v)'),('u','u^2-1')]
   impl=['x^2+y^2=1','x^2-y^2=1','x*y=0','x^4+y^4=1','sin(x)*cos(y)=0','x^2+y^2=0','1/x-y','x^2+y^2+1','y^2=x^3-x','abs(x)+abs(y)=1']
   for expression in explicit:go(p,'function',expression)
   for x,y in param:go(p,'parametric',x,y)
   for expression in impl:go(p,'implicit',expression)
   d=json.loads(p.evaluate('window.__round36Snapshot()'))
   assert len(d['objects'])==len(explicit)+len(param)+len(impl)
   assert all(o['style']['stroke']=='#000000' for o in d['objects'])
   assert p.locator('#drawing path.clickable').count()>=len(explicit)+len(param)+len(impl)-2
   # Correctly empty contours are not made up from non-sign-changing fields.
   zeros=[o for o in d['objects'] if o.get('expr') in ('x^2+y^2=0','x^2+y^2+1')]
   assert len(zeros)==2
   for o in zeros:assert p.locator(f'#drawing path[data-id="{o["id"]}"]').first.get_attribute('d')==''
   # Cache correctness when precision and zoom/viewport change.
   p.locator('#plot-quality').select_option('detailed');p.locator('#implicit-grid').fill('8');p.locator('#implicit-grid').press('Tab')
   d2=json.loads(p.evaluate('window.__round36Snapshot()'));assert len(d2['objects'])==len(d['objects'])
   p.locator('#zoom-in').click();p.locator('#zoom-out').click()
   # Export SVG must contain all curves and not serialize temporary hit-stroke paint.
   p.locator('#export-open').click();svg=download(p,'SVG').read_text()
   assert '<svg' in svg and svg.count('<path')>=len(d['objects'])
   # Undo must reverse a plot setting without stripping curve definitions.
   p.locator('#undo').click();assert len(json.loads(p.evaluate('window.__round36Snapshot()'))['objects'])==len(d['objects'])
   p.locator('#redo').click()
   p.locator('#ui-language').select_option('zh');p.set_viewport_size({'width':390,'height':820})
   assert p.locator('#plot-mode').count()==1
   assert not errors,errors
   print(f'PASS Round36 complex scene: {len(d["objects"])} mixed function/parametric/implicit plots, {time.monotonic()-start:.2f}s total interaction+export+resize, no page errors')
  finally:b.close()
if __name__=='__main__':run()
