"""Headless Chromium, fixed virtual mixed scene. No cross-device FPS claim."""
import sys,statistics,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright

def main(root):
 sys.path.insert(0,str(root/'tests'))
 from browser_smoke import inline_html
 html=inline_html().replace('initialise();\n</script>','''initialise();
window.__miPerfLoad=(source)=>{doc=validateDoc(source);renderAll();};
window.__miPerfRedraw=()=>{const t=performance.now();render();return performance.now()-t;};
</script>''')
 from copy import deepcopy
 d=json.loads((root/'examples/geometry-demo.json').read_text());d['objects']=[]
 d['settings']['grid']=False;d['settings']['showAxes']=False;d['settings']['showLabels']=False
 d['settings']['snapAnchors']=False
 style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
 k=0
 def point(x,y):
  nonlocal k
  k+=1;p={'id':f'o{k}','name':f'P{k}','type':'point','xy':[x,y],'hidden':False,'locked':False,'style':deepcopy(style)};d['objects'].append(p);return p['id']
 for i in range(1100):
  # Outside far upper right but still in finite numeric range.
  a=point(500+i*.1,600+i*.1);b=point(500.3+i*.1,600.2+i*.1)
  k+=1;d['objects'].append({'id':f'o{k}','name':f'S{k}','type':'segment','refs':[a,b],'hidden':False,'locked':False,'style':deepcopy(style)})
 for i in range(180):
  a=point(-4+(i%20)*.3,-2+(i//20)*.25);b=point(-3.9+(i%20)*.3,-1.9+(i//20)*.25)
  k+=1;d['objects'].append({'id':f'o{k}','name':f'V{k}','type':'segment','refs':[a,b],'hidden':False,'locked':False,'style':deepcopy(style)})
 d['nextId']=k+1
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda e: print('BROWSER_ERROR',str(e),file=sys.stderr))
  page.set_content(html,wait_until='load')
  page.evaluate('(d)=>window.__miPerfLoad(d)',d)
  for _ in range(3):page.evaluate('window.__miPerfRedraw()')
  times=[page.evaluate('window.__miPerfRedraw()') for _ in range(12)]
  count=page.locator('#drawing [data-id]').count()
  print(json.dumps({'scene_objects':len(d['objects']),'offscreen_segments':1100,'visible_segments':180,'svg_data_id_nodes':count,'median_ms':round(statistics.median(times),2),'range_ms':[round(min(times),2),round(max(times),2)],'all_ms':[round(x,2) for x in times]},indent=2))
  b.close()

if __name__=='__main__':main(Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1])
