"""Cut24 Chromium: crossing-aware routing, validation, undo and SVG/JSON fidelity.
Isolated page.set_content, not hosted website or cross-browser certification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download
import json,os
ROOT=Path(__file__).resolve().parents[1]
STYLE={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
def node(i,xy,name):return {'id':f'o{i}','name':name,'type':'node','xy':xy,'text':name,'fontSize':17,'hidden':False,'locked':False,'style':STYLE.copy()}
def arrow(i,refs,name,routing='direct'):
 return {'id':f'o{i}','name':name,'type':'morphism','refs':refs,'text':'f' if i==5 else 'g','routing':routing,'bend':0,'hidden':False,'locked':False,'style':STYLE.copy()}
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(90)
  project=json.loads((ROOT/'examples/geometry-demo.json').read_text())
  project['objects']=[node(1,[-3,0],'West'),node(2,[3,0],'East'),node(3,[0,-3],'South'),node(4,[0,3],'North'),arrow(5,['o1','o2'],'First'),arrow(6,['o3','o4'],'Second')]
  project['nextId']=7;project['settings'].update(grid=False,showAxes=False,showLabels=False)
  page.locator('#open-file').set_input_files({'name':'cut24.json','mimeType':'application/json','buffer':json.dumps(project).encode()});page.wait_for_timeout(120)
  assert page.locator('#drawing g[data-id="o6"][data-route-status="direct"]').count()==1
  # Use actual left panel property mode; no route selection on synthetic internals.
  page.locator('#object-search').fill('Second');page.locator('#objects .object').first.click();page.wait_for_timeout(80)
  assert page.locator('#morphism-routing').evaluate('(e)=>e.getBoundingClientRect().width')>190,'Routing choices need adequate Properties width'
  page.locator('#morphism-routing').select_option('avoid-crossings');page.wait_for_timeout(170)
  g=page.locator('#drawing g[data-id="o6"]');status=g.get_attribute('data-route-status')
  assert status=='routed',(status, g.inner_html(),errors)
  assert page.locator('#drawing g[data-id="o5"][data-route-status="direct"]').count()==1
  assert g.locator('path').first.get_attribute('d').count('L')>=2
  page.locator('#export-open').click()
  saved=json.loads(download(page,'JSON project').read_text())
  assert saved['objects'][-1]['routing']=='avoid-crossings' and saved['objects'][-1]['refs']==['o3','o4']
  page.locator('#export-open').click();assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled()
  svg=download(page,'SVG').read_text();assert 'data-route-status="routed"' in svg and 'o6' in svg and 'arrowhead' in svg
  page.locator('#undo').click();page.wait_for_timeout(95)
  assert page.locator('#drawing g[data-id="o6"][data-route-status="direct"]').count()==1
  page.locator('#redo').click();page.wait_for_timeout(95)
  assert page.locator('#drawing g[data-id="o6"][data-route-status="routed"]').count()==1
  # Hidden earlier arrow no longer participates in crossing reduction.
  page.locator('#object-search').fill('First');page.locator('#objects .object').first.locator('button[aria-label="Hide"]').click();page.wait_for_timeout(110)
  assert page.locator('#drawing g[data-id="o6"][data-route-status="clear"]').count()==1
  page.locator('#undo').click();page.wait_for_timeout(90)
  assert page.locator('#drawing g[data-id="o6"][data-route-status="routed"]').count()==1
  # Input validation must not accept invented routing modes.
  page.locator('#object-search').fill('Second');page.locator('#objects .object').first.click();page.wait_for_timeout(70)
  assert page.locator('#morphism-routing').input_value()=='avoid-crossings'
  invalid=json.loads(json.dumps(project));invalid['objects'][-1]['routing']='force-no-crossings'
  page.locator('#open-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()});page.wait_for_timeout(100)
  assert page.locator('#drawing g[data-id="o6"][data-route-status="routed"]').count()==1
  # Saturating route history must fail visibly rather than silently pretending
  # every arrow was checked. We use identical arrows to keep the fixture small.
  many=json.loads(json.dumps(project));many['objects']=many['objects'][:4]
  for i in range(5,137):
   a=arrow(i,['o1','o2'],f'Arrow {i}');a['text']='';many['objects'].append(a)
  last=arrow(137,['o3','o4'],'Limited','avoid-crossings');last['text']='g';many['objects'].append(last);many['nextId']=138
  page.locator('#open-file').set_input_files({'name':'capacity.json','mimeType':'application/json','buffer':json.dumps(many).encode()});page.wait_for_timeout(250)
  limited=page.locator('#drawing g[data-id="o137"]');assert limited.get_attribute('data-route-status')=='capacity'
  assert limited.locator('path').first.get_attribute('stroke')=='#b45309'
  assert not errors,errors
  print('CUT24_BROWSER_PASS: crossing route, unchanged legacy mode, hidden edge, undo/redo, SVG/JSON, TikZ gate, malformed import, capacity warning')
  browser.close()
if __name__=='__main__':run()
