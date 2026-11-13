"""Round18: magnetic freehand start/end and uncluttered UI in isolated Chromium."""
import os,json,math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd,download

def project(page,xy):
 rect=page.locator('#drawing').bounding_box()
 return (rect['x']+rect['width']/2+48*xy[0],rect['y']+rect['height']/2-48*xy[1])

def stroke(page,points,*,expect_magnet):
 x,y=project(page,points[0]);page.mouse.move(x,y);page.mouse.down()
 for point in points[1:]:
  tx,ty=project(page,point);page.mouse.move(tx,ty,steps=4)
 if expect_magnet:
  markers=page.locator('.freehand-snap-indicator')
  assert markers.count()>=1,'Missing live magnet indicator'
 page.mouse.up();page.wait_for_timeout(50)
 assert page.locator('.draft-freehand').count()==0
 return [obj for obj in json.loads(download(page,'Save').read_text())['objects'] if obj['type']=='freehand'][-1]

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
  page.wait_for_function('!!document.querySelector("[data-tool-choice=freehand]")')
  assert page.locator('#object-search').is_visible()
  assert page.locator('#object-search-icon').get_attribute('aria-hidden')=='true'
  assert page.locator('#show-hidden').locator('xpath=..').locator('.mini-help').count()==0
  assert page.locator('#freehand-close option:not([hidden])').count()==2
  assert page.locator('.mini-help').count()==0
  for source in ['A=(0,0)','B=(4,0)','Segment(A,B)']:cmd(page,source)
  page.locator('[data-tool-choice="freehand"]').click()
  points=[[1,.18],[1.6,.9],[2.4,.85],[3,.12]]
  joined=stroke(page,points,expect_magnet=True)
  assert joined['closed'] is False
  assert abs(joined['path'][0][1])<1e-7,joined['path'][0]
  assert abs(joined['path'][-1][1])<1e-7,joined['path'][-1]
  assert abs(joined['path'][0][0]-1)<.08,joined['path'][0]
  assert abs(joined['path'][-1][0]-3)<.08,joined['path'][-1]
  saved=joined['path'][:]
  page.locator('#undo').click();assert page.locator('#object-count').inner_text()=='3'
  page.locator('#redo').click();assert page.locator('#object-count').inner_text()=='4'
  after=[o for o in json.loads(download(page,'Save').read_text())['objects'] if o['type']=='freehand']
  assert after[0]['path']==saved
  # Disabled joining disables endpoint attraction, including preview markers.
  page.locator('#freehand-close').evaluate('''el=>{el.value='open';el.dispatchEvent(new Event('change',{bubbles:true}))}''')
  assert page.locator('#freehand-close').input_value()=='open'
  page.locator('[data-tool-choice="freehand"]').click()
  unjoined=stroke(page,[[.8,.17],[1.4,1.1],[2.2,1.0],[2.8,.15]],expect_magnet=False)
  assert unjoined['closed'] is False
  assert unjoined['path'][0][1]>.07,unjoined['path'][0]
  assert unjoined['path'][-1][1]>.07,unjoined['path'][-1]
  # Selected properties: Center view is before Bring forward.
  page.locator(f'#objects .object[data-id="{joined["id"]}"]').click()
  order=page.locator('#properties .props-actions button').all_inner_texts()
  assert order.index('Center view')<order.index('Bring forward'),order
  # No help cursor, no Hide explanation icon, persistent search on mobile.
  page.set_viewport_size({'width':390,'height':800})
  page.locator('#left-collapse').click()
  assert page.locator('#object-search').is_visible()
  assert page.locator('#object-search-icon').count()==1
  assert not errors,errors
  browser.close()
 print('ROUND18_MAGNET_BROWSER_PASS: start/end magnet, preview, canceled mode, undo/redo, saved project, search, Hidden, reordered actions, mobile')

if __name__=='__main__':run()
