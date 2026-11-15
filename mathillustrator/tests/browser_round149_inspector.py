"""Real Chromium regression: meaningful subtitles and adjacent inspector controls."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,390,320):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_default_timeout(9000)
   errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
   page.set_content(inline_html(),wait_until='load',timeout=45000)
   if width<700:page.locator('#left-collapse').click()
   cmd(page,'P=(1,2)')
   point=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='P')).first
   assert point.count()==1,width
   assert '1' in point.locator('small').inner_text(),width
   point.click()
   pointsize=page.locator('#properties .style-pointsize .field')
   dimensions=pointsize.evaluate('''e=>{let a=e.getBoundingClientRect(),b=e.querySelector('input').getBoundingClientRect(),t=e.firstChild;return {panel:a.width,controlX:b.x,fieldX:a.x,gap:b.x-a.x}}''')
   assert dimensions['gap'] < 125,(width,dimensions)
   inp=page.locator('#properties .field input[type=text]:not([readonly])').first
   geometry=inp.evaluate('''e=>({input:e.getBoundingClientRect().width, parent:e.parentElement.getBoundingClientRect().width})''')
   assert geometry['input'] >= geometry['parent']-3,(width,geometry)
   # Named numerical-only secondary rows should disappear for e.g. segment.
   cmd(page,'Q=(3,4)')
   cmd(page,'Segment(P,Q)')
   segment=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='Segment')).first
   assert segment.count()==1,width
   assert segment.locator('.object-label small').count()==0,(width,segment.inner_text())
   assert not errs,(width,errs)
   print('PASS',width,'meaningful subtitles and tightly grouped fields',flush=True)
   page.close()
 finally:browser.close()
