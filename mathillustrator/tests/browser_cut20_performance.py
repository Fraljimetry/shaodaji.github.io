"""Isolated Chromium paired redraw benchmark for dense visible point names.
Report total synchronous button action cost, not FPS or cross-browser speed.
"""
import json,os,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':920})
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  doc=json.loads((ROOT/'examples/geometry-demo.json').read_text());doc['objects']=[]
  for i in range(1500):
   x=-4+(i%50)*.16;y=-3+(i//50)*.20
   doc['objects'].append(dict(id=f'o{i+1}',name=f'P{i+1}',type='point',xy=[x,y],hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1,'pointSize':4}))
  doc['nextId']=1501;doc['settings']['grid']=False;doc['settings']['showAxes']=False;doc['settings']['showLabels']=True
  page.locator('#open-file').set_input_files({'name':'dense.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
  page.wait_for_timeout(200)
  measurements={}
  for mode in ['standard','avoid']:
   page.locator('#label-placement').select_option(mode);page.wait_for_timeout(150)
   # A reset to exactly the same view forces a true full SVG rebuild.
   times=page.evaluate('''() => {
    const b=document.getElementById('zoom-reset'),a=[];
    for(let i=0;i<17;i++) {let t=performance.now();b.click();let dt=performance.now()-t;if(i>=4)a.push(dt);}
    return a;
   }''')
   measurements[mode]={'ms':times,'median_ms':statistics.median(times),'min_ms':min(times),'max_ms':max(times)}
  assert page.locator('#drawing text').count()==1500
  assert page.locator('#object-count').inner_text()=='1500'
  print(json.dumps({'scene':'1500 points and labels fully in viewport, fixed Chromium and viewport','measurements':measurements,'note':'Synchronous zoom-reset button and SVG rebuild, excludes browser composite, font rasterization, import/autosave and end-to-end frame rate'},indent=2))
  browser.close()

if __name__=='__main__':run()
