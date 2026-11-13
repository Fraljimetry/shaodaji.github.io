"""Cut22 real pointer interaction on an isolated Chromium editor, including rollback and export exclusion."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,download
import json,os
ROOT=Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1380,'height':850},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(130)
  project=json.loads((ROOT/'examples/geometry-demo.json').read_text());project['objects']=[]
  project['settings'].update(grid=False,showAxes=False,showLabels=False)
  def node(i,xy,text):return dict(id=f'o{i}',name=text,type='node',xy=xy,text=text,fontSize=17,hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1})
  project['objects']=[node(1,[-4,0],'Source'),node(2,[4,0],'Target'),dict(id='o3',name='f arrow',type='morphism',refs=['o1','o2'],text='f',bend=0,routing='direct',hidden=False,locked=False,style={'stroke':'#3657ad','fill':'#ffffff','width':2,'opacity':1})];project['nextId']=4
  page.locator('#open-file').set_input_files({'name':'cut22.json','mimeType':'application/json','buffer':json.dumps(project).encode()});page.wait_for_timeout(100)
  page.locator('#object-search').fill('f arrow');page.locator('#objects .object').first.click();page.wait_for_timeout(110)
  handle=page.locator('#drawing [data-label-handle="o3"]');assert handle.count()==1,'selected labeled edge should expose draggable handle'
  initial=page.locator('#drawing g[data-id="o3"] path').first.get_attribute('d')
  x=float(handle.get_attribute('cx'));y=float(handle.get_attribute('cy'));bbox=page.locator('#drawing').bounding_box();px=bbox['x']+x;py=bbox['y']+y
  page.mouse.move(px,py);page.mouse.down();page.mouse.move(px+47,py+26,steps=4);page.wait_for_timeout(130)
  during=float(page.locator('#drawing g[data-id="o3"] text').get_attribute('x'))
  page.mouse.up();page.wait_for_timeout(140)
  dx=page.get_by_label('Label shift X (px)').input_value();dy=page.get_by_label('Label shift Y (px)').input_value()
  assert abs(float(dx)-47)<=1 and abs(float(dy)-26)<=1,(dx,dy)
  assert page.locator('#drawing g[data-id="o3"] path').first.get_attribute('d')==initial, 'drag must not change underlying graph or route'
  assert during>0
  page.locator('#export-open').click();svg=download(page,'SVG').read_text();assert 'data-label-handle' not in svg,'editing affordance must not appear in exported SVG'
  page.locator('#undo').click();page.wait_for_timeout(110)
  page.locator('#object-search').fill('f arrow');page.locator('#objects .object').first.click();page.wait_for_timeout(60)
  assert float(page.get_by_label('Label shift X (px)').input_value())==0
  page.locator('#redo').click();page.wait_for_timeout(110)
  page.locator('#object-search').fill('f arrow');page.locator('#objects .object').first.click();page.wait_for_timeout(60)
  assert abs(float(page.get_by_label('Label shift X (px)').input_value())-47)<=1
  # Interrupted gesture must restore original committed offsets with no extra history.
  handle=page.locator('#drawing [data-label-handle="o3"]');x=float(handle.get_attribute('cx'));y=float(handle.get_attribute('cy'));bbox=page.locator('#drawing').bounding_box()
  px=bbox['x']+x;py=bbox['y']+y
  page.mouse.move(px,py);page.mouse.down();page.mouse.move(px+70,py+20,steps=4);page.wait_for_timeout(90)
  page.evaluate("window.dispatchEvent(new Event('blur'))");page.wait_for_timeout(100)
  assert abs(float(page.get_by_label('Label shift X (px)').input_value())-47)<=1,'blur should roll back preview'
  page.mouse.up()
  page.locator('#undo').click();page.wait_for_timeout(100)
  page.locator('#object-search').fill('f arrow');page.locator('#objects .object').first.click();page.wait_for_timeout(60)
  assert float(page.get_by_label('Label shift X (px)').input_value())==0,'aborted drag must not consume Undo history'
  # Locked morphisms should not expose editing handles.
  page.locator('#object-search').fill('f arrow');page.locator('#objects .object').first.locator('button[aria-label="Lock"]').click();page.wait_for_timeout(100)
  assert page.locator('#drawing [data-label-handle]').count()==0
  # A stationary click must not round non-tenth legacy offsets; modifier-click
  # remains an overlap-selection gesture rather than a hidden label edit.
  new_project=json.loads(json.dumps(project))
  new_project['objects'][-1]['labelDx']=2.25
  new_project['objects'][-1]['labelDy']=-0.125
  page.locator('#open-file').set_input_files({'name':'fractional.json','mimeType':'application/json','buffer':json.dumps(new_project).encode()});page.wait_for_timeout(110)
  page.locator('#object-search').fill('f arrow');page.locator('#objects .object').first.click();page.wait_for_timeout(60)
  handle=page.locator('#drawing [data-label-handle="o3"]');x=float(handle.get_attribute('cx'));y=float(handle.get_attribute('cy'));bbox=page.locator('#drawing').bounding_box()
  px=bbox['x']+x;py=bbox['y']+y
  page.mouse.click(px,py);page.wait_for_timeout(70)
  page.keyboard.down('Control');page.mouse.click(px,py);page.keyboard.up('Control');page.wait_for_timeout(70)
  page.locator('#save').click()
  page.locator('#export-open').click()
  saved=json.loads(download(page,'JSON project').read_text())['objects'][-1]
  assert saved['labelDx']==2.25 and saved['labelDy']==-.125,saved
  assert not errors,errors
  print('CUT22_BROWSER_PASS: pointer label drag; visual preview; single undo; cancelled drag; SVG exclusion; locked handle; no pageerrors')
  browser.close()
if __name__=='__main__':run()
