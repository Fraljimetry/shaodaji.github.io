"""Round51J glyph contracts from actually rendered Chromium SVG, not stale source literals."""
import os, math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1480,'height':960})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(expose_state=True,legacy_search_expanded=False),wait_until='load')
   page.wait_for_selector('[data-tool-choice="circleInversion"] svg')
   result=page.evaluate('''() => {
    const svg=t=>document.querySelector(`[data-tool-choice="${t}"] svg`);
    const dots=e=>[...e.querySelectorAll('circle[fill="currentColor"]')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy'),+c.getAttribute('r')]);
    const segments=svg('translation').querySelectorAll('path');
    const trans=[...segments].map(p=>p.getTotalLength());
    const rotation=svg('rotation').querySelector('path');
    const inv=svg('circleInversion');const ring=inv.querySelector('circle:not([fill])');const ip=dots(inv);
    const radii=[...new Set([...document.querySelectorAll('[data-geometry-group] svg circle[fill="currentColor"]')].map(c=>+c.getAttribute('r')))];
    const res={trans,translationDots:dots(svg('translation')),rotationArc:rotation.getTotalLength(),invRadius:+ring.getAttribute('r'),invMarkers:ip,radii};
    return res;
   }''')
   assert len(result['trans'])==1 and result['trans'][0]>=28.5,result
   assert len(result['translationDots'])==4,result
   assert result['rotationArc']>14.9,result
   assert result['invRadius']>=9,result
   assert result['radii']==[2.8],result
   p0,p1,p2=result['invMarkers']
   assert abs((p1[0]-p0[0])*(p2[0]-p0[0])-result['invRadius']**2)<1e-7,result
   for t in ['parametric','implicit']:
    page.locator('#plot-mode').select_option(t)
    icon=page.locator('#plot-mode-preview svg')
    assert icon.count()==1 and icon.locator('circle').count()==0,t
    assert icon.locator('path').count()==1,t
    d=icon.locator('path').get_attribute('d')
    if t=='parametric':
     assert d.count('C')>50 and 'Z' not in d and d.count('M')==1,(t,d[:100])
    else:
     # Compact oval and separate noncompact branch of nonsingular Weierstrass cubic.
     assert d.count('M')==3 and 'Z' in d and d.count('L')>=200,(t,d[:100])
    # All SVG paths must be renderable and remain within the glyph viewbox.
    box=icon.locator('path').evaluate('(p)=>{const b=p.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height,len:p.getTotalLength()}}')
    assert box['len']>15 and box['x']>=-1.5 and box['y']>=-1.5 and box['x']+box['w']<=25.5 and box['y']+box['h']<=25.5,(t,box)
   assert not errors,errors
   print('ROUND51J_CHROMIUM_PASS: longer paired translation segments, radius-10 rotation, radius-9 exact inversion, uniform 2.8-point markers, smooth point-free spiral, separate elliptic-cubic branches')
  finally:browser.close()
if __name__=='__main__':run()
