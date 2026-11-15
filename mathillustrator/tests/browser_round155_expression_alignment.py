"""Round 155: plot formula labels share their row with medium-width editors."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
 try:
  for width in (1440,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':900})
   page.set_default_timeout(12000)
   errors=[]
   page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
   if width<700: page.locator('#left-collapse').click()
   for mode,expression in [('function','sin(x)'),('parametric','t'),('implicit','x^2+y^2-4'),('domainColoring','z')]:
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(expression)
    page.locator('#command').press('Enter')
    result=page.evaluate('''() => {
     const p=document.querySelector('#properties');
     const e=p.querySelector(':scope > label.formula-expression-field');
     if(!e) return null;
     const i=e.querySelector('input');const a=e.getBoundingClientRect();const b=i.getBoundingClientRect();
     return {field:[a.x,a.y,a.width,a.height],input:[b.x,b.y,b.width,b.height],label:e.textContent,
      aligned:Math.abs((a.y+a.height/2)-(b.y+b.height/2))<8,overflow:b.right>p.getBoundingClientRect().right+1};
    }''')
    assert result is not None,(width,mode,'no inline formula field')
    assert result['aligned'] and not result['overflow'],(width,mode,result)
    assert result['input'][2]>=100,(width,mode,result)
    print('PASS FORMULA_INLINE',width,mode,result['input'][2],flush=True)
   assert not errors,(width,errors)
   page.close()
 finally: browser.close()
