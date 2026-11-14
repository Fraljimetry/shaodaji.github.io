"""Isolated Chromium storage shim for Round45 3D trash persistence (about:blank denies localStorage)."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
TRASH='mathillustrator-trash-v1'
STORAGE='mathillustrator-project-v1'
def html(seed):
 encoded=json.dumps(seed).replace('</','<\\/')
 shim="""<script>(()=>{ const values=new Map(Object.entries(%s));
 Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),
 removeItem:key=>values.delete(key),clear:()=>values.clear()}});
 })();</script>"""%encoded
 return inline_html(legacy_search_expanded=False,expose_state=True).replace('<head>','<head>'+shim,1)
def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1350,'height':860})
   page.on('dialog',lambda dlg:dlg.accept())
   page.set_content(html({}),wait_until='load')
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#scene3d-enable').check()
   page.locator('#plot-mode').select_option('implicit3d')
   page.locator('#command').fill('x^2+y^2+z^2=3')
   page.locator('#command-form button').click()
   page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=35000)
   original=snapshot()['scene3d']['plots'][0]
   page.locator('#objects-3d .object').first.get_by_role('button',name='Delete').evaluate('e=>e.click()')
   assert not snapshot()['scene3d']['plots']
   stored=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',TRASH))
   assert stored[0]['plots3d'][0]==original and stored[0]['objects']==[]
   removedDoc=snapshot()
   # New tab or reload: project and Recently Deleted use independent persisted keys.
   page=browser.new_page(viewport={'width':1350,'height':860})
   page.on('dialog',lambda dlg:dlg.accept())
   page.set_content(html({STORAGE:json.dumps(removedDoc),TRASH:json.dumps(stored)}),wait_until='load')
   page.wait_for_function("document.querySelector('#trash-count')?.textContent==='1'",timeout=10000)
   assert snapshot()['scene3d']['plots']==[]
   page.locator('#trash-items button').first.evaluate('e=>e.click()')
   assert snapshot()['scene3d']['plots'][0]==original
   assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',TRASH))==[]
   # ID/name conflict must not remove a recoverable entry.
   conflicting=snapshot()
   page=browser.new_page(viewport={'width':1350,'height':860})
   page.on('dialog',lambda dlg:dlg.accept())
   page.set_content(html({STORAGE:json.dumps(conflicting),TRASH:json.dumps(stored)}),wait_until='load')
   page.wait_for_function("document.querySelector('#trash-count')?.textContent==='1'",timeout=10000)
   page.locator('#trash-items button').first.evaluate('e=>e.click()')
   assert page.locator('#trash-count').text_content()=='1'
   assert len(snapshot()['scene3d']['plots'])==1
   print('PASS ROUND45_CHROMIUM_STORAGE: deleted implicit persists in saved trash across simulated reload; restore removes entry; collision keeps entry')
  finally:browser.close()
if __name__=='__main__':run()
