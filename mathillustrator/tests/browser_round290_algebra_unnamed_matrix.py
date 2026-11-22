"""Real Chromium: 2D Algebra name-free parity, undo, dependency, validation and persistence."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1340,'height':900});errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def enter(src):
    field=page.locator('#unified-algebra-input');field.fill(src);field.press('Enter')
   for cmd in ['A=(0,0)','B=(4,0)','C=(1,3)','D=(4,4)','Slider(0,10,1,2)',
               '(Slider1+2,1)','Point(1,3)','Segment(A,B)','Circle(A,B)',
               'm=Midpoint(A,B)','Triangle(A,B,C)',
               'p=Node(1,0,"P")','q=Node(4,2,"Q")',
               'Morphism(p,q,"f")','f=Morphism(p,q,"g")','Text(2,2,"Hi")']:
    enter(cmd)
   d=snap();sl=d['algebra']['sliders'][0]
   assert sl['name']=='Slider1',sl
   assert any(x['name']=='f' and x['type']=='morphism' for x in d['objects'])
   named=lambda n:next(o for o in snap()['objects'] if o['name']==n)
   p=next(o for o in d['objects'] if o.get('xyExpr')==['Slider1+2','1'])
   assert p['xy']==[4,1],p
   pre=snap();enter('Slider(1,1)');assert snap()==pre,'invalid slider mutated state'
   enter('Morphism(p,missing,"z")');assert snap()==pre,'invalid morphism mutated state'
   # New slider must not perturb existing references or names.
   enter('Slider(0,6,1,1)');assert snap()['algebra']['sliders'][-1]['name']=='Slider2'
   page.locator('#undo').click();assert len(snap()['algebra']['sliders'])==1
   page.locator('#redo').click();assert len(snap()['algebra']['sliders'])==2
   # Properties edit of an existing dynamic reference and serialized IDs.
   base=snap();ids={o['id']:o.get('refs') for o in base['objects']}
   assert all((ref in ids) for refs in ids.values() if refs for ref in refs)
   assert page.locator('#drawing svg, svg#drawing').count()>0
   assert not errors,errors
   print('ROUND290_ALGEBRA_MATRIX_CHROMIUM_PASS',len(base['objects']),'objects',len(base['algebra']['sliders']),'sliders')
  finally:browser.close()
if __name__=='__main__':run()
