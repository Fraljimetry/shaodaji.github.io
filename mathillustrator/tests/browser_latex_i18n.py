"""Isolated vector-math, export and locale regression. No hosted-site claim."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
from pathlib import Path
import json,os,re
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  page.wait_for_function("typeof MathJax?.tex2svg==='function'",timeout=10000)
  # Active UI contract: no preset selector is displayed. General tooling is
  # visible by default; tool groups remain independently hideable.
  assert page.locator('#preset').is_hidden()
  for group in ('basic','construction','illustration','diagram'):
   assert page.locator(f'[data-tool-module="{group}"]').is_visible(),group
  page.locator('[data-tool-module="construction"] > h3 > .section-toggle').click()
  assert page.locator('#construction-tools').is_hidden()
  page.locator('[data-tool-module="construction"] > h3 > .section-toggle').click()
  assert page.locator('#construction-tools').is_visible()
  baseline=json.loads((ROOT/'examples/diagram-demo.json').read_text())
  baseline['objects']=[{'id':'o1','name':'Node 1','type':'node','text':r'\frac{A_1}{B_2}', 'textMode':'latex','fontSize':19,'xy':[0,0],'hidden':False,'locked':False,'style':{'stroke':'#263342','fill':'#ffffff','width':2,'opacity':1}},
       {'id':'o2','name':'Node 2','type':'node','text':r'\sqrt{x^2+y^2}','textMode':'latex','fontSize':19,'xy':[4,0],'hidden':False,'locked':False,'style':{'stroke':'#263342','fill':'#ffffff','width':2,'opacity':1}},
       {'id':'o3','name':'Arrow','type':'morphism','text':r'f\circ g','textMode':'latex','refs':['o1','o2'],'hidden':False,'locked':False,'style':{'stroke':'#263342','fill':'#ffffff','width':2,'opacity':1}},
       {'id':'o4','name':'Repeated math','type':'node','text':r'\frac{A_1}{B_2}','textMode':'latex','fontSize':19,'xy':[0,-3],'hidden':False,'locked':False,'style':{'stroke':'#263342','fill':'#ffffff','width':2,'opacity':1}}]
  baseline['nextId']=5;baseline['settings'].update(grid=False,showAxes=False)
  page.locator('#open-file').set_input_files({'name':'latex.json','mimeType':'application/json','buffer':json.dumps(baseline).encode()})
  page.wait_for_timeout(150)
  assert page.locator('#object-count').inner_text()=='4',page.locator('#toast').inner_text()
  assert page.locator('#drawing svg[viewBox]').count()>=3,'MathJax vector glyphs must be visible'
  assert page.locator('#drawing [data-mjx-error]').count()==0
  assert page.locator('#drawing text').filter(has_text='⚠ TeX').count()==0
  # Unbordered node must still be selectable and draggable on the canvas.
  target=page.locator('#drawing g[data-id="o1"] rect[data-id="o1"]')
  assert target.count()==1 and target.get_attribute('fill')=='transparent'
  target.click(force=True)
  assert page.locator('#objects .object.selected').count()==1
  assert page.locator('#objects .object.selected').get_attribute('data-id')=='o1'
  # Same SVG math must be present in exported document; raster must decode.
  page.locator('#export-open').click();svg=download(page,'SVG').read_text()
  assert '<path' in svg and '<defs>' in svg and 'MJX-' in svg and 'data-mjx-error' not in svg
  ids=re.findall(r'\bid="(mi-math-[^" ]+)"',svg)
  assert ids and len(ids)==len(set(ids)), 'Repeated LaTeX labels must not duplicate SVG glyph IDs'
  page.locator('#export-open').click();png=download(page,'PNG').read_bytes()
  assert png[:8]==b'\x89PNG\r\n\x1a\n' and len(png)>1500
  page.locator('#ui-language').select_option('zh')
  assert page.locator('#mode-label').inner_text().strip().startswith('移动')
  assert len(page.locator('#mode-label').inner_text())<20
  assert 'Drag objects' in page.locator('#mode-label').get_attribute('title')
  assert page.locator('.panelhead h2').first.inner_text().startswith('对象')
  assert page.locator('#object-search-toggle').get_attribute('title')=='查找对象'
  assert page.locator('#drawing svg[viewBox]').count()>=3
  page.locator('#ui-language').select_option('en')
  assert page.locator('#mode-label').inner_text().strip().startswith('Move')
  assert page.locator('#object-search-toggle').get_attribute('title')=='Find objects'
  # Invalid TeX source in editor: rejected instead of being committed.
  page.locator('#object-search').fill('Node 1');page.locator('#objects .object').first.click()
  tex=page.locator('#properties textarea').first
  tex.fill(r'\not_a_real_macro');tex.dispatch_event('change')
  page.wait_for_timeout(100)
  page.locator('#export-open').click();d=json.loads(download(page,'JSON project').read_text())
  assert d['objects'][0]['text']==r'\frac{A_1}{B_2}'
  # Cross-document old plain text is still a native SVG text node, not TeX.
  d['objects'][0].pop('textMode');d['objects'][0]['text']='Existing plain label'
  page.locator('#open-file').set_input_files({'name':'legacy.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
  page.wait_for_timeout(120)
  assert page.locator('#drawing text').filter(has_text='Existing plain label').count()==1
  assert not errors,errors
  print('LATEX_I18N_BROWSER_PASS: offline vector typesetting, SVG/PNG, Chinese toggle, invalid-input rollback, legacy compatibility')
  browser.close()
if __name__=='__main__':run()
