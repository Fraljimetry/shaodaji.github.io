"""Round 144 deterministic browser stability: repeated interactions and bounded memory."""
import os,time,json,gc
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--js-flags=--expose-gc'])
  try:
   results=[]
   for width in (1440,390):
    context=browser.new_context(viewport={'width':width,'height':860},accept_downloads=True)
    page=context.new_page();page.set_default_timeout(2200)
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)));page.on('dialog',lambda d:d.accept())
    page.set_content(inline_html(expose_state=True),wait_until='load')
    if width<700:page.locator('#left-collapse').click()
    n=lambda:int(page.locator('#object-count').inner_text())
    measures=[]
    for cycle in range(6):
     if width<700 and not page.evaluate("document.body.classList.contains('mobile-left-open')"):
      page.locator('#left-collapse').click()
     start=time.perf_counter()
     for j in range(15):cmd(page,f'S{cycle}_{j}=({cycle+j/9:.4f},{j/5:.4f})')
     assert n()==(cycle+1)*15,(width,cycle,n())
     page.locator('#ui-language').select_option('zh' if cycle%2 else 'en')
     
     if width<700:
      page.locator('#left-collapse').click()
      page.locator('#right-collapse').click()
     page.locator('#theme').select_option('dark' if cycle%2 else 'light')
     if width<700:
      page.locator('#right-collapse').click()
      page.locator('#left-collapse').click()
     for _ in range(3):page.locator('#undo').click()
     for _ in range(3):page.locator('#redo').click()
     assert n()==(cycle+1)*15
     page.evaluate('globalThis.gc?.()')
     mem=page.evaluate('performance.memory?.usedJSHeapSize ?? null')
     measures.append({'cycle':cycle,'objects':n(),'elapsed_s':round(time.perf_counter()-start,2),'js_heap_bytes':mem})
    page.locator('#new').click(); assert n()==0
    page.locator('#undo').click();assert n()==90
    page.locator('#open-file').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'nope'})
    assert n()==90
    assert not errors,(width,errors)
    results.append({'width':width,'cycles':measures,'exceptions':errors})
    context.close()
   print('ROUND144_STABILITY_PASS '+json.dumps(results))
  finally:browser.close()
if __name__=='__main__':run()
