"""Real Chromium verification of import/undo/redo, including distinct saved snapshots."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  exe=os.getenv('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':exe} if exe else {}))
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.set_default_timeout(20000)
   initial=json.loads(page.evaluate('window.__round36Snapshot()'))
   imported=json.loads(json.dumps(initial))
   imported['meta']['title']='Round 91 history'
   imported['objects']=[];imported['nextId']=1
   imported['objects'].append({'id':'o1','name':'History point','type':'point','xy':[2,3], 'hidden':False,'locked':False,'style':{'stroke':'#000000','fill':'#000000','width':2,'opacity':1,'pointSize':5}})
   imported['nextId']=2
   page.locator('#open-file').set_input_files({'name':'r91.json','mimeType':'application/json','buffer':json.dumps(imported).encode()})
   page.wait_for_function("()=>JSON.parse(window.__round36Snapshot()).objects.length===1")
   assert page.locator('#undo').is_enabled()
   page.locator('#undo').click()
   page.wait_for_function('()=>JSON.parse(window.__round36Snapshot()).objects.length===0')
   assert page.locator('#redo').is_enabled()
   page.locator('#redo').click()
   page.wait_for_function('()=>JSON.parse(window.__round36Snapshot()).objects.length===1')
   state=json.loads(page.evaluate('window.__round36Snapshot()'))
   assert state['objects']==imported['objects'],(state['objects'],imported['objects'])
   with page.expect_download() as dl:page.locator('#save').click()
   exported=json.loads(dl.value.path().read_text())
   assert exported['objects']==imported['objects']
   assert not errors,errors
   print('ROUND91_CHROMIUM_PASS: import, undo, redo, export preserve objects; no page errors')
  finally:browser.close()
if __name__=='__main__':main()
