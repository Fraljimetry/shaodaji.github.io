"""R173: real browser entering phi expressions in plotting modes and switching workspaces."""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   for width in [1440,390]:
    page=browser.new_page(viewport={'width':width,'height':900})
    page.set_default_timeout(8000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
    page.locator('#object-count').wait_for(state='attached')
    if width<700:page.locator('#left-collapse').click()
    for mode,expr in [('function','phi*x+e'),('implicit','x^2+y^2=φ')]:
     page.locator('#plot-mode').select_option(mode)
     page.locator('#command').fill(expr)
     page.locator('#command-form button').click()
     state=json.loads(page.evaluate('window.__round36Snapshot()'))
     assert state['objects'][-1]['type']==mode,state['objects'][-1]
     assert state['objects'][-1]['expr']==expr,state['objects'][-1]
    assert not errors,errors
    print('ROUND173_CHROMIUM_PASS',width,flush=True)
    page.close()
  finally:browser.close()
if __name__=='__main__':main()
