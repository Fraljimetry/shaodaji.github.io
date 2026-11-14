"""R51N: right-panel New object style fields never overlap; upright arc/intersections."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def intersects(a,b):
 return min(a['x']+a['width'],b['x']+b['width'])>max(a['x'],b['x'])+.5 and min(a['y']+a['height'],b['y']+b['height'])>max(a['y'],b['y'])+.5

def main():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   for w in (1450,980,700):
    page=b.new_page(viewport={'width':w,'height':900})
    page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
    page.wait_for_timeout(160)
    if page.locator('#right-collapse').get_attribute('aria-expanded')=='false':
     page.locator('#right-collapse').click()
     page.wait_for_timeout(80)
    selectors=['#default-opacity','#default-width','#point-size']
    slots=page.locator('.rightpanel .style-controls-grid:has(#point-size) .style-slot')
    assert slots.count()==5,slots.count()
    # The right drawer can be narrow but must never draw the same space twice.
    rects=[]
    for sel in selectors:
     loc=page.locator(sel)
     assert loc.count()==1,(sel,loc.count())
     rects.append(loc.bounding_box())
    assert not any(intersects(rects[i],rects[j]) for i in range(3) for j in range(i+1,3)),(w,rects)
    assert rects[2]['y']>max(rects[0]['y']+rects[0]['height'],rects[1]['y']+rects[1]['height'])+2,(w,rects)
    # Also check captions themselves: earlier bug occurred in label text, not inputs.
    labels=[page.locator(f'{sel}').locator('xpath=..').bounding_box() for sel in selectors]
    assert not any(intersects(labels[i],labels[j]) for i in range(3) for j in range(i+1,3)),(w,labels)
    for tool in ['circularArc','circleIntersection']:
     svg=page.locator(f'[data-tool-choice="{tool}"] svg')
     assert svg.count()==1,tool
     circles=svg.locator('circle[fill="currentColor"]')
     pts=circles.evaluate_all('(items)=>items.map(c=>[+c.getAttribute("cx"),+c.getAttribute("cy")])')
     if tool=='circularArc':
      assert len(pts)==3 and pts[0][1]==pts[2][1] and pts[1][0]==12,pts
      path=svg.locator('path').first.get_attribute('d');assert path=='M4 16A8 8 0 0 1 20 16',path
     else:
      assert len(pts)==2 and pts[0][1]==pts[1][1]==12,pts
      assert svg.locator('path').first.get_attribute('d')=='M2 12H22'
    page.close()
   print('ROUND51N_CHROMIUM_PASS: upright circular arc and line-circle; no right-panel overlap at 1450/980/700',flush=True)
  finally:b.close()

if __name__=='__main__':main()
