"""Verify point Size aligns under the right-column opacity and width controls."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for width in (1440, 390, 320):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_default_timeout(10000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(),wait_until='load',timeout=45000)
   if width<700:page.locator('#left-collapse').click()
   cmd(page,'P=(1,2)')
   page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='P')).first.click()
   values=page.evaluate('''() => {
    const root=document.querySelector('#properties'), rect=s=>root.querySelector(s).getBoundingClientRect();
    const size=root.querySelector('.style-pointsize .field'),op=root.querySelector('.style-opacity .field'),wid=root.querySelector('.style-width .field');
    const s=rect('.style-pointsize input'),o=rect('.style-opacity input'),w=rect('.style-width input');
    return {label:size.textContent.trim(),sx:s.x,ox:o.x,wx:w.x,sy:s.y,wy:w.y,sw:s.width,ow:o.width};
   }''')
   assert values['label'].startswith('Size'),(width,values)
   assert abs(values['sx']-values['ox'])<4 and abs(values['sx']-values['wx'])<4,(width,values)
   assert values['sy']>values['wy'],(width,values)
   assert not errors,(width,errors)
   print('ROUND150_CHROMIUM_PASS',width,values,flush=True)
   page.close()
 finally:browser.close()
