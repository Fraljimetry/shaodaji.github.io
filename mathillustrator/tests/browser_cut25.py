"""Cut25: opt-in scene-aware routing; isolated Chromium, not a hosted deployment."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download
import json,os
ROOT=Path(__file__).resolve().parents[1]
STYLE={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1}
def node(i,xy,name):return {'id':f'o{i}','name':name,'type':'node','xy':xy,'text':name,'fontSize':17,'hidden':False,'locked':False,'style':STYLE.copy()}
def arrow(i,refs,mode,name):return {'id':f'o{i}','name':name,'type':'morphism','refs':refs,'text':'f' if i==5 else 'g','routing':mode,'bend':0,'hidden':False,'locked':False,'style':STYLE.copy()}
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(100)
  d=json.loads((ROOT/'examples/diagram-demo.json').read_text());d['objects']=[
    node(1,[0,-3],'South'),node(2,[0,3],'North'),node(3,[-4,0],'West'),node(4,[4,0],'East'),
    arrow(5,['o1','o2'],'scene-crossings','First'),arrow(6,['o3','o4'],'direct','Last')]
  d['nextId']=7;d['settings'].update(grid=False,showAxes=False,showLabels=False)
  def open_project(project,name):
   page.locator('#open-file').set_input_files({'name':name+'.json','mimeType':'application/json','buffer':json.dumps(project).encode()});page.wait_for_timeout(130)
  open_project(d,'cut25');first=page.locator('#drawing g[data-id="o5"]')
  assert first.get_attribute('data-route-status')=='routed',(first.get_attribute('data-route-status'),errors)
  assert first.locator('path').first.get_attribute('d').count('L')>=2
  assert page.locator('#drawing g[data-id="o6"][data-route-status="direct"]').count()==1
  page.locator('#object-search').fill('First');page.locator('#objects .object').first.click();page.wait_for_timeout(70)
  assert page.locator('#morphism-routing').input_value()=='scene-crossings'
  page.locator('#export-open').click();j=json.loads(download(page,'JSON project').read_text());assert j['objects'][4]['routing']=='scene-crossings'
  page.locator('#export-open').click();assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled()
  svg=download(page,'SVG').read_text();assert 'data-route-status="routed"' in svg
  page.locator('#object-search').fill('Last');page.locator('#objects .object').first.locator('button[aria-label="Hide"]').click();page.wait_for_timeout(95)
  assert first.get_attribute('data-route-status')=='clear'
  page.locator('#undo').click();page.wait_for_timeout(95)
  assert first.get_attribute('data-route-status')=='routed'
  page.locator('#redo').click();page.wait_for_timeout(95)
  assert first.get_attribute('data-route-status')=='clear'
  # Repeated redraws must be deterministic, not flip between corridors.
  old_path=first.locator('path').first.get_attribute('d')
  for _ in range(3):page.locator('#object-search').fill('First');page.locator('#objects .object').first.click();page.wait_for_timeout(60)
  assert first.locator('path').first.get_attribute('d')==old_path
  # Capacity warning: the 49th visible edge cannot trigger unbounded work.
  many=json.loads(json.dumps(d));many['objects']=many['objects'][:4]
  for i in range(5,54):many['objects'].append(arrow(i,['o1','o2'],'scene-crossings' if i==5 else 'direct','Arrow '+str(i)))
  many['nextId']=54;open_project(many,'cap')
  limited=page.locator('#drawing g[data-id="o5"]');assert limited.get_attribute('data-route-status')=='capacity'
  assert limited.locator('path').first.get_attribute('stroke')=='#b45309'
  # Invalid enum is refused; existing drawing is retained.
  invalid=json.loads(json.dumps(d));invalid['objects'][4]['routing']='force-global'
  open_project(invalid,'bad');assert limited.get_attribute('data-route-status')=='capacity'
  assert not errors,errors
  print('CUT25_BROWSER_PASS: later-edge reroute, legacy preservation, Undo/Redo, SVG/JSON/TikZ gate, capacity warning, invalid import')
  browser.close()
if __name__=='__main__':run()
