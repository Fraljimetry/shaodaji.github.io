"""Round 60 isolated Chromium regression for free-curve arrow options and tip geometry."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]
doc=json.loads((ROOT/'examples/geometry-demo.json').read_text())
style={'stroke':'#111111','fill':'#ffffff','width':2,'opacity':1}
doc['objects']=[dict(id='o1',name='Curve1',type='freehand',path=[[-4,0],[-3,0],[-2,0],[-1,0],[0,0]],closed=False,style=style,hidden=False,locked=False,curveHeads='end',curveLine='solid')]
doc['nextId']=2
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1450,'height':900}); errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  page.locator('#open-file').set_input_files({'name':'round60.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
  page.locator('#objects .object').first.click()
  options=page.get_by_label('Arrowheads').locator('option').all_text_contents()
  assert options==['None','End','Start','Both'],options
  def measure():
   return page.evaluate('''() => {const g=document.querySelector('#drawing [data-id="o1"]');const path=g.querySelector('path');const poly=g.querySelector('polygon.freehand-arrowhead');
     if(!poly)throw Error('Missing free curve arrowhead');const nums=poly.getAttribute('points').trim().split(/[ ,]+/).map(Number);
     const l=path.getTotalLength(),end=path.getPointAtLength(l);
     return {tipX:nums[0],tipY:nums[1],endX:end.x,endY:end.y,span:Math.hypot(nums[2]-nums[4],nums[3]-nums[5])};}''')
  regular=measure();assert regular['tipX']>regular['endX']+.5,regular
  page.get_by_label('Line style').select_option('double')
  double=measure();assert double['span']>regular['span']*1.4,(regular,double)
  assert not errors,errors
  print('ROUND60_CHROMIUM_PASS: four arrow modes, sharp tip beyond round cap, double-line head size')
 finally:browser.close()
