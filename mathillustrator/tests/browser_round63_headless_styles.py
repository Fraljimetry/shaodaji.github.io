"""Round 63 Chromium: visual headless double/wavy styles and restored hook."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
ROOT=Path(__file__).resolve().parents[1]
style={'stroke':'#3456aa','fill':'#ffffff','width':1,'opacity':1}
doc=json.loads((ROOT/'examples/geometry-demo.json').read_text())
doc['objects']=[dict(id='o1',name='N1',type='node',xy=[-4,0],text='A',textMode='plain',style=style,hidden=False,locked=False),dict(id='o2',name='N2',type='node',xy=[4,0],text='B',textMode='plain',style=style,hidden=False,locked=False),dict(id='o3',name='Arrow3',type='morphism',refs=['o1','o2'],text='',textMode='plain',bend=0,routing='direct',morphismHeads='hook',style=style,hidden=False,locked=False),dict(id='o4',name='Curve4',type='freehand',path=[[-3,-2],[-1,-1],[0,-3],[3,-2]],curveHeads='both',closed=False,style=style,hidden=False,locked=False)]
doc['nextId']=5
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=b.new_page(viewport={'width':1450,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  page.locator('#open-file').set_input_files({'name':'round63.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
  page.wait_for_timeout(200)
  page.locator('[data-tool-choice="select"]').click()
  page.locator('#object-search').fill('Arrow3');page.locator('#objects .object').first.click()
  heads=page.get_by_label('Arrowheads');lines=page.get_by_label('Line style')
  assert heads.input_value()=='hook'
  assert page.locator('#drawing .latex-morphism-hook').count()==1
  for line in ['double','wavy']:
   lines.select_option(line)
   assert not heads.is_disabled() and heads.input_value()=='none',line
   assert page.locator('#drawing g[data-id="o3"] .latex-morphism-tip').count()==0,line
   assert page.locator('#drawing g[data-id="o3"] .latex-morphism-hook').count()==0,line
  # A line-style switch must not destroy the stored hook preference.
  stored=json.loads(download(page,'Save').read_text());m=next(o for o in stored['objects'] if o['type']=='morphism')
  assert m['morphismHeads']=='hook',m
  lines.select_option('solid');assert not heads.is_disabled() and heads.input_value()=='hook'
  assert page.locator('#drawing .latex-morphism-hook').count()==1
  page.locator('#object-search').fill('Curve4');page.locator('#objects .object').first.click()
  heads=page.get_by_label('Arrowheads');lines=page.get_by_label('Line style')
  assert heads.input_value()=='both'
  for line in ['double','wavy']:
   lines.select_option(line)
   assert not heads.is_disabled() and heads.input_value()=='both',line
   assert page.locator('#drawing [data-id="o4"] .latex-morphism-tip').count()==4,line
   assert page.locator('#drawing .freehand-arrowhead').count()==0,line
  lines.select_option('solid');assert not heads.is_disabled() and heads.input_value()=='both'
  assert page.locator('#drawing [data-id="o4"] .latex-morphism-tip').count()==4
  assert not errors,errors
  print('ROUND190_CHROMIUM_PASS: legacy hook restoration, four-mode decorated arrows, freehand open tips')
 finally:b.close()
