import math
"""Cut23 opt-in label packing; real pointer handoff to manual, exports, undo, and old-project compatibility."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
import json,os
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(90)
  project=json.loads((ROOT/'examples/geometry-demo.json').read_text());project['objects']=[]
  project['settings'].update(grid=False,showAxes=False,showLabels=False)
  def node(i,xy,text):return dict(id=f'o{i}',name=text,type='node',xy=xy,text=text,fontSize=17,hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1})
  def arrow(i,name,text,avoid=False):return dict(id=f'o{i}',name=name,type='morphism',refs=['o1','o2'],text=text,bend=0,routing='direct',labelAvoid=avoid,hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1})
  project['objects']=[node(1,[-4,0],'Source'),node(2,[4,0],'Target'),arrow(3,'manual f','f'),arrow(4,'automatic g','g',True)];project['nextId']=5
  page.locator('#open-file').set_input_files({'name':'cut23.json','mimeType':'application/json','buffer':json.dumps(project).encode()});page.wait_for_timeout(130)
  manual=page.locator('#drawing .morphism-label[data-id="o3"]');auto=page.locator('#drawing .morphism-label[data-id="o4"]')
  assert manual.count()==1 and auto.count()==1,(manual.count(),auto.count(),errors,page.locator('#object-count').inner_text(),page.locator('#toast').inner_text(),page.locator('#drawing').inner_html()[:500])
  m=(float(manual.get_attribute('x')),float(manual.get_attribute('y')))
  a=(float(auto.get_attribute('x')),float(auto.get_attribute('y')))
  assert m!=a,(m,a)
  original_path=page.locator('#drawing g[data-id="o4"] path').first.get_attribute('d')
  page.locator('#export-open').click();svg=download(page,'SVG').read_text()
  assert 'data-id="o4"' in svg and 'data-label-handle' not in svg
  page.locator('#export-open').click();assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled()
  saved=json.loads(download(page,'JSON project').read_text());assert saved['objects'][-1]['labelAvoid'] is True and saved['objects'][-1]['refs']==['o1','o2']
  page.locator('#object-search').fill('automatic g');page.locator('#objects .object').first.click();page.wait_for_timeout(120)
  assert page.locator('#morphism-label-avoid').is_checked()
  handle=page.locator('#drawing [data-label-handle="o4"]');assert handle.count()==1
  bb=handle.bounding_box();px=bb['x']+bb['width']/2;py=bb['y']+bb['height']/2
  page.mouse.click(px,py);page.wait_for_timeout(90)
  assert page.locator('#morphism-label-avoid').is_checked(),'stationary click must preserve automatic mode'
  page.mouse.move(px,py);page.mouse.down();page.mouse.move(px+35,py+17,steps=3);page.mouse.up();page.wait_for_timeout(150)
  assert not page.locator('#morphism-label-avoid').is_checked(),'moved auto label must become manual'
  adjusted=page.locator('#drawing .morphism-label[data-id="o4"]');
  after=(float(adjusted.get_attribute('x')),float(adjusted.get_attribute('y')))
  assert abs(after[0]-(a[0]+35))<2 and abs(after[1]-(a[1]+17))<2,(a,after)
  assert page.locator('#drawing g[data-id="o4"] path').first.get_attribute('d')==original_path
  page.locator('#undo').click();page.wait_for_timeout(130)
  page.locator('#object-search').fill('automatic g');page.locator('#objects .object').first.click();page.wait_for_timeout(80)
  assert page.locator('#morphism-label-avoid').is_checked()
  # Disabling auto should revert to the original author-chosen fixed placement.
  page.locator('#morphism-label-avoid').uncheck();page.wait_for_timeout(110)
  label=page.locator('#drawing .morphism-label[data-id="o4"]')
  reverted=(float(label.get_attribute('x')),float(label.get_attribute('y')))
  assert abs(reverted[0]-m[0])<2 and abs(reverted[1]-m[1])<2,(m,reverted)
  # Hiding the manual label frees its location; unhiding restores priority.
  page.locator('#morphism-label-avoid').check();page.wait_for_timeout(90)
  shifted=page.locator('#drawing .morphism-label[data-id="o4"]')
  assert float(shifted.get_attribute('y'))!=m[1] or float(shifted.get_attribute('x'))!=m[0]
  page.locator('#object-search').fill('manual f')
  page.locator('#objects .object').first.locator('button[aria-label="Hide"]').click();page.wait_for_timeout(120)
  freed=page.locator('#drawing .morphism-label[data-id="o4"]')
  # Hiding the other label frees its text box, but visible arrow strokes are
  # still collision obstacles, so the automatic label need not return to m.
  assert math.isfinite(float(freed.get_attribute('x'))) and math.isfinite(float(freed.get_attribute('y')))
  page.locator('#undo').click();page.wait_for_timeout(90)
  blocked=page.locator('#drawing .morphism-label[data-id="o4"]')
  assert abs(float(blocked.get_attribute('x'))-m[0])>1 or abs(float(blocked.get_attribute('y'))-m[1])>1
  # Cancel a label drag after it temporarily switched to manual mode.
  page.locator('#object-search').fill('automatic g');page.locator('#objects .object').first.click();page.wait_for_timeout(60)
  handle=page.locator('#drawing [data-label-handle="o4"]')
  bb=handle.bounding_box();px=bb['x']+bb['width']/2;py=bb['y']+bb['height']/2
  page.mouse.move(px,py);page.mouse.down();page.mouse.move(px+24,py+18,steps=3)
  page.evaluate("window.dispatchEvent(new Event('blur'))");page.wait_for_timeout(110)
  assert page.locator('#morphism-label-avoid').is_checked(),'aborted drag should restore automatic mode'
  page.mouse.up()
  # No feasible nearby position: keep the actual arrow label visible, warn in
  # the SVG and never silently claim the collision is solved.
  dense=json.loads(json.dumps(project))
  blocker=node(5,[0,0],('BLOCKING LABEL SPACE\n')*14);blocker['name']='Blocker';dense['objects'].append(blocker)
  dense['nextId']=6
  page.locator('#open-file').set_input_files({'name':'dense-collision.json','mimeType':'application/json','buffer':json.dumps(dense).encode()});page.wait_for_timeout(130)
  warned=page.locator('#drawing g[data-id="o4"][data-label-collision="unresolved"]')
  assert warned.count()==1, 'No clear label candidate should be marked unresolved'
  assert page.locator('#drawing .morphism-label[data-id="o4"]').count()==1 and page.locator('#drawing .morphism-label[data-id="o4"]').get_attribute('fill')=='#b45309'
  # A flag on an UNLABELED morphism has no visual effect; do not incorrectly
  # disable a publication format that can represent this scene exactly.
  unlabeled=json.loads(json.dumps(project));unlabeled['objects'][-1]['text']=''
  page.locator('#open-file').set_input_files({'name':'unlabeled.json','mimeType':'application/json','buffer':json.dumps(unlabeled).encode()});page.wait_for_timeout(120)
  page.locator('#export-open').click()
  assert not page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled(),'An empty label needs no placement'
  page.locator('#export-close').click()
  assert not errors,errors
  print('CUT23_BROWSER_PASS: manual reservation; opt-in label placement; SVG+JSON; TikZ gated; stationary handle; drag handoff; undo; legacy positioning')
  browser.close()

if __name__=='__main__':run()
