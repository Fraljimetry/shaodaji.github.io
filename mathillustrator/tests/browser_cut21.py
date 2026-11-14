"""Cut 21: real isolated-Chromium routing, manual label position, export gating and undo."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
import os,json
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1380,'height':860},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(130)
  d=json.loads((ROOT/'examples/geometry-demo.json').read_text());d['objects']=[]
  d['settings'].update(grid=False,showAxes=False,showLabels=False)
  def obj(i,t,xy,txt):return dict(id=f'o{i}',type=t,name=txt,xy=xy,text=txt,fontSize=17,hidden=False,locked=False,
      style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1})
  d['objects']=[obj(1,'node',[-5,0],'Left'),obj(2,'node',[5,0],'Right'),obj(3,'node',[0,0],'Blocker'),
   dict(id='o4',type='morphism',name='arrow f',refs=['o1','o2'],text='f',bend=0,routing='avoid',
       hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1})]
  d['nextId']=5
  page.locator('#open-file').set_input_files({'name':'routed.json','mimeType':'application/json','buffer':json.dumps(d).encode()})
  page.wait_for_timeout(140)
  routed=page.locator('#drawing g[data-id="o4"][data-route-status="routed"]')
  assert routed.count()==1, 'Blocked straight edge should route around the intervening node'
  assert routed.locator('path').first.get_attribute('d').count('L')>=2
  initial_label=page.locator('#drawing .morphism-label[data-id="o4"]').get_attribute('x')
  page.locator('#object-search').fill('arrow f');page.locator('#objects .object').first.click()
  assert page.locator('#morphism-routing').input_value()=='avoid'
  label_shift=page.get_by_label('Label shift X (px)')
  label_shift.fill('48');label_shift.dispatch_event('change');page.wait_for_timeout(100)
  shifted=float(page.locator('#drawing .morphism-label[data-id="o4"]').get_attribute('x'))
  assert shifted>float(initial_label)+45,(initial_label,shifted)
  pos=page.get_by_label('Label position')
  pos.fill('0.2');pos.dispatch_event('change');page.wait_for_timeout(100)
  assert page.locator('#drawing .morphism-label[data-id="o4"]').count()==1
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(), 'Restricted TikZ cannot preserve screen-space routes'
  svg=download(page,'SVG').read_text();assert 'data-route-status="routed"' in svg and 'data-id="o4"' in svg
  page.locator('#export-open').click()
  out=json.loads(download(page,'JSON project').read_text());edge=out['objects'][-1]
  assert edge['routing']=='avoid' and edge['labelDx']==48 and edge['labelT']==.2
  assert edge['refs']==['o1','o2'] and [o['xy'] for o in out['objects'][:3]]==[[-5,0],[5,0],[0,0]]
  # Turning off routing must restore the original quadratic form; undo restores the detour.
  page.locator('#morphism-routing').select_option('direct');page.wait_for_timeout(100)
  assert page.locator('#drawing g[data-id="o4"] path').first.get_attribute('d').count('Q')==1
  page.locator('#undo').click();page.wait_for_timeout(100)
  assert page.locator('#drawing g[data-id="o4"]').get_attribute('data-route-status')=='routed'
  # Hiding an intervening node unblocks the route. It cannot be a phantom obstacle.
  page.locator('#object-search').fill('Blocker');page.locator('#objects .object').first.locator('button[aria-label="Hide"]').click();page.wait_for_timeout(90)
  assert page.locator('#drawing g[data-id="o4"]').get_attribute('data-route-status')=='clear'
  page.locator('#undo').click();page.wait_for_timeout(100)
  assert page.locator('#drawing g[data-id="o4"]').get_attribute('data-route-status')=='routed'
  # Invalid properties cannot leave an altered drawing or an extra undo step.
  page.locator('#object-search').fill('arrow f');page.locator('#objects .object').first.click()
  pos=page.get_by_label('Label position');pos.fill('8');pos.dispatch_event('change')
  assert float(page.get_by_label('Label position').input_value())==.2
  assert not errors,errors
  print('CUT21_BROWSER_PASS: route around node; label shift/position; SVG+JSON fidelity; TikZ gating; undo; hidden obstacle; rejected property')
  browser.close()

if __name__=='__main__':run()
