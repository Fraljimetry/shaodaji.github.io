"""Cut24 on-screen diagram redraw-cost observations, not a frame-rate promise."""
from pathlib import Path
from statistics import median
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import json,random,os
ROOT=Path(__file__).resolve().parents[1]
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('dialog',lambda d:d.accept())
  html=inline_html().replace('initialise();\n</script>','initialise();\nwindow.__mi24Render=()=>{const t=performance.now();render();return performance.now()-t;};\n</script>')
  assert 'window.__mi24Render' in html
  page.set_content(html,wait_until='load')
  d=json.loads((ROOT/'examples/diagram-demo.json').read_text());d['objects']=[]
  d['settings'].update(grid=False,showAxes=False,showLabels=False)
  rng=random.Random(2424)
  style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
  for i in range(1,49):
   d['objects'].append(dict(id=f'o{i}',type='node',name=f'N{i}',xy=[rng.uniform(-9,9),rng.uniform(-6,6)],text=f'N{i}',fontSize=16,hidden=False,locked=False,style=style.copy()))
  for i in range(49,129):
   a,b=rng.sample(range(1,49),2)
   d['objects'].append(dict(id=f'o{i}',type='morphism',name=f'M{i}',refs=[f'o{a}',f'o{b}'],text='',routing='avoid',bend=0,hidden=False,locked=False,style=style.copy()))
  d['nextId']=129
  results={}
  for mode in ['avoid','avoid-crossings']:
   for o in d['objects'][48:]:o['routing']=mode
   page.locator('#open-file').set_input_files({'name':mode+'.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
   page.wait_for_timeout(130)
   for _ in range(3):page.evaluate('window.__mi24Render()')
   data=[round(page.evaluate('window.__mi24Render()'),2) for _ in range(12)]
   results[mode]={'raw_ms':data,'median_ms':round(median(data),2)}
  print('CUT24_PERFORMANCE '+json.dumps({'scene':'48 nodes + 80 labeled-empty morphisms, on/off-screen, random fixed seed 2424','warmups':3,'samples_per_mode':12,'provenance':'isolated Chromium synchronous SVG rebuild','results':results}))
  browser.close()
if __name__=='__main__':run()
