"""Isolated Chrome cost of opt-in routing; excludes JSON import and repaint compositing."""
from pathlib import Path
from statistics import median
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import os,json,random
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1380,'height':860})
  page.on('dialog',lambda d:d.accept())
  html=inline_html().replace('initialise();\n</script>','initialise();\nwindow.__cut21Render=()=>{const t=performance.now();render();return performance.now()-t;};\n</script>')
  assert 'window.__cut21Render' in html
  page.set_content(html,wait_until='load')
  base=json.loads((ROOT/'examples/diagram-demo.json').read_text());base['objects']=[]
  base['settings'].update(grid=False,showAxes=False,showLabels=False)
  rng=random.Random(121)
  for i in range(1,321):
   base['objects'].append(dict(id=f'o{i}',type='node',name=f'N{i}',xy=[rng.uniform(-13,13),rng.uniform(-9,9)],text='N'+str(i),fontSize=16,hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}))
  for i in range(321,401):
   a,b=rng.sample(range(1,321),2)
   base['objects'].append(dict(id=f'o{i}',type='morphism',name=f'E{i}',refs=[f'o{a}',f'o{b}'],text='',bend=0,routing='direct',hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}))
  base['nextId']=401
  samples={}
  for mode in ('direct','avoid'):
   for e in base['objects'][320:]:e['routing']=mode
   page.locator('#open-file').set_input_files({'name':f'{mode}.json','mimeType':'application/json','buffer':json.dumps(base).encode()})
   page.wait_for_timeout(170)
   times=[]
   for _ in range(3):page.evaluate('window.__cut21Render()')
   for _ in range(11):times.append(page.evaluate('window.__cut21Render()'))
   samples[mode]={'raw_ms':[round(x,2) for x in times],'median_ms':round(median(times),2)}
  assert page.locator('#object-count').inner_text()=='400'
  browser.close()
  print('CUT21_PERFORMANCE',json.dumps({'workload':'320 diagram nodes + 80 morphisms (mixed on/offscreen); opt-in routing contrast; headless Chromium SVG rebuild only','samples':samples},indent=2))
if __name__=='__main__':run()
