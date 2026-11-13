"""Cut05 object list virtualization: scrolling, search, selection, schema and undo."""
from browser_smoke import inline_html,download
from playwright.sync_api import sync_playwright
from pathlib import Path
import tempfile,json,os

def project(page):return json.loads(download(page,'Save').read_text())
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':850},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html());page.wait_for_timeout(90)
  # Off-screen objects are still in the model and searchable.
  d={'format':'mathillustrator-project','version':1,'meta':{'title':'Long list'},'settings':{'grid':False,'showAxes':False,'page':'infinite','snap':True,'snapStep':.5,'correction':'off','stroke':'#3657ad','fill':'#b6c9f9','opacity':1,'width':2,'pointSize':5,'background':'#ffffff','exportRegion':'viewport','showLabels':False,'snapAnchors':True,'modules':{'basic':True,'construction':True,'illustration':True,'diagram':True}},'objects':[],'nextId':3001}
  for i in range(1,3001):d['objects'].append({'id':f'o{i}','type':'point','name':f'POINT_{i}','hidden':False,'locked':False,'xy':[i*.01,i*.01],'style':{'stroke':'#3657ad','fill':'#b6c9f9','opacity':1,'width':2}})
  path=Path(tempfile.mkdtemp())/'scene.json';path.write_text(json.dumps(d))
  page.locator('#open-file').set_input_files(path)
  page.wait_for_function("document.getElementById('object-count').textContent==='3000'")
  assert page.locator('#objects .object').count()<100, 'Object window is not bounded'
  assert page.locator('#objects .object[data-id="o3000"]').count()==1, 'Newest item missing from top'
  page.locator('#objects').evaluate('(e)=>e.scrollTop=e.scrollHeight')
  page.wait_for_timeout(150)
  assert page.locator('#objects .object[data-id="o1"]').count()==1, 'Oldest item unreachable at bottom'
  assert page.locator('#objects .object').count()<100
  page.locator('#objects .object[data-id="o1"]').click()
  assert page.locator('#properties input[type=text]').first.input_value()=='POINT_1'
  page.locator('#show-hidden').uncheck()
  page.locator('#objects').evaluate('(e)=>e.scrollTop=e.scrollHeight')
  page.wait_for_timeout(100)
  page.locator('#objects .object[data-id="o1"] button').first.click() # hide
  assert page.locator('#objects .object[data-id="o1"]').count()==0,'Hidden item should disappear when Show Hidden unchecked'
  page.locator('#show-hidden').check()
  page.locator('#object-search').fill('POINT_1')
  assert page.locator('#objects .object').count()<100
  page.locator('#objects').evaluate('(e)=>e.scrollTop=e.scrollHeight')
  page.wait_for_timeout(90)
  assert page.locator('#objects .object[data-id="o1"]').count()==1
  page.locator('#object-search').fill('POINT_9999')
  assert page.locator('#objects .empty-objects').inner_text()=='No matching objects.'
  page.locator('#object-search').fill('POINT_1')
  page.locator('#objects').evaluate('(e)=>e.scrollTop=e.scrollHeight')
  page.wait_for_timeout(90)
  page.locator('#objects .object[data-id="o1"]').click()
  page.locator('#properties input[type=text]').first.fill('Renamed')
  page.locator('#properties input[type=text]').first.dispatch_event('change')
  assert project(page)['objects'][0]['name']=='Renamed'
  page.locator('#undo').click()
  assert project(page)['objects'][0]['name']=='POINT_1'
  assert not errors,errors
  print('CHROMIUM_CUT05_LIST_PASS: virtual row count, 3000-object scrolling, hidden filter, search, selection, properties and undo')
  browser.close()
if __name__=='__main__':run()
