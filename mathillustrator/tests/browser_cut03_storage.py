"""Corrupt saved project quarantine: isolated localStorage double, not real shared-origin storage."""
from browser_smoke import inline_html,cmd
from playwright.sync_api import sync_playwright
import os,json

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1280,'height':800},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.evaluate("""() => {const bag=new Map([['mathillustrator-project-v1','{broken json ]']]);
  Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>bag.has(k)?bag.get(k):null,setItem:(k,v)=>bag.set(k,String(v)),removeItem:k=>bag.delete(k)}});} """)
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(110)
  assert page.locator('#conflict-banner').is_visible()
  assert 'invalid' in page.locator('#conflict-banner strong').inner_text().lower()
  assert 'paused' in page.locator('#autosave-info').inner_text().lower()
  cmd(page,'A=(1,2)');page.wait_for_timeout(520)
  assert page.evaluate("localStorage.getItem('mathillustrator-project-v1')")=='{broken json ]', 'Invalid saved project was overwritten without consent'
  page.locator('#conflict-overwrite').click();page.wait_for_timeout(510)
  data=json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))
  assert data['objects'][0]['name']=='A'
  assert page.locator('#conflict-banner').is_hidden()
  assert not errors,errors
  print('CHROMIUM_CUT03_CORRUPTION_PASS: malformed local backup quarantined, edits cannot overwrite, explicit user consent recovers autosave')
  b.close()

if __name__=='__main__':run()
