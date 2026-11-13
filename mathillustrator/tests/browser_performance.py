"""Isolated Chromium performance probe, not cross-platform acceptance.
Scene uses simple point objects. Renderer-only and import-to-display times.
"""
from browser_smoke import inline_html, ROOT
from playwright.sync_api import sync_playwright
from pathlib import Path
import tempfile,json,time,os

def run():
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':900})
    page.on('dialog',lambda d:d.accept())
    page.set_content(inline_html());page.wait_for_timeout(80)
    for n in [100,1000,3000]:
      settings={'grid':False,'showAxes':False,'page':'infinite','snap':True,'snapStep':0.5,'correction':'medium','stroke':'#3657ad','fill':'#b6c9f9','opacity':1,'width':2,'pointSize':5,'background':'#ffffff','exportRegion':'viewport','showLabels':False,'snapAnchors':True,'modules':{'basic':True,'construction':True,'illustration':True,'diagram':True}}
      d={'format':'mathillustrator-project','version':1,'meta':{'title':'Perf '+str(n)},'settings':settings,'objects':[],'nextId':n+1}
      for i in range(n):
        d['objects'].append({'id':'o'+str(i+1),'type':'point','name':'P'+str(i),'hidden':False,'locked':False,'xy':[(i%100)/10,(i//100)/10],'style':{'stroke':'#3657ad','fill':'#b6c9f9','opacity':1,'width':2}})
      path=Path(tempfile.mkdtemp())/'scene.json';path.write_text(json.dumps(d),encoding='utf-8')
      t=time.perf_counter();page.locator('#open-file').set_input_files(path);page.wait_for_function(f"document.getElementById('object-count').textContent === '{n}'",timeout=30000)
      elapsed=(time.perf_counter()-t)*1000
      info=page.locator('#render-info').inner_text()
      print(json.dumps({'n':n,'import_to_object_count_ms':round(elapsed,1),'render_info':info,'nodes':page.locator('#drawing *').count()}))
    b.close()
if __name__=='__main__':run()
