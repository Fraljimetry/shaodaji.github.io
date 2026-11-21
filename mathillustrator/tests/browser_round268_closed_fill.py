"""Closed-shape fill regression, adapted for Round 270 per-type new-object defaults."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   page=browser.new_page(viewport={'width':1200,'height':850},accept_downloads=True)
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
   page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
   field=page.locator('#unified-algebra-input')
   for cmd in ('A=(0,0)','B=(3,0)','C=(0,2)','O=Circle(A,B)','P=Polygon(A,B,C)','S=Segment(A,B)','K=ClosedSpline(A,B,C)','D=(3,2)','H=CircleThrough3(A,B,C)','E=Ellipse(A,B,C)','Z=Bezier(A,B,D,C)'):
    field.fill(cmd);field.press('Enter')
   def choose(name):
    page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text=name)).first.click()
   snapshot=lambda:page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
   for name in ('O','P','K','H','E','Z'):
    choose(name);prop=page.locator('#properties')
    if name=='Z':
     prop.get_by_label('Closed curve',exact=True).check()
     prop=page.locator('#properties')
    assert prop.get_by_label('Line style',exact=True).count()==1,(theme,name,'line selector')
    assert prop.get_by_label('Enable fill',exact=True).count()==0,(theme,name,'old toggle')
    if name not in ('P','E'):
     # Color selection intentionally enables fill for an existing shape.
     prop.locator('.style-fill input[type="color"]').fill('#ff0000')
     prop.locator('.style-fill input[type="color"]').dispatch_event('change')
    prop.get_by_label('Line style',exact=True).select_option('dotted')
    obj=next(x for x in snapshot()['objects'] if x['name']==name)
    assert obj['style'].get('fillEnabled',name in ('P','E')) is True,(name,obj['style'])
    shape=page.locator(f'#drawing [data-id="{obj["id"]}"]').first
    assert shape.get_attribute('fill')!='none',(name,shape.evaluate('(el)=>el.outerHTML')[:300])
    assert shape.get_attribute('stroke-dasharray')=='2 5',(name,shape.evaluate('(el)=>el.outerHTML')[:300])
   choose('O')
   page.locator('#export-open').click()
   with page.expect_download(timeout=15000) as downloaded:
    page.locator('#export-options button').filter(has_text='SVG').first.click()
   svg_source=open(downloaded.value.path(),encoding='utf8').read()
   assert 'fill-opacity="0.24"' in svg_source and 'stroke-dasharray="2 5"' in svg_source,(theme,'SVG fill lost')
   choose('S');assert page.locator('#properties .style-fill').count()==0,'Open segment should have no fill'
   assert not errors,errors
   page.close()
 finally:browser.close()
print('Round 268/270 Chromium closed fills PASS')
