"""Measured Cut 18/19 offscreen text/diagram renderer comparison.
Use optional ROOT argument to run exactly the same scene against any cut.
This is isolated Chromium SVG-rebuild latency, not frame rate, page-load speed
or export encoding. Report all observations, not only the fastest.
"""
from pathlib import Path
import sys, json, os, statistics
from playwright.sync_api import sync_playwright

def main(root):
 sys.path.insert(0,str(root/'tests'))
 from browser_smoke import inline_html
 html=inline_html().replace('initialise();\n</script>','''initialise();
 window.__miPerfLoad=(value)=>{doc=validateDoc(value);renderAll();};
 window.__miPerfRedraw=()=>{const start=performance.now();render();return performance.now()-start;};
 </script>''')
 doc=json.loads((root/'examples/diagram-demo.json').read_text());doc['objects']=[]
 doc['settings']['grid']=False;doc['settings']['showAxes']=False
 style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
 def add(type_,x,y,text):
  i=len(doc['objects'])+1
  doc['objects'].append({'id':f'o{i}','name':f'O{i}','type':type_,'xy':[x,y],'text':text,'fontSize':17,'hidden':False,'locked':False,'style':style.copy()})
 # 2,400 nonvisible mathematical labels, 120 visible labels.
 for i in range(2400):add('node' if i%2==0 else 'text',300+i*.04,200+i*.03,f'Object_{i} with label')
 for i in range(120):add('node' if i%2==0 else 'text',-4+(i%12)*.75,-2+(i//12)*.4,f'Visible_{i}')
 doc['nextId']=len(doc['objects'])+1
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1350,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  page.evaluate('(d)=>window.__miPerfLoad(d)',doc)
  for _ in range(4):page.evaluate('window.__miPerfRedraw()')
  times=[page.evaluate('window.__miPerfRedraw()') for _ in range(12)]
  result={'cut':root.name,'objects':len(doc['objects']),'offscreen_labels':2400,'on_screen_labels':120,'dom_data_id':page.locator('#drawing [data-id]').count(),'median_ms':round(statistics.median(times),3),'min_ms':round(min(times),3),'max_ms':round(max(times),3),'samples_ms':[round(x,3) for x in times],'browser_page_errors':errors}
  print(json.dumps(result,indent=2))
  assert not errors,errors
  browser.close()

if __name__=='__main__':main(Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1])
