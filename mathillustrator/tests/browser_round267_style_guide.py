"""Round 267: styled geometry, formula widths, bilingual guide, and render/export."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  for theme in ('light','dark'):
   page=browser.new_page(viewport={'width':1280,'height':850})
   errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
   page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
   algebra=page.locator('#unified-algebra-input')
   for cmd in ('A = (0,0)','B = (3,0)','S = Segment(A,B)','C = Circle(A,B)','f(x) = sin(x)'):
    algebra.fill(cmd);algebra.press('Enter')
   for name,mode,tag in [('A','cross','path'),('B','empty','circle'),('S','dashed','line'),('C','dotted','circle')]:
    page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text=name)).first.click()
    label='Point style' if name in ('A','B') else 'Line style'
    sel=page.locator('#properties').get_by_label(label,exact=True)
    assert sel.count()==1,(theme,name,'missing style')
    sel.select_option(mode)
    snap=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
    obj=next(x for x in snap['objects'] if x['name']==name)
    assert obj['style']['pointShape' if label=='Point style' else 'linePattern']==mode,(theme,name,obj['style'])
    svg=page.locator('#drawing [data-id="'+obj['id']+'"]')
    assert svg.count()>0,(name,'no SVG')
    if label=='Line style':
     assert svg.first.get_attribute('stroke-dasharray')==('7 5' if mode=='dashed' else '2 5'),(name,svg.first.evaluate('(el)=>el.outerHTML')[:400])
    if mode=='cross':assert svg.first.locator('path').count()==1
    if mode=='empty':assert svg.first.get_attribute('fill')=='transparent'
   page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='f')).first.click()
   page.locator('#properties').get_by_label('Line style',exact=True).select_option('dashed')
   f_obj=next(o for o in page.evaluate('()=>JSON.parse(window.__round36Snapshot())')['objects'] if o['name']=='f')
   f_path=page.locator('#drawing [data-id="'+f_obj['id']+'"]')
   assert f_path.first.get_attribute('stroke-dasharray')=='7 5',f_path.first.evaluate('(el)=>el.outerHTML')[:300]
   equation=page.locator('#properties .formula-expression-field input').first
   assert equation.count() and equation.evaluate('(el)=>el.getBoundingClientRect().width/el.parentElement.getBoundingClientRect().width')>.95
   page.locator('#undo').click()
   after_undo=next(o for o in page.evaluate('()=>JSON.parse(window.__round36Snapshot())')['objects'] if o['name']=='f')
   assert after_undo['style'].get('linePattern') is None
   page.locator('#redo').click()
   after_redo=next(o for o in page.evaluate('()=>JSON.parse(window.__round36Snapshot())')['objects'] if o['name']=='f')
   assert after_redo['style']['linePattern']=='dashed'
   # Verify the actual exported SVG includes the line style and point glyphs.
   page.locator('#export-open').click()
   with page.expect_download(timeout=12000) as download_info:
    page.locator('#export-options button').filter(has_text='SVG').first.click()
   svg_source=open(download_info.value.path(),encoding='utf-8').read()
   assert 'stroke-dasharray="7 5"' in svg_source and 'stroke-dasharray="2 5"' in svg_source
   assert 'image/svg+xml' in svg_source or '<svg' in svg_source
   page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='C')).first.click()
   page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='C')).first.click()
   expression=page.locator('#properties .construction-expression-editor')
   assert expression.count()==1
   assert abs(expression.evaluate('(el)=>el.getBoundingClientRect().width/el.parentElement.getBoundingClientRect().width')-1)<0.05,expression.evaluate('(el)=>[el.getBoundingClientRect().width,el.parentElement.getBoundingClientRect().width]')
   assert not errors,errors
   page.close()
  # Tutorial navigation/definitions in both languages, and mobile overflow.
  guide=browser.new_page(viewport={'width':390,'height':800})
  from pathlib import Path
  guide.set_content(Path(__file__).resolve().parents[1].joinpath('tutorial.html').read_text(),wait_until='load')
  for lang in ('en','zh'):
   guide.evaluate('(l)=>{document.documentElement.dataset.lang=l;document.documentElement.lang=l}',lang)
   for id in ['syntax','real-functions','complex-functions','algebra','construction-arguments']:
    assert guide.locator('#'+id).count()==1,id
   assert 'rootIndex' in guide.locator('#construction-arguments div.lang.'+lang).inner_text()
   assert guide.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),(lang,guide.evaluate('document.documentElement.scrollWidth'))
  guide.close()
 finally:browser.close()
print('Round 267 Chromium styles, full-width fields and tutorial PASS')
