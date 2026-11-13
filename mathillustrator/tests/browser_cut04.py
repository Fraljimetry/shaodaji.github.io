"""Cut04 isolated Chromium regressions: drawing feedback, dropped pointer, storage equivalence, diagram fidelity."""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
import os,json,math


def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1280,'height':840},accept_downloads=True)
  failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(100)
  drawing=page.locator('#drawing');box=drawing.bounding_box()
  x=box['x']+box['width']*.50;y=box['y']+box['height']*.50
  page.get_by_role('button',name='Free curve',exact=True).click()
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+45,y-30,steps=5)
  assert drawing.locator('.draft-freehand').count()==1,'Active stroke has no visible draft (RED on Cut03)'
  expected=[float(v) for v in page.locator('#coords').inner_text().replace('x','').replace('y','').replace('·','').split()]
  # On pointerup, the final position must be recorded even when no final pointermove arrives.
  page.eval_on_selector('#drawing', '''(e, pos) => e.dispatchEvent(new PointerEvent('pointerup',{
   bubbles:true, pointerId:1, isPrimary:true, button:0, clientX:pos.x, clientY:pos.y
  }))''',{'x':x+115,'y':y-53})
  page.mouse.up();page.wait_for_timeout(80)
  assert drawing.locator('.draft-freehand').count()==0
  page.locator('#save').click()  # does not affect document
  saved=json.loads(download(page,'Save').read_text())
  strokes=[o for o in saved['objects'] if o['type']=='freehand']
  assert len(strokes)==1,'Freehand stroke was not committed'
  # use viewport world coordinates to compare against the release site; x-axis origin centered.
  final=strokes[0]['path'][-1]
  assert final[0]>expected[0]+.9, f'Pointerup endpoint dropped: {final} after {expected}'
  # Verify aborted stroke is neither saved nor left as a draft.
  page.mouse.move(x+130,y);page.mouse.down();page.mouse.move(x+145,y+12,steps=2)
  drawing.dispatch_event('pointercancel',{'pointerId':1})
  page.mouse.up();page.wait_for_timeout(60)
  assert drawing.locator('.draft-freehand').count()==0
  assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='freehand'])==1
  # Fresh-tab equivalent storage event (isolated localStorage double). Cut 03
  # does not adopt the new lastStored token, then falsely reports a conflict.
  second=b.new_page(viewport={'width':1160,'height':760},accept_downloads=True)
  second.on('pageerror',lambda e:failures.append(str(e)))
  second.evaluate("""() => {const bag=new Map();Object.defineProperty(window,'localStorage',{
   configurable:true,value:{getItem:k=>bag.has(k)?bag.get(k):null,
   setItem:(k,v)=>bag.set(k,String(v)),removeItem:k=>bag.delete(k)}});
  }""")
  second.set_content(inline_html(),wait_until='load');second.wait_for_timeout(100)
  baseline=download(second,'Save').read_text()
  second.evaluate("""(value) => {const k='mathillustrator-project-v1';
    localStorage.setItem(k,value);
    window.dispatchEvent(new StorageEvent('storage',{key:k,newValue:value}));
  }""",json.dumps(json.loads(baseline),separators=(',',':')))
  cmd(second,'A=(2,3)');second.wait_for_timeout(520)
  assert second.locator('#conflict-banner').is_hidden(), 'False storage conflict after exact same-version event'
  assert len(json.loads(second.evaluate("localStorage.getItem('mathillustrator-project-v1')"))['objects'])==1
  second.close()
  assert not failures,failures
  print('CHROMIUM_CUT04_PASS: visible corrected freehand preview, final release coordinate, pointercancel, storage equivalent-version, no JS errors')
  b.close()

if __name__=='__main__':run()
