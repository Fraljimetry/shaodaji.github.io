"""Round153: compact morphism bend/side controls and live editing."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
import json
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,390,320):
   p=b.new_page(viewport={'width':width,'height':850});p.set_default_timeout(12000)
   errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
   p.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   box=p.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   if width<700:p.locator('#right-collapse').click()
   p.locator('[data-tool-choice="node"]').click()
   if width<700:p.locator('#right-collapse').click()
   p.once('dialog',lambda d:d.accept('A'));p.mouse.click(cx-44,cy)
   if width<700:p.locator('#right-collapse').click()
   p.locator('[data-tool-choice="node"]').click()
   if width<700:p.locator('#right-collapse').click()
   p.once('dialog',lambda d:d.accept('B'));p.mouse.click(cx+44,cy)
   if width<700:p.locator('#right-collapse').click()
   p.locator('[data-tool-choice="morphism"]').click()
   if width<700:p.locator('#right-collapse').click()
   p.mouse.click(cx-44,cy);p.once('dialog',lambda d:d.accept('f'));p.mouse.click(cx+44,cy)
   if width<700:p.locator('#left-collapse').click()
   snapshot=lambda:json.loads(p.evaluate('window.__round36Snapshot()'))
   morph=next(x for x in snapshot()['objects'] if x['type']=='morphism')
   p.locator(f'#objects .object[data-id="{morph["id"]}"]').click()
   pair=p.locator('#properties .property-check-number-pair')
   assert pair.count()==1,(width,pair.count())
   assert pair.get_by_text('Swap side').count()==1 and pair.get_by_text('Bend').count()==1,width
   assert pair.evaluate('''e => {const a=e.querySelector('.check').getBoundingClientRect(),b=e.querySelector('.field').getBoundingClientRect(),n=e.querySelector('input[type=number]').getBoundingClientRect(),r=e.getBoundingClientRect();return a.right<=b.left+1 && n.right<=r.right+1 && Math.abs(n.width-e.closest('#properties').querySelector('.style-opacity input[type=number]').getBoundingClientRect().width)<2;}'''),width
   pair.locator('input[type=checkbox]').check()
   pair.locator('input[type=number]').fill('1.5');pair.locator('input[type=number]').press('Tab')
   actual=next(x for x in snapshot()['objects'] if x['type']=='morphism')
   assert actual['swap'] is True and actual['bend']==1.5,(width,actual)
   assert not errors,(width,errors)
   print('PASS round153 morphism',width,flush=True)
   p.close()
 finally:b.close()
