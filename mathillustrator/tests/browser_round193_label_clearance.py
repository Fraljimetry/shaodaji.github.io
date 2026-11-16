"""Round193 actual Chromium: auto labels have a visible gap and can be toggled off."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]
style={'stroke':'#111111','fill':'#ffffff','width':1,'opacity':1}
d=json.loads((ROOT/'examples/geometry-demo.json').read_text())
d['objects']=[
 dict(id='o1',name='A',type='node',xy=[-3,0],text='A',textMode='plain',style=style,hidden=False,locked=False),
 dict(id='o2',name='B',type='node',xy=[3,0],text='B',textMode='plain',style=style,hidden=False,locked=False),
 dict(id='o3',name='Arrow',type='morphism',refs=['o1','o2'],bend=0,morphismHeads='end',morphismLine='solid',text='f',textMode='plain',labelDistance=10,labelAvoid=True,style=style,hidden=False,locked=False)
]
d['nextId']=4
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=browser.new_page(viewport={'width':1500,'height':850})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda dialog:dialog.accept())
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  page.locator('#open-file').set_input_files({'name':'labels.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
  def position():
   return page.locator('#drawing [data-id="o3"].morphism-label').evaluate('e => [Number(e.getAttribute("x")),Number(e.getAttribute("y"))]')
  toggle=page.locator('#auto-diagram-labels')
  toggle.uncheck();page.wait_for_timeout(150);without=position()
  toggle.check();page.wait_for_timeout(150);with_auto=position()
  assert abs(with_auto[1]-without[1])>=3,(without,with_auto)
  assert abs(with_auto[0]-without[0])<1,(without,with_auto)
  toggle.uncheck();page.wait_for_timeout(150);again=position()
  assert again==without,(without,again)
  assert not errors,errors
  print('ROUND193_CHROMIUM_PASS: real editor auto on/off, visible glyph clearance, stable manual layout')
 finally:browser.close()
