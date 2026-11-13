"""Cut16 recovery: stale storage event, conflict text, idempotent save and quota retry.
Uses isolated Chromium, a Storage-shaped double, and synthetic storage events.
This is NOT a same-origin multi-tab atomicity certification.
"""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd
import os,json

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1300,'height':800},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  page.evaluate('''() => {const bag=new Map();window.__miStorage={bag,fail:false};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>bag.has(k)?bag.get(k):null,setItem:(k,v)=>{if(window.__miStorage.fail&&k==='mathillustrator-project-v1')throw new DOMException('Quota full','QuotaExceededError');bag.set(k,String(v));},removeItem:k=>bag.delete(k)}});}''')
  cmd(page,'A=(0,0)');page.wait_for_timeout(550)
  assert 'Saved locally' in page.locator('#autosave-info').inner_text()
  saved=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  assert saved
  # A delayed storage event must use the actual last persisted bytes, not its
  # stale event payload (a real browser can queue events behind heavy work).
  page.evaluate('''(value)=>{window.dispatchEvent(new StorageEvent('storage',{key:'mathillustrator-project-v1',oldValue:value,newValue:'OLD_EVENT'}))}''',saved)
  assert page.locator('#conflict-banner').is_hidden(), 'Stale event triggered false conflict'
  print('CUT16_PASS stale queued StorageEvent is reconciled against current storage')
  # Divergent outside edit pauses autosave with accurate banner title.
  page.evaluate('''() => {const k='mathillustrator-project-v1',value=localStorage.getItem(k);const parsed=JSON.parse(value);parsed.objects[0].name='External';localStorage.setItem(k,JSON.stringify(parsed));window.dispatchEvent(new StorageEvent('storage',{key:k,oldValue:value,newValue:JSON.stringify(parsed)}));}''')
  assert page.locator('#conflict-banner').is_visible()
  assert 'Another tab changed' in page.locator('#conflict-banner strong').inner_text()
  page.locator('#conflict-load').click()
  assert page.locator('#conflict-banner').is_hidden()
  cmd(page,'B=(3,0)');page.wait_for_timeout(550)
  assert page.locator('#object-count').inner_text()=='2'
  # Quota prevents local backup, but previous good snapshot stays valid.
  backup=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  page.evaluate('window.__miStorage.fail=true')
  cmd(page,'C=(1,2)');page.wait_for_timeout(550)
  assert 'Not saved locally' in page.locator('#autosave-info').inner_text()
  assert page.locator('#retry-autosave').is_visible(), 'Autosave failure has no actionable retry'
  assert page.evaluate("localStorage.getItem('mathillustrator-project-v1')")==backup
  page.evaluate('window.__miStorage.fail=false')
  page.locator('#retry-autosave').click();page.wait_for_timeout(100)
  assert 'Saved locally' in page.locator('#autosave-info').inner_text()
  assert page.locator('#retry-autosave').is_hidden()
  updated=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  assert '"C"' in updated
  print('CUT16_PASS failed quota backup retains snapshot, retry persists latest state')
  # After corruption+explicit recovery, external change must not preserve
  # the old 'invalid project' banner from a completely different conflict.
  page.evaluate('''() =>{const k='mathillustrator-project-v1';let old=localStorage.getItem(k);let data=JSON.parse(old);data.objects[0].name='Diverged';const now=JSON.stringify(data);localStorage.setItem(k,now);window.dispatchEvent(new StorageEvent('storage',{key:k,oldValue:old,newValue:now}));}''')
  assert 'Another tab changed' in page.locator('#conflict-banner strong').inner_text()
  # localStorage.clear() produces a StorageEvent with key=null; a missing
  # snapshot is a genuine conflict, never permission to erase local edits.
  page.evaluate('''() => {window.__miStorage.bag.clear();window.dispatchEvent(new StorageEvent('storage',{key:null,newValue:null}));}''')
  assert page.locator('#conflict-banner').is_visible()
  assert page.locator('#object-count').inner_text()=='3','External clear discarded unsaved drawing'
  assert page.evaluate("localStorage.getItem('mathillustrator-project-v1')") is None
  print('CUT16_PASS external storage clear pauses without deleting in-memory geometry')
  assert not errors,errors
  print('CUT16_BROWSER_PASS storage event ordering, accurate conflict banner, explicit retry')
  browser.close()

if __name__=='__main__':run()
