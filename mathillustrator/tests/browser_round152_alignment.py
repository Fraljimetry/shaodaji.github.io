"""Round152: real Chromium short-label, selector and numeric alignment."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for width in (1440,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':900});page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   if width<700: page.locator('#left-collapse').click()
   cmd(page,'P=(1,2)')
   page.locator('#objects .object').first.click()
   result=page.evaluate('''() => {const p=document.querySelector('#properties');const find=t=>[...p.querySelectorAll('label.field')].find(e=>e.textContent.includes(t));const a=find('Displayed label'),b=find('Label format');const r=e=>e.getBoundingClientRect();const ai=r(a.querySelector('input')),bi=r(b.querySelector('select')),pr=r(p);return {a:ai.x,b:bi.x,aw:ai.width,bw:bi.width,right:pr.right,hasClass:a.classList.contains('short-label-field'),nameWidth:find('Name').querySelector('input').getBoundingClientRect().width};}''')
   assert result['hasClass'] and abs(result['a']-result['b'])<3 and abs(result['aw']-result['bw'])<3,(width,result)
   assert result['a']+result['aw']<=result['right']+1 and result['nameWidth']>result['aw'],(width,result)
   result2=None
   if width>=700:
    page.locator('#plot-mode').select_option('domainColoring')
    page.locator('#command').fill('z');page.locator('#command').press('Enter')
    result2=page.evaluate('''() => {const p=document.querySelector('#properties');const fields=[...p.querySelectorAll('label.field')];const f=t=>fields.find(e=>e.textContent.includes(t));const rect=e=>e.getBoundingClientRect();const c=rect(f('Color scheme').querySelector('select')),n=rect(f('Coloring resolution').querySelector('input')),l=rect(f('Displayed label').querySelector('input'));return {cx:c.x,nx:n.x,lx:l.x,cw:c.width,nw:n.width,lw:l.width,pw:rect(p).width};}''')
    assert max(result2['cx'],result2['nx'],result2['lx'])-min(result2['cx'],result2['nx'],result2['lx'])<3,(width,result2)
    assert max(result2['cw'],result2['nw'],result2['lw'])-min(result2['cw'],result2['nw'],result2['lw'])<3,(width,result2)
   assert not errors,(width,errors)
   print('PASS ROUND152_CHROMIUM',width,result,result2,flush=True)
   page.close()
 finally: browser.close()
