"""Round 165 real Chromium: populated properties, modes, themes, modals, locale, responsive clipping."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

MODES_2D=[('function','sin(x)',None),('parametric','cos(t)','sin(t)'),('implicit','x*x+y*y-1',None),('vectorField','x','y'),('domainColoring','z',None)]
MODES_3D=[('surface3d','sin(x)+cos(y)',None,None),('parametric3d','cos(u)','sin(u)','v'),('implicit3d','x*x+y*y+z*z-1',None,None),('vector3d','x','y','z'),('domain3d','z',None,None)]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  for width in (1440,768,390,320):
   page=browser.new_page(viewport={'width':width,'height':900});page.set_default_timeout(12000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load',timeout=60000)
   if width<700:page.locator('#right-collapse').click()
   def choose(selector,value):
    el=page.locator(selector)
    if el.is_visible():el.select_option(value)
    else:el.evaluate('(el,value)=>{el.value=value;el.dispatchEvent(new Event("change",{bubbles:true}))}',value)
   for lang in ('en','zh'):
    page.locator('#ui-language').select_option(lang)
    for theme in ('light','dark'):
     choose('#theme',theme)
     assert page.locator('html').get_attribute('data-theme')==theme
     result=page.evaluate('''() => {
      const els=[...document.querySelectorAll('.rightpanel label, .rightpanel button, .rightpanel input, .rightpanel select')];
      const panel=document.querySelector('.rightpanel').getBoundingClientRect();
      return els.filter(x=>x.getClientRects().length && getComputedStyle(x).visibility!=='hidden')
        .filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>panel.right+3||r.left<panel.left-3 || ((x.matches('label,button'))&&x.scrollWidth>x.clientWidth+3));})
        .map(x=>[x.tagName,x.id,x.textContent.trim().slice(0,32)]).slice(0,10);
     }''')
     assert not result,(width,lang,theme,result)
    for mode,expr,y in MODES_2D:
     choose('#plot-mode',mode)
     assert page.locator('#command').is_visible() if width>=700 else page.locator('#command').count()==1
     assert page.locator('#command').get_attribute('aria-label'),(width,lang,mode)
    if width>=700:
     page.locator('#plot-mode').select_option('function');cmd(page,'P=(1,2)')
     page.locator('#objects .object').first.click()
     assert page.locator('#properties input').count()>0
     page.locator('#scene3d-enable').check()
     for mode,x,y,z in MODES_3D:
      assert page.locator(f'#plot-mode option[value="{mode}"]').count(),mode
      choose('#plot-mode',mode)
      assert page.locator('#command').get_attribute('aria-label'),mode
     page.locator('#scene3d-enable').uncheck()
    page.locator('#tikzcd-open').click()
    assert page.locator('#tikzcd-dialog').is_visible()
    page.locator('#tikzcd-close').click()
    assert not page.locator('#tikzcd-dialog').is_visible()
    page.locator('#export-open').click()
    assert page.locator('#export-menu').is_visible()
    page.locator('#export-close').click()
    assert not page.locator('#export-menu').is_visible()
   assert not errors,(width,errors)
   print('ROUND165_DISPLAY_STATES_PASS',width,flush=True)
   page.close()
 finally:browser.close()
