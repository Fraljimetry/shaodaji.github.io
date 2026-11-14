"""Round 51C: real pointer sequences, unambiguous object list, LaTeX defaults,
Show layout, and a 2-circle dynamic Geometry smoke. Offline Chromium only.
"""
import json,os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def main():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1500,'height':980},accept_downloads=True)
   page.set_default_timeout(18000)
   errors=[];page.on('pageerror',lambda error: errors.append(str(error)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.wait_for_timeout(180)
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def command(text):
    page.locator('#command').fill(text);page.locator('#command-form button').click();page.wait_for_timeout(100)
   def center(sel):
    page.locator(sel).first.wait_for(state='visible',timeout=15000)
    box=page.locator(sel).first.bounding_box();assert box,sel
    return box['x']+box['width']/2,box['y']+box['height']/2
   show=page.locator('[aria-label="Show"]')
   assert show.locator('.field').first.inner_text().startswith('Label placement')
   assert show.locator('.check').count()==3
   assert page.locator('#label-placement').input_value()=='avoid'
   print('stage: label placement precedes Grid / Axes / Labels PASS',flush=True)
   page.locator('#auto-pan').uncheck()
   for expr in ['A=(-1,0)','B=(-1,3)','C=(2,0)','D=(2,3)','Circle(A,B)','Circle(C,D)','Segment(A,C)']:
    command(expr)
   page.locator('[data-tool-choice="select"]').click()
   page.wait_for_function('document.querySelectorAll("#drawing [data-id]").length >= 7',timeout=15000)
   page.locator('#object-search').fill('WillNotMatch')
   ax,ay=center('#drawing circle[data-id="o1"]')
   bx,by=center('#drawing circle[data-id="o2"]')
   # two separate OS-style mouse click sequences with a redraw between.
   page.mouse.click(ax,ay);page.wait_for_timeout(55)
   assert page.locator('#object-search').input_value()=='WillNotMatch','first click must not navigate'
   page.mouse.click(ax,ay);page.wait_for_timeout(125)
   assert page.locator('#object-search').input_value()=='','second real click must reveal Objects row'
   assert page.locator('#objects .object[data-id="o1"]').count()==1
   assert page.evaluate('document.activeElement?.dataset?.id')=='o1'
   print('stage: real two-click mouse sequence navigates once, focus on list row PASS',flush=True)
   page.locator('#object-search').fill('WillNotMatch')
   page.mouse.click(ax,ay);page.wait_for_timeout(50)
   page.mouse.click(bx,by);page.wait_for_timeout(90)
   assert page.locator('#object-search').input_value()=='WillNotMatch','different objects must not be interpreted as double-click'
   page.mouse.click(bx,by);page.wait_for_timeout(130)
   assert page.locator('#object-search').input_value()==''
   assert page.evaluate('document.activeElement?.dataset?.id')=='o2'
   print('stage: cross-object rapid click cannot false-navigate PASS',flush=True)
   # Use pixels on each circle boundary (not their interior).
   drawing=page.locator('#drawing').bounding_box();cx=drawing['x']+drawing['width']/2;cy=drawing['y']+drawing['height']/2
   left=(cx-4*48,cy);right=(cx+5*48,cy)
   page.locator('[data-tool-choice="circleCircleIntersection"]').click()
   page.mouse.click(*left);page.wait_for_timeout(85)
   page.mouse.click(*right);page.wait_for_timeout(160)
   intersections=[o for o in state()['objects'] if o['type']=='circleCircleIntersection']
   assert len(intersections)==2,intersections
   page.locator('[data-tool-choice="select"]').click()
   for o in intersections:
    row=page.locator('#objects .object[data-id="'+o['id']+'"]')
    text=row.locator('small').inner_text();title=row.locator('small').get_attribute('title')
    assert text=='Circle–circle',(text,title)
    assert '?' not in text and '?' not in title,(text,title)
    assert 'circle' in title.lower() and ' and ' in title,(text,title)
   print('stage: constructed circle intersection subtitles compact, complete hover, no question marks PASS',flush=True)
   page.locator('#object-search').fill('WillNotMatch')
   ring=page.locator('#drawing circle[data-id="o5"]').first.bounding_box()
   assert ring,ring
   # Select ring near the outer edge, where no source anchor is placed.
   rx=ring['x']+ring['width']*.006;ry=ring['y']+ring['height']*.5
   page.mouse.click(rx,ry);page.wait_for_timeout(45)
   assert page.locator('#object-search').input_value()=='WillNotMatch'
   page.mouse.click(rx,ry);page.wait_for_timeout(150)
   assert page.locator('#object-search').input_value()==''
   assert page.evaluate('document.activeElement?.dataset?.id')=='o5'
   print('stage: curved object double click works independently of point markers PASS',flush=True)
   # Default format is consistent for all newly generated Geometry objects.
   for oid,field_mode in [('o1','latex'),('o5','latex'),('o7','latex')]:
    page.locator(f'#objects .object[data-id="{oid}"]').click()
    fmt=page.locator('#properties .field').filter(has_text='Label format').locator('select')
    assert fmt.input_value()==field_mode,(oid,fmt.input_value())
   obj=next(o for o in state()['objects'] if o['id']=='o7')
   assert obj['displayLabelMode']=='latex',obj
   page.locator('#objects .object[data-id="o7"]').click()
   page.locator('#properties .field').filter(has_text='Displayed label').locator('input').fill(r'\alpha_1')
   page.locator('#properties .field').filter(has_text='Displayed label').locator('input').dispatch_event('change')
   page.wait_for_timeout(120)
   assert next(o for o in state()['objects'] if o['id']=='o7')['displayLabel']=='\\alpha_1'
   assert next(o for o in state()['objects'] if o['id']=='o7')['displayLabelMode']=='latex'
   print('stage: new Point, Circle, Segment label format defaults to LaTeX, saved edit PASS',flush=True)
   assert not errors,errors
   print('ROUND51C_CHROMIUM_PASS',flush=True)
  finally:browser.close()
if __name__=='__main__':main()
