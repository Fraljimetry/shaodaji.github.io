"""Round 274: selected-object fill control, Chromium isolated real app."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   page=browser.new_page(viewport={'width':1440,'height':980})
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load',timeout=60000)
   page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
   assert page.locator('#new-fill-type').count()==0
   fill=page.locator('#new-fill-enabled')
   assert fill.is_disabled()
   psize=page.locator('#point-size')
   a=psize.bounding_box(); b=fill.bounding_box()
   assert a and b and b['x']>a['x']+a['width']-4 and abs((a['y']+a['height']/2)-(b['y']+b['height']/2))<20,(a,b)
   algebra=page.locator('#unified-algebra-input')
   for expr in ('A=(0,0)','B=(2,0)','C=Circle(A,B)','P=(3,4)'):
    algebra.fill(expr);algebra.press('Enter')
   page.locator('#objects-list .object').count()
   def snap():return page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   circle=next(x for x in snap()['objects'] if x['name']=='C')
   point=next(x for x in snap()['objects'] if x['name']=='P')
   circle_row=page.locator(f'[data-id="{circle["id"]}"]').first
   if circle_row.count()==0:
    circle_row=page.locator('.object').filter(has_text='C').first
   circle_row.click()
   assert fill.is_enabled(),(theme,errors)
   fill.check()
   circle_updated=next(x for x in snap()['objects'] if x['name']=='C')
   assert circle_updated['style']['fillEnabled'] is True
   point_row=page.locator(f'[data-id="{point["id"]}"]').first
   if point_row.count()==0:point_row=page.locator('.object').filter(has_text='P').first
   point_row.click();assert fill.is_disabled()
   circle_row=page.locator(f'[data-id="{circle["id"]}"]').first
   if circle_row.count()==0:circle_row=page.locator('.object').filter(has_text='C').first
   circle_row.click();assert fill.is_enabled() and fill.is_checked()
   fill.uncheck()
   circle_updated=next(x for x in snap()['objects'] if x['name']=='C')
   assert circle_updated['style']['fillEnabled'] is False
   assert not errors,errors
   page.close()
 finally:browser.close()
print('Round 274: selected fill and Point size alignment PASS')
