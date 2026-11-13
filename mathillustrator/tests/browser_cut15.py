"""Cut15: synthetic PointerEvents + wheel, single-finger commitment and keyboard modal.
Browser engine event dispatch is real; physical multitouch and deployed origin NOT tested.
"""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd

def pointer(page,kind,pid,x,y,primary=True,ptype='touch',buttons=1):
 return page.evaluate('''({kind,pid,x,y,primary,ptype,buttons})=>{const el=document.getElementById('drawing');const box=el.getBoundingClientRect();return el.dispatchEvent(new PointerEvent(kind,{bubbles:true,cancelable:true,composed:true,pointerId:pid,pointerType:ptype,isPrimary:primary,button:kind==='pointerup'?-1:0,buttons:kind==='pointerup'?0:buttons,clientX:box.left+x,clientY:box.top+y}));}''',dict(kind=kind,pid=pid,x=x,y=y,primary=primary,ptype=ptype,buttons=buttons))

def center(page):
 return page.evaluate('''() => {const b=document.getElementById('drawing').getBoundingClientRect();return [b.width/2,b.height/2];}''')

def count(page):return int(page.locator('#object-count').inner_text())

def test():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1320,'height':840})
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)));page.on('dialog',lambda d:d.accept('Label'))
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(100)
  x,y=center(page)
  page.locator('[data-tool-choice="point"]').click()
  pointer(page,'pointerdown',21,x,y)
  assert count(page)==0, 'Touch-down prematurely committed point before potential second finger'
  pointer(page,'pointerup',21,x,y)
  assert count(page)==1,'Single-finger tap failed to create point'
  print('CUT15_PASS touch points commit on release only')
  # Pointerup may carry the only final coordinate update (stylus and touch).
  pointer(page,'pointerdown',22,x-120,y)
  pointer(page,'pointerup',22,x-60,y)
  assert count(page)==1,'Large up-only touch movement was misclassified as a tap'
  print('CUT15_PASS final touch-up displacement cannot create a ghost tap')
  # A pointer released outside SVG (when no capture was taken) must be cleaned
  # up; the next touch must not be mistaken for the second finger of a gesture.
  page.locator('[data-tool-choice="select"]').click()
  pointer(page,'pointerdown',25,x,y-80)
  page.evaluate('''() => document.getElementById('object-search').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:25,pointerType:'touch',isPrimary:true,button:-1,buttons:0}))''')
  page.locator('[data-tool-choice="point"]').click()
  pointer(page,'pointerdown',26,x+90,y+55);pointer(page,'pointerup',26,x+90,y+55)
  assert count(page)==2,'Off-SVG release left a phantom touch active'
  print('CUT15_PASS contact released outside the canvas is cleared')
  # Cross-panel second contact interrupts an incomplete touch tap.
  pointer(page,'pointerdown',27,x+60,y)
  page.evaluate('''() => document.getElementById('object-search').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:28,pointerType:'touch',isPrimary:false,button:0,buttons:1}))''')
  pointer(page,'pointerup',27,x+60,y)
  assert count(page)==2,'A second touch outside SVG failed to cancel a pending point'
  print('CUT15_PASS second finger on controls interrupts canvas operation')
  page.locator('#new').click();assert count(page)==0
  pointer(page,'pointerdown',31,x-50,y)
  pointer(page,'pointerdown',32,x+30,y,primary=False)
  pointer(page,'pointerup',31,x-50,y)
  pointer(page,'pointerup',32,x+30,y,primary=False)
  assert count(page)==0,'Two-finger gesture created a point'
  pointer(page,'pointerdown',33,x+30,y)
  pointer(page,'pointerup',33,x+30,y)
  assert count(page)==1,'Subsequent normal touch stuck in blocked state'
  print('CUT15_PASS multi-touch suppresses ghost point and recovers')
  page.locator('#new').click()
  page.locator('[data-tool-choice="segment"]').click()
  pointer(page,'pointerdown',41,x-70,y);pointer(page,'pointerup',41,x-70,y)
  pointer(page,'pointerdown',42,x+70,y);pointer(page,'pointerdown',43,x+90,y,primary=False)
  pointer(page,'pointerup',42,x+70,y);pointer(page,'pointerup',43,x+90,y,primary=False)
  assert count(page)==0, 'Multi-finger gesture committed second construction endpoint'
  pointer(page,'pointerdown',44,x+70,y);pointer(page,'pointerup',44,x+70,y)
  assert count(page)==0, 'Interrupted construction retained a stale first endpoint'
  print('CUT15_PASS interrupted multi-click constructions cancel cleanly')
  page.locator('#new').click();cmd(page,'A=(2,0)')
  page.locator('[data-tool-choice="pan"]').click();page.locator('#zoom-reset').click();page.wait_for_timeout(80)
  first=float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))
  pointer(page,'pointerdown',51,x,y);pointer(page,'pointermove',51,x+60,y)
  page.wait_for_timeout(50)
  assert abs(float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))-first)>20
  pointer(page,'pointerdown',52,x+80,y,primary=False)
  pointer(page,'pointerup',51,x+60,y);pointer(page,'pointerup',52,x+80,y,primary=False)
  page.wait_for_timeout(60)
  assert abs(float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))-first)<1.1, 'Two-finger intrusion left an uncommitted pan in place'
  print('CUT15_PASS pinch interruption rolls back single-finger pan')
  # Last-chance pointerup should commit a pan's final coordinate even if no move event arrives.
  pointer(page,'pointerdown',54,x,y,ptype='pen')
  pointer(page,'pointerup',54,x+36,y,ptype='pen')
  page.wait_for_timeout(60)
  assert abs(float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))-first)>20,'Pan ignored final pointer-up coordinates'
  print('CUT15_PASS pan consumes final pen-up position')
  page.locator('#zoom-reset').click()
  page.locator('[data-tool-choice="point"]').click();pointer(page,'pointerdown',61,x+10,y+10)
  page.evaluate('window.dispatchEvent(new Event("blur"))')
  pointer(page,'pointerup',61,x+10,y+10)
  assert count(page)==1,'Blurred touch was committed later'
  print('CUT15_PASS touch pending tap cancels on blur')
  page.locator('#zoom-reset').click();page.wait_for_timeout(60)
  def zoom(delta,mode):
   page.locator('#zoom-reset').click()
   page.evaluate('''({delta,mode})=>{let el=document.getElementById('drawing');let b=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:delta,deltaMode:mode,clientX:b.left+b.width/2,clientY:b.top+b.height/2}));}''',dict(delta=delta,mode=mode))
   page.wait_for_timeout(50)
   return float(page.locator('#drawing circle[data-id="o1"]').get_attribute('cx'))
  a=zoom(16,0);c=zoom(1,1)
  assert abs(a-c)<0.1, f'Wheel zoom depends on deltaMode: {a} vs {c}'
  print('CUT15_PASS line wheel deltas normalized to pixel wheel deltas')
  # Screen-reader relevant actions: exported modal Tab/Escape are focus-isolated.
  page.locator('#export-open').click();page.keyboard.press('Shift+Tab')
  assert page.evaluate('document.getElementById("export-menu").contains(document.activeElement)'), 'Modal lost focus'
  page.keyboard.press('Escape')
  assert page.locator('#export-menu').is_hidden()
  assert not errs,errs
  print('CUT15_PASS export modal focus and page errors')
  b.close()

if __name__=='__main__':test()
