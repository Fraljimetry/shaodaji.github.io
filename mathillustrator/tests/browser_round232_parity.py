"""Round 232: full Algebra/Objects dock parity and named geometric constructions."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1280,'height':850})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snap=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#algebra-toggle').click()
   def enter(text):
    page.locator('#algebra-input').fill(text);page.locator('#algebra-form button').click()
   enter('a = Slider(0, 10, 0.5, 3)')
   enter('A = (0,0)');enter('B = (a,0)');enter('s = Segment(A,B)')
   assert any(o['name']=='s' and o['type']=='segment' for o in snap()['objects'])
   assert page.locator('#algebra-list [data-id]').count()==3
   assert page.locator('#objects [data-id]').count()==3
   def sizes():
    return page.evaluate('''() => {const a=document.querySelector('#algebra-panel').getBoundingClientRect(),p=document.querySelector('#properties-dock').getBoundingClientRect();return {aTop:a.top,aBottom:a.bottom,pTop:p.top,pBottom:p.bottom,pHeight:p.height,viewport:innerHeight}}''')
   box=sizes();assert abs(box['aBottom']-box['pTop'])<3,box
   assert box['pHeight']>=100 and box['pBottom']<=box['viewport']+3,box
   page.locator('#algebra-list [data-slider="a"] .algebra-entry-label').click()
   border=page.locator('#properties .slider-border-control')
   assert border.count()==1
   assert page.locator('#properties .style-opacity').evaluate('(x)=>x.contains(document.querySelector(".slider-border-control"))')
   assert border.bounding_box()['y']>page.locator('#properties .style-opacity input[type=text]').bounding_box()['y']
   # Collapse/expand must return to the same dock height and leave Algebra usable.
   before=sizes()['pHeight'];page.locator('#properties-toggle').click()
   assert page.locator('#properties').is_hidden()
   collapsed=sizes();assert collapsed['pHeight']<before/2,collapsed
   page.locator('#properties-toggle').click();assert page.locator('#properties').is_visible()
   assert abs(sizes()['pHeight']-before)<5,(before,sizes())
   split=page.locator('#properties-splitter');old=sizes()['pHeight']
   split.focus();page.keyboard.press('ArrowUp')
   assert sizes()['pHeight']>old,(old,sizes())
   # Real pointer dragging uses the same splitter on either tab.
   previous=sizes()['pHeight'];rect=split.bounding_box()
   page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2)
   page.mouse.down();page.mouse.move(rect['x']+rect['width']/2,rect['y']-35,steps=5);page.mouse.up()
   assert sizes()['pHeight']>previous+15,(previous,sizes())
   page.locator('#algebra-list [data-id]').last.click()
   assert page.locator('#properties').get_by_label('Name').input_value()=='s'
   page.locator('#objects-tab').click()
   sid=next(o['id'] for o in snap()['objects'] if o['name']=='s')
   page.locator('#objects [data-id="'+sid+'"] .object-label').click()
   assert page.locator('#properties').get_by_label('Name').input_value()=='s'
   page.locator('#algebra-toggle').click()
   assert abs(sizes()['aBottom']-sizes()['pTop'])<3
   assert not errors,errors
   print('ROUND232_ALGEBRA_OBJECTS_PARITY_CHROMIUM_PASS')
  finally:browser.close()
if __name__=='__main__':run()
