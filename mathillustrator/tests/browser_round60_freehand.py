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
  page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
  page.locator('#open-file').set_input_files({'name':'round60.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
  page.locator('#objects .object').first.click()
  options=page.get_by_label('Arrowheads').locator('option').all_text_contents()
  assert options==['None','End','Start','Both'],options
  def measure():
   return page.evaluate('''() => {const g=document.querySelector('#drawing [data-id="o1"]');const path=g.querySelector('path');
     const tips=[...g.querySelectorAll('.latex-morphism-tip')];const end=path.getPointAtLength(path.getTotalLength());
     return {tips:tips.length, filled:g.querySelectorAll('polygon.freehand-arrowhead').length,
       endX:end.x,endY:end.y,tipXs:tips.map(p=>p.getPointAtLength(p.getTotalLength()).x)};}''')
  regular=measure();assert regular['tips']==2 and regular['filled']==0,regular
  assert all(abs(x-regular['endX'])<.01 for x in regular['tipXs']),regular
  for pattern in ['double','wavy']:
   page.get_by_label('Line style').select_option(pattern)
   assert not page.get_by_label('Arrowheads').is_disabled(),pattern
   for head,count in [('none',0),('end',2),('start',2),('both',4)]:
    page.get_by_label('Arrowheads').select_option(head)
    result=page.evaluate('''() => {const g=document.querySelector('#drawing [data-id="o1"]');
      const center=g.querySelector('path'),len=center.getTotalLength(),start=center.getPointAtLength(0),end=center.getPointAtLength(len);
      const visible=[...g.querySelectorAll(':scope > path')].filter(p=>p!==center&&!p.classList.contains('latex-morphism-tip')&&p.getAttribute('stroke')!=='none');
      const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      return {tips:g.querySelectorAll('.latex-morphism-tip').length,filled:g.querySelectorAll('polygon.freehand-arrowhead').length,
       shafts:visible.length,ds:visible.map(p=>distance(p.getPointAtLength(0),start)),
       de:visible.map(p=>distance(p.getPointAtLength(p.getTotalLength()),end))};}''')
    assert result['tips']==count and result['filled']==0,(pattern,head,result)
    assert result['shafts']==(2 if pattern=='double' else 1),(pattern,head,result)
    if head in ['start','both']:assert max(result['ds'])<.7,(pattern,head,result)
    if head in ['end','both']:assert max(result['de'])<.7,(pattern,head,result)
   page.get_by_label('Arrowheads').select_option('end')
   stored=json.loads(page.evaluate('window.__round36Snapshot()'))['objects'][0]
   assert stored['curveHeads']=='end',stored
  page.get_by_label('Line style').select_option('solid')
  assert not page.get_by_label('Arrowheads').is_disabled()
  restored=measure();assert restored['tips']==regular['tips'] and restored['filled']==0,(regular,restored)
  # The new-curve tool panel must remain usable (historically referenced a removed constant).
  page.locator('[data-tool-choice="freehand"]').click()
  assert page.get_by_label('Arrowheads').count()==1
  assert not page.get_by_label('Arrowheads').is_disabled()
  assert not errors,errors
  print('ROUND190_FREEHAND_CHROMIUM_PASS: four arrow modes, attached Double/Wavy shafts and open tips, JSON persistence')
 finally:browser.close()
