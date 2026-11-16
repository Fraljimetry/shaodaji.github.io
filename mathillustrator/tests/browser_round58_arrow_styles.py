"""Round 58: Chromium renders independent morphism/free curve styles and exports them."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
ROOT=Path(__file__).resolve().parents[1]
style={'stroke':'#3456aa','fill':'#ffffff','width':1,'opacity':1}
doc=json.loads((ROOT/'examples/geometry-demo.json').read_text())
doc['objects']=[dict(id='o1',name='N1',type='node',xy=[-4,0],text='A',textMode='plain',style=style,hidden=False,locked=False),dict(id='o2',name='N2',type='node',xy=[4,0],text='B',textMode='plain',style=style,hidden=False,locked=False),dict(id='o3',name='Arrow3',type='morphism',refs=['o1','o2'],text='',textMode='plain',bend=0,routing='direct',style=style,hidden=False,locked=False),dict(id='o4',name='Curve4',type='freehand',path=[[-3,-2],[-1,-1],[0,-3],[3,-2]],closed=False,style=style,hidden=False,locked=False)]
doc['nextId']=5
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=b.new_page(viewport={'width':1450,'height':900},accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  page.locator('#open-file').set_input_files({'name':'round58.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
  page.wait_for_timeout(250)
  page.locator('[data-tool-choice="select"]').click()
  page.locator('#object-search').fill('Arrow3');page.locator('#objects .object').first.click()
  heads=page.get_by_label('Arrowheads');lines=page.get_by_label('Line style')
  assert heads.count()==1 and lines.count()==1
  for line in ['solid','dashed','dotted','double','wavy']:
   lines.select_option(line)
   root=page.locator('#drawing g[data-id="o3"]');assert root.count()==1,line
   if line in ['double','wavy']:
    assert root.locator('path').count()>=2,line
    for head in ['none','end','start','both']:
     heads.select_option(head)
     assert root.locator('.latex-morphism-tip').count()==({'none':0,'end':2,'start':2,'both':4}[head]),(line,head)
     # The visible decorated stroke must actually reach the arrow tip.
     # Merely drawing V-shaped tips near the endpoint is not sufficient.
     if head!='none':
      endpoint=page.evaluate('''() => {
       const g=document.querySelector('#drawing g[data-id="o3"]');
       const center=g.querySelector('path');
       const visible=[...g.querySelectorAll(':scope > path')].filter(p=>p!==center && !p.classList.contains('latex-morphism-tip') && p.getAttribute('stroke')!=='none');
       const start=center.getPointAtLength(0),end=center.getPointAtLength(center.getTotalLength());
       const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
       return {count:visible.length,ds:visible.map(p=>dist(p.getPointAtLength(0),start)),
         de:visible.map(p=>dist(p.getPointAtLength(p.getTotalLength()),end))};
      }''')
      assert endpoint['count']==(2 if line=='double' else 1),(line,head,endpoint)
      if head in ('start','both'):assert max(endpoint['ds'])<0.6,(line,head,endpoint)
      if head in ('end','both'):assert max(endpoint['de'])<0.6,(line,head,endpoint)
  lines.select_option('solid')
  for h in ['none','end','start','both','double-end','hook','tail','harpoon']:
   heads.select_option(h)
   root=page.locator('#drawing g[data-id="o3"]')
   count=root.locator('.latex-morphism-tip').count()
   if h=='none':assert count==0
   if h=='double-end':assert count==4,count
   if h=='end':assert count==2,count
  page.locator('#object-search').fill('Curve4');page.locator('#objects .object').first.click()
  heads=page.get_by_label('Arrowheads');lines=page.get_by_label('Line style')
  for line in ['solid','dashed','dotted','double','wavy']:
   lines.select_option(line)
   root=page.locator('#drawing [data-id="o4"]');assert root.count()>=1,line
  lines.select_option('solid')
  for h in ['none','start','end','both']:
   heads.select_option(h)
   assert page.locator('#drawing [data-id="o4"]').count()>=1,h
  lines.select_option('wavy')
  # Persist both styles; undo/redo must maintain the independent fields.
  stored=json.loads(download(page,'Save').read_text())
  f=next(o for o in stored['objects'] if o['type']=='freehand')
  assert f['curveLine']=='wavy' and f['curveHeads']=='both',f
  page.locator('#undo').click();page.locator('#redo').click()
  assert json.loads(download(page,'Save').read_text())['objects'][-1]['curveHeads']=='both'
  page.locator('#object-search').fill('Arrow3');page.locator('#objects .object').first.click()
  page.get_by_label('Arrowheads').select_option('none')
  page.get_by_label('Line style').select_option('double')
  stored=json.loads(download(page,'Save').read_text())
  m=next(o for o in stored['objects'] if o['type']=='morphism')
  assert m['morphismHeads']=='none' and m['morphismLine']=='double',m
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  assert 'data-id="o3"' in svg and 'data-id="o4"' in svg
  assert not errors,errors
  print('ROUND58_CHROMIUM_PASS morphism tips, arrowless, double-end, line patterns, freehand styles, undo/redo, JSON and SVG')
 finally:b.close()
