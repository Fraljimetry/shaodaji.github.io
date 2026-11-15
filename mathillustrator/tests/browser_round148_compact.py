"""Actual Chromium, localized compact preset pairs across viewport widths."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

pairs=[('plot-quality','plot-budget'),('freehand-close','correction'),('page','export-region'),('export-scale','theme'),('scene3d-export-scale','scene3d-theme')]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 try:
  for width in [1440,768,390,320]:
   page=browser.new_page(viewport={'width':width,'height':900});page.set_default_timeout(6000)
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(),wait_until='load',timeout=45000)
   if width<700: page.locator('#right-collapse').click()
   for language in ['en','zh','en']:
    page.locator('#ui-language').select_option(language)
    for a,b in pairs:
     x=page.locator('#'+a);y=page.locator('#'+b)
     assert x.count()==1 and y.count()==1,(width,a,b)
     assert x.evaluate('(e)=>e.closest(".compact-settings-grid")') and y.evaluate('(e)=>e.closest(".compact-settings-grid")'),(width,a,b)
     assert x.evaluate('(e)=>e.parentElement.parentElement===document.querySelector("#"+"'+b+'").parentElement.parentElement'),(width,a,b)
     if a!='scene3d-export-scale': assert x.evaluate('(e)=>getComputedStyle(e.parentElement.parentElement).gridTemplateColumns.split(" ").length===2'),(width,a,b)
     if a!='scene3d-export-scale':
      rects=[el.evaluate('(e)=>{const r=e.parentElement.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}') for el in [x,y]]
      assert abs(rects[0]['y']+rects[0]['h']-rects[1]['y']-rects[1]['h'])<3,(width,lang,a,rects)
      assert rects[0]['x']+rects[0]['w']<=rects[1]['x']+1,(width,lang,a,rects)
      assert rects[1]['w']>65 and rects[0]['w']>65,(width,lang,a,rects)
     for el in [x,y]:
      if a=='scene3d-export-scale': continue
      assert el.evaluate('(e)=>e.getBoundingClientRect().width>=65'),(width,a,b)
      assert el.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),(width,a,b)
    # style layout independent of selected object creation
   page.locator('#scene3d-enable').check()
   p3=page.locator('#scene3d-export-scale')
   assert p3.evaluate('(e)=>getComputedStyle(e.parentElement.parentElement).gridTemplateColumns.split(" ").length===2'),width
   page.locator('#scene3d-projection').select_option('orthographic')
   assert page.locator('#scene3d-projection').input_value()=='orthographic'
   assert not errors,(width,errors)
   print('PASS',width,'preset pairs, reversible EN/ZH/EN, no JS exceptions',flush=True)
   page.close()
 finally:browser.close()
