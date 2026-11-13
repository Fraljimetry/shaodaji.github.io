"""Cut14 adversarial lifecycle, keyboard, file-read and persistence checks.
Tests isolated Chromium; no claim of hosted browser or genuine multi-tab evidence.
"""
import os, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd


def click_canvas(page,dx=0,dy=0):
 b=page.locator('#drawing').bounding_box()
 page.mouse.click(b['x']+b['width']/2+dx,b['y']+b['height']/2+dy)

def count(page):return int(page.locator('#object-count').inner_text())

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1360,'height':860},accept_downloads=True)
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(80)
  # A partially constructed segment must not leak across New.
  page.locator('[data-tool-choice="segment"]').click()
  click_canvas(page,-110,-70)
  assert count(page)==0
  page.locator('#new').click()
  click_canvas(page,+130,+80)
  assert count(page)==0, 'Cut13: orphaned first endpoint survives New and creates a ghost segment'
  print('CUT14_PASS no partial multi-click construction crosses New')
  # Same rule applies to background tab suspension, which already cancels drags.
  page.locator('[data-tool-choice="segment"]').click()
  click_canvas(page,-110,-70)
  page.evaluate("""() => {Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'))}""")
  page.evaluate("""() => Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'})""")
  click_canvas(page,+100,+80)
  assert count(page)==0,'Partial two-click construction survived tab hide'
  print('CUT14_PASS backgrounding cancels partial multi-click constructions')
  # A delayed file-read must be invalidated by project identity, even if the
  # intervening New recreates a byte-identical empty document (no revision).
  page.evaluate("""() => {window.__oldFileText=File.prototype.text; File.prototype.text=function(){return new Promise(resolve=>{window.__finishOpen=()=>resolve(window.__importJson)});};window.__importJson=JSON.stringify({version:1,settings:null,objects:[]});}""")
  # Use an actual valid example, but return its bytes only after New.
  example=(Path(__file__).resolve().parents[1]/'examples/geometry-demo.json').read_text()
  page.evaluate('(s) => window.__importJson=s',example)
  page.locator('#open-file').set_input_files({'name':'delayed.json','mimeType':'application/json','buffer':example.encode()})
  page.wait_for_function('typeof window.__finishOpen==="function"')
  page.locator('#new').click()
  page.evaluate('window.__finishOpen()')
  page.wait_for_timeout(90)
  assert count(page)==0,'Stale file import replaced a newer New action with identical edit revision'
  print('CUT14_PASS delayed import rejected after same-content project replacement')
  # IME composition key events must not invoke global destructive shortcuts.
  page.evaluate('() => {File.prototype.text=window.__oldFileText; return true;}')
  cmd(page,'A=(0,0)')
  page.locator('#objects .object').first.click()
  page.evaluate("""() => {document.activeElement?.blur();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',isComposing:true,bubbles:true}));}""")
  assert count(page)==1,'IME composition Delete reached global geometry shortcut'
  print('CUT14_PASS IME composition cannot trigger object deletion')
  page.locator('#tikzcd-open').click()
  page.evaluate('''() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',isComposing:true,bubbles:true}))''')
  assert page.locator('#tikzcd-dialog').is_visible(),'IME Escape unexpectedly closed the import dialog'
  page.keyboard.press('Escape')
  assert page.locator('#tikzcd-dialog').is_hidden(),'Normal Escape no longer dismisses importer'
  print('CUT14_PASS IME composition respected inside import modal')
  # A viewport control activated during a captured drag must cancel the
  # pending point edit before changing the camera transform.
  page.locator('[data-tool-choice="select"]').click();page.locator('#zoom-reset').click()
  page.wait_for_timeout(70)
  c=page.locator('#drawing circle[data-id="o1"]');cx=float(c.get_attribute('cx'));cy=float(c.get_attribute('cy'))
  box=page.locator('#drawing').bounding_box()
  page.mouse.move(box['x']+cx,box['y']+cy);page.mouse.down();page.mouse.move(box['x']+cx+65,box['y']+cy+17,steps=3)
  page.wait_for_timeout(70)
  assert abs(float(c.get_attribute('cx'))-cx)>10
  page.evaluate("document.getElementById('zoom-in').click()")
  page.mouse.up();page.wait_for_timeout(70)
  assert page.locator('#properties input[type=number]').first.input_value() in ('0','0.0'), 'Viewport change committed stale coordinates during drag'
  print('CUT14_PASS active drag aborted before viewport modification')
  # Quota failure must never claim a successful autosave or overwrite the
  # last valid local snapshot. Manual JSON export must remain available.
  page.wait_for_timeout(550)
  # about:blank pages restrict real localStorage in this sandbox. Use a
  # controllable Storage-shaped test double; do not call this real quota proof.
  page.evaluate('''() => {const bag=new Map();window.__quota={fail:false,bag};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>bag.get(k)??null,setItem:(k,v)=>{if(window.__quota.fail&&k==='mathillustrator-project-v1')throw new DOMException('Quota exceeded','QuotaExceededError');bag.set(k,String(v));},removeItem:k=>bag.delete(k)}});}''')
  cmd(page,'D=(1,1)');page.wait_for_timeout(600)
  before=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  assert before and 'D' in before
  page.evaluate('window.__quota.fail=true')
  cmd(page,'B=(2,3)');page.wait_for_timeout(700)
  assert 'Not saved locally' in page.locator('#autosave-info').inner_text(), 'Quota failure falsely reported autosave success'
  assert page.evaluate("localStorage.getItem('mathillustrator-project-v1')")==before,'Quota failure corrupted prior local project'
  with page.expect_download() as event: page.locator('#save').click()
  assert event.value.suggested_filename=='mathillustrator.json'
  print('CUT14_PASS storage quota failure preserves previous data and manual JSON download')
  page.evaluate('window.__quota.fail=false')
  cmd(page,'C=(5,6)');page.wait_for_timeout(650)
  saved=page.evaluate("localStorage.getItem('mathillustrator-project-v1')")
  assert '"B"' in saved and '"C"' in saved,'Autosave did not recover after quota was cleared'
  assert 'Saved locally' in page.locator('#autosave-info').inner_text()
  print('CUT14_PASS subsequent save succeeds after quota condition clears')
  assert not errs,errs
  browser.close()

if __name__=='__main__': main()
