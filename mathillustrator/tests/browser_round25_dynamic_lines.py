"""Round 25 real isolated Chromium actions; no public-site HTTP assertions."""
import json, os, sys
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd, download

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
   errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)))
   page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   page.locator('#auto-pan').uncheck()
   page.locator('#geometry-essential').uncheck()
   for title in ('Parallel through point','Perpendicular through point','Intersection point'):
    assert page.get_by_role('button',name=title).is_visible(),title
   for text in ['A=(0,0)','B=(4,0)','C=(1,-3)','D=(1,3)','E=(0,2)','Line(A,B)','Line(C,D)']:
    cmd(page,text)
   doc=json.loads(download(page,'Save').read_text());objects={o['name']:o for o in doc['objects']}
   horizontal=[o for o in doc['objects'] if o['type']=='line'][0]['id']
   vertical=[o for o in doc['objects'] if o['type']=='line'][1]['id']
   eid=objects['E']['id']
   bbox=page.locator('#drawing').bounding_box();cx=bbox['x']+bbox['width']/2;cy=bbox['y']+bbox['height']/2
   def click_world(x,y):page.mouse.click(cx+x*48,cy-y*48)
   page.locator('[data-tool-choice="parallelThrough"]').click()
   click_world(0,2);click_world(-3,0)
   out=json.loads(download(page,'Save').read_text());parallel=[o for o in out['objects'] if o['type']=='parallelThrough'];assert len(parallel)==1,out['objects']
   assert parallel[0]['refs']==[eid,horizontal],parallel
   assert page.locator(f'#drawing line[data-id="{parallel[0]["id"]}"]').count()>=1
   page.locator('[data-tool-choice="perpendicularThrough"]').click()
   click_world(0,2);click_world(-2,0)
   out=json.loads(download(page,'Save').read_text());perp=[o for o in out['objects'] if o['type']=='perpendicularThrough'];assert len(perp)==1
   assert perp[0]['refs']==[eid,horizontal]
   page.locator('[data-tool-choice="intersection"]').click()
   click_world(-2,2);click_world(1,-2)
   out=json.loads(download(page,'Save').read_text());cross=[o for o in out['objects'] if o['type']=='intersection'];assert len(cross)==1
   assert cross[0]['refs']==[parallel[0]['id'],vertical],cross
   target=page.locator(f'#drawing circle[data-id="{cross[0]["id"]}"]');assert target.count()==1
   actual=target.evaluate('(el)=>[+el.getAttribute("cx"),+el.getAttribute("cy")]')
   assert abs(actual[0]-(cx-bbox['x']+48))<.2 and abs(actual[1]-(cy-bbox['y']-96))<.2,actual
   # Empty-space point construction through selected line is one undo operation.
   before=len(out['objects']);page.locator('[data-tool-choice="parallelThrough"]').click()
   click_world(-2,4);click_world(-2,0)
   out2=json.loads(download(page,'Save').read_text());assert len(out2['objects'])==before+2
   page.locator('#undo').click();out3=json.loads(download(page,'Save').read_text());assert len(out3['objects'])==before
   page.locator('#redo').click();assert len(json.loads(download(page,'Save').read_text())['objects'])==before+2
   # Cancellation, invalid source line, original refs must not mutate.
   page.locator('[data-tool-choice="intersection"]').click();click_world(-2,0)
   page.keyboard.press('Escape')
   assert len(json.loads(download(page,'Save').read_text())['objects'])==before+2
   # EN -> ZH leaves all tool groups and derived points accessible.
   page.locator('#ui-language').select_option('zh')
   assert page.get_by_role('button',name='交点',exact=True).count()==1
   page.locator('#ui-language').select_option('en')
   # Unsupported TikZ must be explicitly disabled, while SVG remains available.
   page.locator('#export-open').click();assert page.get_by_role('button',name='TikZ / PGF').is_disabled()
   svg=download(page,'SVG').read_text();assert cross[0]['id'] in svg
   page.set_viewport_size({'width':390,'height':780});assert page.locator('#drawing').is_visible()
   # A real touch-enabled Chromium page must preserve the pointer-down
   # source target when setPointerCapture retargets pointerup to the SVG root.
   touch=browser.new_page(viewport={'width':1200,'height':790},has_touch=True,accept_downloads=True)
   touch_errors=[];touch.on('pageerror',lambda exc:touch_errors.append(str(exc)))
   touch.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
   touch.locator('#auto-pan').uncheck();touch.locator('#geometry-essential').uncheck()
   for text in ['TA=(0,0)','TB=(4,0)','TE=(0,2)','Line(TA,TB)']:cmd(touch,text)
   origin=touch.locator('#drawing').bounding_box();ox=origin['x']+origin['width']/2;oy=origin['y']+origin['height']/2
   touch.locator('[data-tool-choice="parallelThrough"]').click()
   touch.touchscreen.tap(ox,oy-96);touch.touchscreen.tap(ox-120,oy)
   saved=json.loads(download(touch,'Save').read_text())
   assert len([o for o in saved['objects'] if o['type']=='parallelThrough'])==1
   assert not touch_errors,touch_errors
   touch.close()
   assert not errors,errors
   print('ROUND25_CHROMIUM_PASS: mouse constructions, live crossing point, JSON IDs, undo/redo, canceled gesture, EN/ZH, SVG/TikZ fail closed, mobile viewport, native touch pointer capture')
  finally:browser.close()
if __name__=='__main__':run()
