"""Real Chromium: a transformed point is accepted by a second construction."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1450,'height':950})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(150)
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def cmd(expr):
    page.locator('#command').fill(expr);page.locator('#command-form button').click();page.wait_for_timeout(80)
   def tool(name):
    page.locator(f'[data-tool-choice="{name}"]').click();page.wait_for_timeout(70)
   def clickobj(id):
    page.locator(f'#drawing [data-id="{id}"]').first.click(force=True);page.wait_for_timeout(100)
   cmd('O=(0,0)');cmd('P=(2,1)');tool('dilation');clickobj('o2')
   page.once('dialog',lambda d:d.accept('2'));clickobj('o1')
   transformed=next(o for o in snapshot()['objects'] if o['type']=='transformCopy')
   cmd('Midpoint('+transformed['name']+',O)')
   midpoint=[o for o in snapshot()['objects'] if o['type']=='midpoint']
   assert len(midpoint)==1, snapshot()['objects']
   assert midpoint[0]['refs']==[transformed['id'],'o1'],midpoint
   assert page.locator(f'#drawing [data-id="{midpoint[0]["id"]}"]').count()==1
   assert not errors,errors
   print('ROUND66_CHROMIUM_PASS: transformed point accepted as midpoint input, rendered, no page errors')
  finally:browser.close()
if __name__=='__main__':main()
