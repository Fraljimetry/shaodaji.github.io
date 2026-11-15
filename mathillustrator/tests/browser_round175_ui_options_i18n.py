"""Round 175: visible arrowhead/line/shape options really translate in the live UI."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
ROOT=Path(__file__).resolve().parents[1]
style={'stroke':'#000000','fill':'#ffffff','width':1,'opacity':1}
doc=json.loads((ROOT/'examples/geometry-demo.json').read_text())
doc['objects']=[
 dict(id='o1',name='N1',type='node',xy=[-4,0],text='A',textMode='plain',style=style,hidden=False,locked=False),
 dict(id='o2',name='N2',type='node',xy=[4,0],text='B',textMode='plain',style=style,hidden=False,locked=False),
 dict(id='o3',name='Arrow3',type='morphism',refs=['o1','o2'],text='',textMode='plain',bend=0,routing='direct',style=style,hidden=False,locked=False),
 dict(id='o4',name='Curve4',type='freehand',path=[[-3,-2],[-1,-1],[0,-3],[3,-2]],closed=False,style=style,hidden=False,locked=False)]
doc['nextId']=5
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,768,390):
   page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(7000)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)));page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load',timeout=90000)
   page.locator('#open-file').set_input_files({'name':'options.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
   page.wait_for_timeout(120)
   # A programmatic click opens hidden mobile panels without changing application CSS.
   def inspect(name,expected):
    page.locator('#object-search').evaluate('(node,name)=>{node.value=name;node.dispatchEvent(new Event("input",{bubbles:true}))}',name)
    page.locator('#objects .object').first.evaluate('node=>node.click()')
    select=page.locator('#properties .field').filter(has_text='箭头端点' if page.locator('#ui-language').input_value()=='zh' else 'Arrowheads').locator('select')
    assert select.count()==1,(width,name,'arrowheads absent')
    for key,zh in expected.items():
     text=select.locator(f'option[value="{key}"]').inner_text()
     assert text==zh,(width,name,key,text,zh)
    return select
   page.locator('#ui-language').select_option('zh')
   inspect('Arrow3',{'none':'无','end':'终点','start':'起点','both':'两端','double-end':'双重箭头','hook':'钩形','tail':'尾线','harpoon':'半箭头'})
   inspect('Curve4',{'none':'无','end':'终点','start':'起点','both':'两端'})
   page.locator('#ui-language').select_option('en')
   inspect('Arrow3',{'none':'None','end':'End','start':'Start','both':'Both','double-end':'Double end','hook':'Hook','tail':'Tail','harpoon':'Harpoon'})
   page.locator('#ui-language').select_option('zh')
   inspect('Arrow3',{'none':'无','end':'终点','start':'起点','both':'两端','double-end':'双重箭头','hook':'钩形','tail':'尾线','harpoon':'半箭头'})
   assert not errors,(width,errors)
   print('ROUND175_OPTIONS_PASS',width,flush=True)
   page.close()
 finally:browser.close()
