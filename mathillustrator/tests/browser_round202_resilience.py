"""Adversarial browser regression: corrupted startup, storage failure/retry, and history."""
from browser_smoke import inline_html,cmd
from playwright.sync_api import sync_playwright
import json,os

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1280,'height':860},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.evaluate('''() => {let bag=new Map([['mathillustrator-project-v1','{invalid']]),fail=false,drop=false;
    Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:k=>bag.get(k)??null,
      setItem:(k,v)=>{if(drop&&k==='mathillustrator-project-v1')return; if(fail&&k==='mathillustrator-project-v1')throw new DOMException('Quota reached','QuotaExceededError');bag.set(k,String(v));},
      removeItem:k=>bag.delete(k),clear:()=>bag.clear(),setFailure:v=>{fail=v;},setDrop:v=>{drop=v;}}});}''')
  page.set_content(inline_html(),wait_until='load')
  assert not page.locator('#conflict-banner').is_hidden(),'Malformed persisted JSON should block overwrite'
  assert page.evaluate("localStorage.getItem('mathillustrator-project-v1')")=='{invalid'
  page.locator('#conflict-overwrite').click()
  cmd(page,'A=(1,2)')
  page.wait_for_timeout(550)
  assert json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'][0]['name']=='A'
  page.evaluate('localStorage.setFailure(true)')
  cmd(page,'B=(3,4)')
  page.wait_for_timeout(550)
  assert page.locator('#retry-autosave').is_visible(),'Failed write needs explicit retry'
  assert len(json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==1
  page.evaluate('localStorage.setFailure(false)')
  page.locator('#retry-autosave').click()
  page.wait_for_timeout(100)
  assert len(json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==2
  page.evaluate('localStorage.setDrop(true)')
  cmd(page,'C=(5,6)')
  page.wait_for_timeout(550)
  assert page.locator('#retry-autosave').is_visible(),'Silently discarded storage write must not show success'
  assert len(json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==2
  page.evaluate('localStorage.setDrop(false)')
  page.locator('#retry-autosave').click()
  page.wait_for_timeout(100)
  assert len(json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==3
  page.locator('#undo').click()
  page.wait_for_timeout(550)
  assert len(json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==2
  page.locator('#redo').click()
  page.wait_for_timeout(550)
  assert len(json.loads(page.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==3
  assert not errors, errors
  print('ROUND202_RESILIENCE_PASS: corrupt recovery, quota denial, discarded-write detection, retry, undo/redo')
  browser.close()
if __name__=='__main__':run()
