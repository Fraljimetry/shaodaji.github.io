"""Round 289: unnamed lowercase 2D Algebra constructors, real Chromium compatibility."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':860});errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def enter(text):
    field=page.locator('#unified-algebra-input');field.fill(text);field.press('Enter')
   for text in ['a=(0,0)','b=(4,0)','c=(0,3)','segment(a,b)']:
    enter(text)
   before=snap();first=before['objects'][-1]
   assert first['type']=='segment' and first['name'].startswith('Segment '),first
   assert first['refs']==[before['objects'][0]['id'],before['objects'][1]['id']]
   enter('segment(a,b)');second=snap()['objects'][-1]
   assert first['id']!=second['id'] and first['name']!=second['name']
   enter('s = Segment(b,c)');assert snap()['objects'][-1]['name']=='s'
   enter('midpoint(a,b)');assert snap()['objects'][-1]['type']=='midpoint'
   stable=snap();enter('segment(a,missing)');assert snap()==stable
   page.locator('#objects [data-id="'+first['id']+'"]').click()
   assert 'Segment(a, b)' in page.locator('#properties').get_by_label('Expression',exact=True).input_value()
   page.locator('#objects [data-id="'+before['objects'][1]['id']+'"]').click()
   page.locator('#properties').get_by_label('Expression',exact=True).fill('(6,0)')
   page.locator('#properties').get_by_label('Expression',exact=True).press('Tab')
   assert snap()['objects'][1]['xy'][0]==6
   assert snap()['objects'][3]['refs']==first['refs']
   page.locator('#undo').click();assert snap()['objects'][1]['xy'][0]==4
   page.locator('#redo').click();assert snap()['objects'][1]['xy'][0]==6
   assert not errors,errors
   print('ROUND289_UNNAMED_2D_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
