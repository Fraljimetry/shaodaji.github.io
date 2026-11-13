"""Isolated localStorage test double, explicitly NOT a transactional multitab proof."""
from browser_smoke import inline_html,cmd
from playwright.sync_api import sync_playwright
import os,json

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1280,'height':860},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda dialog:dialog.accept())
  page.evaluate('''() => {const bag=new Map(); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>bag.has(k)?bag.get(k):null,setItem:(k,v)=>bag.set(k,String(v)),removeItem:k=>bag.delete(k),clear:()=>bag.clear()}});}''')
  page.set_content(inline_html(),wait_until='load')
  cmd(page,'A=(0,0)');page.wait_for_timeout(520)
  stored=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  assert json.loads(stored)['objects'][0]['name']=='A', 'Initial autosave did not persist'
  # Make a newer external project while this tab is dirty; fire real shape storage event.
  cmd(page,'B=(2,0)')
  page.evaluate('''() => {const k='mathillustrator-project-v1',old=localStorage.getItem(k);const obj=JSON.parse(old);obj.objects[0].name='External_A';const current=JSON.stringify(obj);localStorage.setItem(k,current);window.dispatchEvent(new StorageEvent('storage',{key:k,oldValue:old,newValue:current}));}''')
  assert not page.locator('#conflict-banner').is_hidden()
  page.wait_for_timeout(510)
  preserved=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  assert json.loads(preserved)['objects'][0]['name']=='External_A','Conflict overwrote external content'
  page.locator('#conflict-load').click()
  assert page.locator('#conflict-banner').is_hidden()
  assert page.locator('#object-count').inner_text()=='1'
  assert page.locator('#autosave-info').inner_text()=='Loaded newer local project'
  page.wait_for_timeout(520)
  assert page.evaluate("localStorage.getItem('mathillustrator-project-v1')")==preserved,'Canceled save timer overwrote the loaded version'
  assert page.locator('#undo').is_disabled() and page.locator('#redo').is_disabled()
  assert not errors,errors
  print('CHROMIUM_STORAGE_PASS: delayed autosave, external conflict pause, rejected overwrite, load-newer timer cancellation, history clearing')
  b.close()

if __name__=='__main__':run()
