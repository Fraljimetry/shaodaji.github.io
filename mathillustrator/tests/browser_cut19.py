"""Cut 19: long mathematical labels, multi-line editing, offscreen rendering,
semantic arrow crossing and retained project data. Isolated Chromium only.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1300,'height':840},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(120)
  # Text object properties must permit intentional author line breaks.
  data=json.loads((ROOT/'examples/geometry-demo.json').read_text())
  data['objects']=[{'id':'o1','type':'text','name':'T','xy':[-2,1], 'fontSize':18,'text':'First','hidden':False,'locked':False,'style':{'stroke':'#3657ad','fill':'#ffffff','opacity':1,'width':2}}]
  data['nextId']=2
  page.locator('#open-file').set_input_files({'name':'text.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
  page.wait_for_timeout(120)
  page.locator('#objects .object').first.click()
  props=page.locator('#properties');area=props.locator('textarea').first
  assert area.count()==1,'Text editing must expose multiline textarea rather than one-line input'
  area.fill('A  B\nC   D');area.dispatch_event('change')
  page.locator('#command').click();page.wait_for_timeout(100)
  assert page.locator('#drawing [data-id="o1"] tspan').count()==2,'Displayed SVG text must show two distinct lines'
  assert page.locator('#drawing [data-id="o1"] tspan').all_text_contents()==['A  B','C   D']
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  assert 'A  B' in svg and 'C   D' in svg
  page.locator('#export-open').click()
  data=json.loads(download(page,'JSON project').read_text())
  assert data['objects'][0]['text']=='A  B\nC   D','JSON round-trip changed mathematical label content'
  # Diagram labels wrapping at spaces must not change their text, including
  # multiple spaces inside or immediately adjacent to wrap boundaries.
  original='Object   with  many  spaces '+('x   y  '*17)
  data['objects']=[{'id':'o1','type':'node','name':'N','xy':[0,0], 'fontSize':17,'text':original,'hidden':False,'locked':False,'style':{'stroke':'#3657ad','fill':'#ffffff','opacity':1,'width':2}}]
  data['nextId']=2
  page.locator('#open-file').set_input_files({'name':'long.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
  page.wait_for_timeout(120)
  lines=page.locator('#drawing [data-id="o1"] tspan').all_text_contents()
  assert len(lines)>1 and ''.join(lines)==original,(lines,original)
  # Culling must preserve semantic data and visible crossing arrows, while
  # omitting truly offscreen text/node SVG subtrees.
  data['objects']=[]
  def obj(t,i,x,y,txt):
   return {'id':f'o{i}','name':f'O{i}','type':t,'xy':[x,y],'text':txt,'fontSize':16,'hidden':False,'locked':False,'style':{'stroke':'#3657ad','fill':'#ffffff','opacity':1,'width':2}}
  data['objects'].append(obj('node',1,-300,0,'L'))
  data['objects'].append(obj('node',2,300,0,'R'))
  data['objects'].append({'id':'o3','name':'f','type':'morphism','refs':['o1','o2'],'text':'f','bend':0,'hidden':False,'locked':False,'style':{'stroke':'#3657ad','fill':'#ffffff','opacity':1,'width':2}})
  for i in range(4,1004):
   data['objects'].append(obj('text' if i%2 else 'node',i,500+i*.2,500+i*.2,'Offscreen '+str(i)))
  data['objects'].append(obj('text',1004,-6,0,'Near visible edge'))
  data['nextId']=1005
  page.locator('#open-file').set_input_files({'name':'crowded.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
  page.wait_for_timeout(220)
  assert page.locator('#object-count').inner_text()=='1004'
  assert page.locator('#drawing g[data-id="o1"]').count()==0,'Offscreen node should be culled'
  assert page.locator('#drawing [data-id="o4"]').count()==0,'Offscreen node should be culled'
  assert page.locator('#drawing [data-id="o5"]').count()==0,'Offscreen text should be culled'
  assert page.locator('#drawing g[data-id="o3"] path').count()==1,'Crossing morphism must remain visible with offscreen nodes'
  assert page.locator('#drawing [data-id="o1004"]').count()==1,'Near-viewport text was wrongly culled'
  assert page.locator('#drawing [data-id]').count()<30,'Crowded scene should not create thousands of offscreen DOM labels'
  # An offscreen object remains editable via object-list search and in JSON.
  page.locator('#object-search').fill('O700')
  assert page.locator('#objects .object').count()==1
  page.locator('#objects .object').first.click()
  assert page.locator('#properties textarea').count()==1
  page.locator('#export-open').click()
  exported=json.loads(download(page,'JSON project').read_text())
  assert len(exported['objects'])==1004 and exported['objects'][699]['name']=='O700'
  # A semantic morphism's explicit newline must remain editable, visible and
  # non-exportable via the restricted (single-line) PDFLaTeX path.
  diagram=json.loads((ROOT/'examples/diagram-demo.json').read_text())
  page.locator('#open-file').set_input_files({'name':'diagram.json','mimeType':'application/json','buffer':json.dumps(diagram).encode()})
  page.wait_for_timeout(120)
  page.locator('#object-search').fill('morphism')
  row=page.locator('#objects .object').first
  assert row.count()==1
  row.click()
  arrow=page.locator('#properties textarea').first
  arrow.fill('alpha  beta\ngamma');arrow.dispatch_event('change')
  page.locator('#command').click();page.wait_for_timeout(120)
  mid=[x['id'] for x in diagram['objects'] if x['type']=='morphism'][-1]
  assert page.locator(f'#drawing g[data-id="{mid}"] text tspan').all_text_contents()==['alpha  beta','gamma']
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled()
  svg=download(page,'SVG').read_text()
  assert 'alpha  beta' in svg and 'gamma' in svg
  page.locator('#export-open').click()
  final=json.loads(download(page,'JSON project').read_text())
  assert next(x['text'] for x in final['objects'] if x['id']==mid)=='alpha  beta\ngamma'
  assert not errors,errors
  print('CUT19_BROWSER_PASS multiline edit and SVG/JSON round-trip, exact wrapped spaces, offscreen culling, crossing morphism, searchable offscreen objects')
  browser.close()

if __name__=='__main__':run()
