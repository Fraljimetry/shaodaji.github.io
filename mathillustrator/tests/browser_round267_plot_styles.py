"""Round 267: line-pattern interoperability with all stroked 2D plot modes."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  p=b.new_page(viewport={'width':1280,'height':820});errors=[];p.on('pageerror',lambda err:errors.append(str(err)))
  p.set_content(inline_html(expose_state=True),wait_until='load')
  entry=p.locator('#unified-algebra-input');entry.fill('b = Slider(0, 10, 0.1, 2)');entry.press('Enter')
  cases=[('function','sin(b*x)',None),('parametric','b*cos(t)','b*sin(t)'),('implicit','x^2+y^2=b^2',None),('vectorField','-b*y','b*x')]
  for mode,first,second in cases:
   p.locator('#plot-mode').select_option(mode)
   p.locator('#command').fill(first)
   if second:p.locator('#command-y').fill(second)
   p.locator('#command').press('Enter')
   snap=p.evaluate('()=>JSON.parse(window.__round36Snapshot())');obj=next(o for o in reversed(snap['objects']) if o['type']==mode)
   p.locator('#objects .object').filter(has=p.locator('.object-label strong',has_text=obj['name'])).first.click()
   picker=p.locator('#properties').get_by_label('Line style',exact=True)
   assert picker.count()==1,mode
   picker.select_option('dotted')
   svg=p.locator('#drawing [data-id="'+obj['id']+'"]')
   p.wait_for_timeout(80)
   matches=svg.evaluate_all("els=>els.flatMap(el=>[el,...el.querySelectorAll('path,line,polyline,circle,ellipse')]).filter(x=>x.getAttribute('stroke-dasharray')==='2 5').length")
   assert matches>0,(mode,svg.first.evaluate('(el)=>el.outerHTML')[:400] if svg.count() else 'not rendered')
   changed=next(o for o in p.evaluate('()=>JSON.parse(window.__round36Snapshot())')['objects'] if o['id']==obj['id'])
   assert changed['style']['linePattern']=='dotted'
  assert not errors,errors
  p.close()
 finally:b.close()
print('Round 267 Chromium 2D plot style parity PASS')
