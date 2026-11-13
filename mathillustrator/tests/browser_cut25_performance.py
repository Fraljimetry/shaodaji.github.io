"""Cut25 bounded redraw observation, not a full-frame or production benchmark."""
from pathlib import Path
from statistics import median
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import json,os,random
ROOT=Path(__file__).resolve().parents[1]
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900});page.on('dialog',lambda d:d.accept())
  html=inline_html().replace('initialise();\n</script>','initialise();\nwindow.__mi25Render=()=>{const t=performance.now();render();return performance.now()-t;};\n</script>')
  assert 'window.__mi25Render' in html
  page.set_content(html,wait_until='load')
  d=json.loads((ROOT/'examples/diagram-demo.json').read_text());d['objects']=[]
  d['settings'].update(grid=False,showAxes=False,showLabels=False)
  style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
  # Spatially separated enough to permit alternative routes, but many crossing edges.
  for i in range(16):
   x=(i%4-1.5)*4;y=(i//4-1.5)*3
   d['objects'].append(dict(id=f'o{i+1}',type='node',name=f'N{i+1}',xy=[x,y],text=f'N{i+1}',fontSize=16,hidden=False,locked=False,style=style.copy()))
  rng=random.Random(2525);pairs=[]
  while len(pairs)<20:
   a,b=rng.sample(range(1,17),2)
   if (a,b) not in pairs:pairs.append((a,b))
  for i,(a,b) in enumerate(pairs,17):
   d['objects'].append(dict(id=f'o{i}',type='morphism',name=f'E{i}',refs=[f'o{a}',f'o{b}'],text='',routing='direct',bend=0,hidden=False,locked=False,style=style.copy()))
  d['nextId']=37
  data={}
  for mode in ('direct','scene-crossings'):
   for o in d['objects'][16:]:o['routing']=mode
   page.locator('#open-file').set_input_files({'name':mode+'.json','mimeType':'application/json','buffer':json.dumps(d).encode()});page.wait_for_timeout(120)
   for _ in range(3):page.evaluate('window.__mi25Render()')
   raw=[round(page.evaluate('window.__mi25Render()'),2) for _ in range(12)]
   data[mode]={'raw_ms':raw,'median_ms':round(median(raw),2)}
  print('CUT25_PERFORMANCE '+json.dumps({'scene':'16 nodes, 20 arrows (all visible), fixed seed 2525','scope':'isolated Chromium, SVG rebuild only; three warmups; 12 samples per mode','results':data}))
  browser.close()
if __name__=='__main__':run()
