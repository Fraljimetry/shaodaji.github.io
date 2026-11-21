"""Round 270: real Chromium, new-object fill settings and bilingual navigation."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
from pathlib import Path
from bs4 import BeautifulSoup

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('dark','light'):
   page=browser.new_page(viewport={'width':1500,'height':950})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
   page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
   assert page.locator('#new-fill-type').count()==1,('selector missing',errors)
   types=page.locator('#new-fill-type')
   enabled=page.locator('#new-fill-enabled')
   types.select_option('circle')
   assert not enabled.is_checked()
   enabled.check()
   # Type-specific settings survive switching away and back.
   types.select_option('polygon');assert enabled.is_checked()
   types.select_option('ellipse');assert not enabled.is_checked()
   types.select_option('circle');assert enabled.is_checked()
   field=page.locator('#unified-algebra-input')
   for c in ('A=(0,0)','B=(2,0)','C=(0,2)','O=Circle(A,B)','P=Polygon(A,B,C)'):
    field.fill(c);field.press('Enter')
   snapshot=lambda:page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   objs=snapshot()['objects']; circle=next(o for o in objs if o['name']=='O');polygon=next(o for o in objs if o['name']=='P')
   assert circle['style'].get('fillEnabled') is True,circle
   assert polygon['style'].get('fillEnabled',True) is True,polygon
   types.select_option('circle'); enabled.uncheck()
   objs2=snapshot()['objects'];circle2=next(o for o in objs2 if o['name']=='O')
   assert circle2['style'].get('fillEnabled') is True,'Changing default mutated existing circle'
   assert not page.locator('#properties').get_by_label('Enable fill',exact=True).count(),'Old large per-object toggle remains'
   assert not errors,errors
   page.close()
  # Tutorial must show exactly one language in navigation.
  html=Path(__file__).resolve().parents[1].joinpath('tutorial.html').read_text()
  for mode in ('en','zh'):
   page=browser.new_page()
   page.set_content(html,wait_until='load')
   page.evaluate('(mode)=>document.documentElement.dataset.lang=mode',mode)
   text=page.locator('nav a[href="#construction-arguments"]').inner_text()
   assert ('Constructor arguments' in text)==(mode=='en'),(mode,text)
   assert ('构造参数' in text)==(mode=='zh'),(mode,text)
   page.close()
 finally:browser.close()
print('Round 270 Chromium fill defaults + bilingual titles PASS')
