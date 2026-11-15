"""Round 170: optional semantic hover uses actual selection effect."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,390):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_default_timeout(12000)
   errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   assert page.locator('#tooltips').count()==0
   control=page.locator('#selection-preview')
   assert control.count()==1 and control.is_checked()
   assert 'Selection preview' in page.locator('label:has(#selection-preview)').inner_text()
   page.locator('#command').evaluate('(n)=>{n.value="P=(0,0)";n.dispatchEvent(new Event("input",{bubbles:true}));}')
   page.locator('#command-form').evaluate('(n)=>n.requestSubmit()')
   point=page.locator('#drawing [data-id]').first
   box=point.bounding_box();assert box
   x,y=box['x']+box['width']/2,box['y']+box['height']/2
   page.mouse.move(x,y);page.wait_for_timeout(90)
   preview=page.locator('#drawing .pick-preview')
   assert preview.count()>0,'hover should preview when enabled'
   filters=page.evaluate('''() => ({selection:getComputedStyle(document.querySelector('#drawing .selected-shape')||document.querySelector('#drawing .pick-preview')).filter,preview:getComputedStyle(document.querySelector('#drawing .pick-preview')).filter})''')
   assert 'drop-shadow' in filters['preview']
   # Disable while already hovering: remove preview immediately.
   control.evaluate('(n)=>{n.checked=false;n.dispatchEvent(new Event("change",{bubbles:true}));}')
   assert preview.count()==0,'disabling must clear existing hover'
   page.mouse.move(x+12,y+12);page.mouse.move(x,y);page.wait_for_timeout(80)
   assert preview.count()==0,'disabled hover must remain inactive'
   # Selection itself still works, independently of preview preference.
   page.mouse.click(x,y);page.wait_for_timeout(100)
   assert page.locator('#drawing .selected-shape').count()>0,'selection should remain active'
   control.evaluate('(n)=>{n.checked=true;n.dispatchEvent(new Event("change",{bubbles:true}));}')
   page.mouse.move(x+13,y+13);page.mouse.move(x,y);page.wait_for_timeout(90)
   assert preview.count()>0,'re-enable hover should restore the preview'
   styles=page.evaluate('''() => {const n=document.querySelector('#drawing .selected-shape.pick-preview');return n ? {actual:getComputedStyle(n).filter,preview:getComputedStyle(n).filter} : null;}''')
   assert styles and styles['actual']==styles['preview'],styles
   page.locator('#ui-language').evaluate('(n)=>{n.value="zh";n.dispatchEvent(new Event("change",{bubbles:true}));}')
   assert '选择预览' in page.locator('label:has(#selection-preview)').inner_text()
   assert not errors,errors
   print('ROUND170_SELECTION_PREVIEW_PASS',width,flush=True)
   page.close()
 finally: browser.close()
