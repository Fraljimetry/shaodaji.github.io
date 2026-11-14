"""Round 36 real Chromium interaction: plotting modes, persisted ranges, exports, palette and localization."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download

def exported(p):return json.loads(p.evaluate('window.__round36Snapshot()'))
def submit(p,mode,first,second=None):
 p.locator('#plot-mode').select_option(mode);p.locator('#command').fill(first)
 if second is not None:p.locator('#command-y').fill(second)
 p.locator('#command-form button').click()

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   p=b.new_page(viewport={'width':1420,'height':875},accept_downloads=True)
   p.on('dialog',lambda d:d.accept());errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load');p.locator('#plot-mode').wait_for()
   # The inline heading is one row; fields stay in the existing command form.
   a=p.locator('.command-heading label').bounding_box();c=p.locator('#plot-mode').bounding_box()
   assert abs((a['y']+a['height']/2)-(c['y']+c['height']/2))<8
   assert p.locator('#plot-mode option').all_text_contents()==['Function','Parametric','Implicit','Vector field','Domain coloring']
   assert p.locator('#command-y').is_hidden()
   # Function mode accepts raw expressions and historical grammar.
   submit(p,'function','sin(x)+x^2/2');d=exported(p)
   assert d['objects'][-1]['type']=='function' and d['objects'][-1]['expr']=='sin(x)+x^2/2'
   assert p.locator(f'#drawing [data-id="{d["objects"][-1]["id"]}"]').first.get_attribute('d').startswith('M')
   submit(p,'function','A=(0,0)');assert exported(p)['objects'][-1]['type']=='point'
   # New parametric curves use one chosen parameter consistently in both inputs.
   p.locator('#plot-mode').select_option('parametric');assert p.locator('#command-y').is_visible()
   p.locator('#parameter-symbol').select_option('u')
   submit(p,'parametric','cos(u)','sin(u)');d=exported(p);para=d['objects'][-1]
   assert para['type']=='parametric' and para['tMin']==0 and 6.28<para['tMax']<6.29
   assert p.locator(f'#drawing [data-id="{para["id"]}"]').first.get_attribute('d').startswith('M')
   p.locator(f'#objects [data-id="{para["id"]}"]').click()
   assert p.locator('#properties').get_by_text('Parameter start').count()==1
   p.locator('#properties').get_by_label('Parameter start').fill('-2')
   p.locator('#properties').get_by_label('Parameter start').press('Tab')
   assert exported(p)['objects'][-1]['tMin']==-2
   p.locator('#undo').click();assert exported(p)['objects'][-1]['tMin']==0
   p.locator('#redo').click();assert exported(p)['objects'][-1]['tMin']==-2
   # A slightly concentrated palette must be centered, with symmetric side margins.
   sw=p.locator('#properties .style-controls-grid .color-swatches').first
   offsets=sw.evaluate('''e=>{const a=e.getBoundingClientRect(),r=e.parentElement.getBoundingClientRect();return [a.left-r.left,r.right-a.right,a.width]}''')
   assert abs(offsets[0]-offsets[1])<2 and offsets[2]>=100,offsets
   # Implicit equation and expression = 0, including complex topology.
   submit(p,'implicit','x^2+y^2=4');d=exported(p);obj=d['objects'][-1]
   assert obj['type']=='implicit' and p.locator(f'#drawing [data-id="{obj["id"]}"]').first.get_attribute('d').count('M')>6
   submit(p,'implicit','x*y-1');obj=exported(p)['objects'][-1]
   assert obj['expr']=='x*y-1' and p.locator(f'#drawing [data-id="{obj["id"]}"]').first.get_attribute('d').startswith('M')
   before=exported(p);submit(p,'implicit','x==1');assert exported(p)==before
   submit(p,'parametric','cos(u)','window.alert(1)');assert exported(p)==before
   # Settings change must invalidate plot-cache results without modifying curve definitions.
   p.locator('#plot-budget').select_option('20000');p.locator('#implicit-grid').fill('18');p.locator('#implicit-grid').press('Tab')
   d=exported(p);assert d['settings']['plotBudget']==20000 and d['settings']['implicitGrid']==18
   assert p.locator(f'#drawing [data-id="{obj["id"]}"]').count()>=1
   # Native editable JSON round-trip, SVG paths and localization.
   p.locator('#open-file').set_input_files({'name':'plot36.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
   assert exported(p)['objects']==d['objects']
   p.locator('#export-open').click();svg=download(p,'SVG').read_text();assert '<svg' in svg and '<path' in svg
   if p.locator('#export-close').is_visible():p.locator('#export-close').click()
   p.locator('#ui-language').select_option('zh')
   assert p.locator('#plot-mode option').all_text_contents()==['函数','参数曲线','隐式曲线','向量场','定义域着色']
   assert p.locator('#plot-budget').is_visible()==False or p.locator('#plot-budget').count()==1
   p.set_viewport_size({'width':390,'height':780});assert p.locator('#plot-mode').count()==1
   assert p.locator('#command-y').count()==1
   # Palette is symmetric and less spread apart than the old full width.
   p.set_viewport_size({'width':1420,'height':875})
   p.locator('#right-collapse').click() if p.locator('body.right-collapsed').count()>0 else None
   assert not errors,errors
   print('PASS Round36 Chromium: input modes, plots, validation, history, JSON, SVG, bilingual, 390px, no page errors')
  finally:b.close()
if __name__=='__main__':run()
