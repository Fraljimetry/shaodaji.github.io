"""Round 187: actual Chromium semantic diagram export with bend and hook."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

style={'stroke':'#111111','fill':'#ffffff','width':1,'opacity':1}
def obj(id,kind,**kw):
 return {'id':id,'name':id,'type':kind,'style':style,'hidden':False,'locked':False,**kw}

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for lang in ('en','zh'):
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load',timeout=45000)
   doc=json.loads(open(os.path.join(os.path.dirname(__file__),'../examples/geometry-demo.json')).read())
   doc['objects']=[obj('o1','node',xy=[0,2.4],text='A',textMode='latex'),obj('o2','node',xy=[0,0],text='B',textMode='latex'),obj('o3','node',xy=[3.5,0],text='C',textMode='latex'),obj('o4','node',xy=[3.5,2.4],text='D',textMode='latex'),obj('o5','morphism',refs=['o1','o2'],text='\\alpha',textMode='latex',bend=0,morphismLine='dashed',morphismHeads='hook'),obj('o6','morphism',refs=['o2','o3'],text='\\beta',textMode='latex',bend=0),obj('o7','morphism',refs=['o2','o4'],text='\\gamma',textMode='latex',bend=0),obj('o8','morphism',refs=['o1','o3'],text='\\theta',textMode='latex',bend=-2.5)]
   doc['nextId']=9
   page.locator('#open-file').set_input_files({'name':'diagram.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
   page.wait_for_timeout(250)
   if lang=='zh':page.locator('#ui-language').select_option('zh')
   page.locator('#export-open').click()
   btn=page.locator('#export-options button',has_text='tikz-cd')
   assert btn.count()==1 and btn.is_enabled(),(lang,page.locator('#export-options').inner_text())
   with page.expect_download(timeout=15000) as down:btn.click()
   data=down.value.path().read_text()
   assert 'bend left=37.50000000' in data and 'hook, dashed' in data, data
   assert not errors,(lang,errors)
   print('ROUND187_CHROMIUM_PASS',lang,len(data),flush=True)
   page.close()
 finally:browser.close()
