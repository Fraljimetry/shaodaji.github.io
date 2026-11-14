"""Round 57: rendered inversion icon matches paired-point geometry in Chromium."""
import math,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 try:
  page=b.new_page(viewport={'width':1480,'height':900}); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(expose_state=True),wait_until='load');page.wait_for_timeout(250)
  result=page.evaluate('''() => {
   const icons=[...document.querySelectorAll('[data-tool-choice="circleInversion"] svg')];
   return icons.map(svg=>({
    rings:[...svg.querySelectorAll('circle:not([fill])')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy'),+c.getAttribute('r')]),
    dots:[...svg.querySelectorAll('circle[fill="currentColor"]')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy'),+c.getAttribute('r')]),
    paths:[...svg.querySelectorAll('path')].map(c=>c.getAttribute('d'))
   }));
  }''')
  assert result,result
  assert all(g==result[0] for g in result),result
  for g in result:
   assert len(g['rings'])==1 and len(g['dots'])==2 and len(g['paths'])==1,g
   cx,cy,r=g['rings'][0];(x,y,rad),(xx,yy,rad2)=g['dots']
   assert y==yy==cy and cx<x<cx+r<xx,g
   assert abs((x-cx)*(xx-cx)-r*r)<1e-9,g
   assert xx-x>rad+rad2 and xx+rad2<=24,g
   assert g['paths'][0]==f'M{x} 12H{xx}',g
  assert not errors,errors
  print('ROUND57_CHROMIUM_PASS: unmarked inversion center, two distinct correctly inverse points, horizontal segment, no clipping')
 finally:b.close()
