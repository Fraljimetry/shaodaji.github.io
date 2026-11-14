"""Round26 real isolated Chromium interaction tests. No live-site claims."""
import json,math,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   assert page.locator('[data-tool-choice="circleIntersection"]').count()==1
   page.locator('#auto-pan').uncheck();assert page.locator('[data-tool-choice="midpoint"]').is_visible()
   assert page.get_by_role('button',name='Line–circle intersections').is_visible()
   for text in ['A=(-4,0)','B=(4,0)','C=(0,0)','D=(0,2)','Line(A,B)','Circle(C,D)']:
    cmd(page,text)
   initial=json.loads(download(page,'Save').read_text())
   line=next(o for o in initial['objects'] if o['type']=='line')
   circle=next(o for o in initial['objects'] if o['type']=='circle')
   box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   def click(x,y):page.mouse.click(cx+x*48,cy-y*48)
   page.locator('[data-tool-choice="circleIntersection"]').click()
   click(-3,0);click(1.2,1.6)
   data=json.loads(download(page,'Save').read_text());pts=[o for o in data['objects'] if o['type']=='circleIntersection'];assert len(pts)==2,pts
   assert set(o['branch'] for o in pts)=={-1,1};assert all(o['refs']==[line['id'],circle['id']] for o in pts)
   for obj in pts:
    target=page.locator(f'#drawing circle[data-id="{obj["id"]}"]')
    assert target.count()==1
    x=float(target.get_attribute('cx'))
    assert abs(x-(box['width']/2 + obj['branch']*96))<.5,(x,obj)
   page.locator('#undo').click()
   assert not [o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='circleIntersection']
   page.locator('#redo').click()
   assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='circleIntersection'])==2
   page.locator('[data-tool-choice="circleIntersection"]').click()
   click(-3,0);page.keyboard.press('Escape')
   assert len([o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='circleIntersection'])==2
   page.locator('#ui-language').select_option('zh');assert page.get_by_role('button',name='直线与圆交点').count()==1
   page.locator('#ui-language').select_option('en')
   page.locator('#export-open').click();assert page.get_by_role('button',name='TikZ / PGF').is_disabled()
   svg=download(page,'SVG').read_text();assert all(o['id'] in svg for o in pts)

   # Draw a near-loop that has a sharp pen-up adjustment relative to the
   # first sampled segment; the stored samples remain raw/Ultra-smoothed.
   # Tangency creates exactly one dependent root, including circle-first clicks.
   for item in ['T1=(2,-4)','T2=(2,4)','Line(T1,T2)']:cmd(page,item)
   before_tangent=len(json.loads(download(page,'Save').read_text())['objects'])
   page.locator('[data-tool-choice="circleIntersection"]').click()
   click(1.2,1.6);click(2,3)
   tangent=json.loads(download(page,'Save').read_text())
   assert len(tangent['objects'])==before_tangent+1
   assert tangent['objects'][-1]['type']=='circleIntersection'
   assert tangent['objects'][-1]['branch']==-1
   # Preserve pointer-down SVG source identity through native touch capture.
   touch=browser.new_page(viewport={'width':1200,'height':790},has_touch=True,accept_downloads=True)
   terr=[];touch.on('pageerror',lambda e:terr.append(str(e)))
   touch.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   touch.locator('#auto-pan').uncheck();assert touch.locator('[data-tool-choice="midpoint"]').is_visible()
   for item in ['P=(-4,0)','Q=(4,0)','O=(0,0)','R=(0,2)','Line(P,Q)','Circle(O,R)']:cmd(touch,item)
   tb=touch.locator('#drawing').bounding_box();tx=tb['x']+tb['width']/2;ty=tb['y']+tb['height']/2
   touch.locator('[data-tool-choice="circleIntersection"]').click()
   touch.touchscreen.tap(tx-3*48,ty)
   touch.touchscreen.tap(tx+1.2*48,ty-1.6*48)
   td=json.loads(download(touch,'Save').read_text())
   assert len([o for o in td['objects'] if o['type']=='circleIntersection'])==2,td['objects']
   assert not terr,terr
   touch.close()

   page.locator('[data-tool-choice="freehand"]').click()
   start=(box['x']+box['width']*.52+140,box['y']+box['height']*.55)
   mid=(box['x']+box['width']*.52,box['y']+box['height']*.55)
   page.mouse.move(*start);page.mouse.down()
   for i in range(1,121):
    theta=2*math.pi*.98*i/120
    page.mouse.move(mid[0]+140*math.cos(theta),mid[1]+105*math.sin(theta))
   page.mouse.move(start[0]+6,start[1]+7)
   page.mouse.up()
   latest=json.loads(download(page,'Save').read_text())
   free=next(o for o in reversed(latest['objects']) if o['type']=='freehand')
   assert free['closed'] is True,free
   path=page.locator(f'#drawing path.clickable[data-id="{free["id"]}"]')
   assert path.count()==2,path.count()
   d=path.first.get_attribute('d');assert d.startswith('M') and d.endswith(' Z') and d.count(' C')>=50,d[:300]
   # New periodic path moves its seam away from the original abrupt endpoint;
   # it never emits an old appended one-off closing cubic.
   numbers=[float(v) for v in __import__('re').findall(r'-?(?:\d+(?:\.\d+)?|\.\d+)',d)]
   assert len(numbers)%6==2
   x0,y0=numbers[:2];rx0,ry0=free['path'][0]
   screen_raw=[box['width']/2 + (rx0)*48,box['height']/2 - (ry0)*48]
   assert math.hypot(x0-screen_raw[0],y0-screen_raw[1])>0.5,(x0,y0,screen_raw)
   page.set_viewport_size({'width':390,'height':780});assert page.locator('#drawing').is_visible()
   assert not errors,errors
   print('ROUND26_CHROMIUM_PASS: signed line-circle branches, real canvas clicks, SVG, atomic undo/redo, Escape, Chinese, TikZ safeguard, freehand periodic seam, mobile')
  finally:browser.close()
if __name__=='__main__':run()
