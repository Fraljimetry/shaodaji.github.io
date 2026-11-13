"""Cut23 costs of opt-in morphism-label avoidance in a visible mixed diagram.
SVG rebuild only; no compositor, fonts cross-browser, or hosted-site claims.
"""
from pathlib import Path
from statistics import median
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import os,json,random
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':900})
  page.on('dialog',lambda d:d.accept())
  html=inline_html().replace('initialise();\n</script>','initialise();\nwindow.__mi23Render=()=>{const t=performance.now();render();return performance.now()-t;};\n</script>')
  assert 'window.__mi23Render' in html
  page.set_content(html,wait_until='load')
  template=json.loads((ROOT/'examples/diagram-demo.json').read_text());template['objects']=[]
  template['settings'].update(grid=False,showAxes=False,showLabels=False)
  rng=random.Random(2301)
  for i in range(1,181):
   template['objects'].append(dict(id=f'o{i}',type='node',name=f'N{i}',xy=[rng.uniform(-8,8),rng.uniform(-6,6)],text='N'+str(i),fontSize=16,hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}))
  for i in range(181,261):
   a,b=rng.sample(range(1,181),2)
   template['objects'].append(dict(id=f'o{i}',type='morphism',name=f'E{i}',refs=[f'o{a}',f'o{b}'],text='f'+str(i),bend=0,routing='direct',hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}))
  template['nextId']=261
  results={}
  for mode in ['manual','auto']:
   for e in template['objects'][180:]:e['labelAvoid']=mode=='auto'
   page.locator('#open-file').set_input_files({'name':f'perf-{mode}.json','mimeType':'application/json','buffer':json.dumps(template).encode()})
   page.wait_for_timeout(110)
   assert page.locator('#object-count').inner_text()=='260'
   for _ in range(3):page.evaluate('window.__mi23Render()')
   times=[page.evaluate('window.__mi23Render()') for _ in range(12)]
   results[mode]={'raw_ms':[round(t,2) for t in times],'median_ms':round(median(times),2)}
  print('CUT23_PERFORMANCE',json.dumps({'workload':'180 nodes, 80 labeled direct morphisms on mixed on/offscreen diagram; warmups=3, measurements=12','provenance':'headless Chromium isolated HTML SVG rebuild only','results':results},indent=2))
  browser.close()
if __name__=='__main__':run()
