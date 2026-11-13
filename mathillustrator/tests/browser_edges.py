"""Additional isolated-browser regression for cancellation, drag, locks and double-click."""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
import json, os

def project(page):
    return json.loads(download(page,'Save').read_text())

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html());page.wait_for_timeout(80)
  cmd(page,'A=(0,0)');cmd(page,'B=(2,0)');cmd(page,'C=(0,2)')
  page.locator('#construction-tools [data-tool-choice="polygon"]').click()
  box=page.locator('#drawing').bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
  page.mouse.click(cx,cy);page.mouse.click(cx+95,cy);page.mouse.dblclick(cx,cy-95)
  page.wait_for_timeout(100)
  assert page.locator('#object-count').inner_text()=='4',f"Polygon creation failed: {page.locator('#object-count').inner_text()}"
  poly=project(page)['objects'][-1];assert poly['type']=='polygon' and len(poly['refs'])==3,poly
  page.locator('#basic-tools [data-tool-choice="select"]').click();page.wait_for_timeout(50)
  # Drag explicit anchor point A, then cancel via pointercancel. No partial edit is committed.
  item=page.locator('#drawing circle[data-id="o1"]');item.wait_for(state='visible',timeout=5000);r=item.bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+48,y+48)
  page.locator('#drawing').dispatch_event('pointercancel',{'pointerId':1})
  page.mouse.up();page.wait_for_timeout(70)
  assert project(page)['objects'][0]['xy']==[0,0], 'Cancel did not revert point'
  # Normal drag changes coordinates and creates undo state.
  item=page.locator('#drawing circle[data-id="o1"]');item.wait_for(state='visible',timeout=5000);r=item.bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+52,y-52);page.mouse.up()
  page.wait_for_timeout(70)
  assert project(page)['objects'][0]['xy']!=[0,0], 'Completed drag did not commit'
  page.locator('#undo').click();assert project(page)['objects'][0]['xy']==[0,0], 'Undo did not revert complete drag'
  # Lock A; direct deletion must be disabled and dependent deletion rejected.
  row=page.locator('#objects .object[data-id="o1"]');row.locator('button').nth(1).click()
  row=page.locator('#objects .object[data-id="o1"]');row.click()
  assert page.locator('#delete').is_disabled()
  assert project(page)['objects'][0]['locked'] is True
  assert not failures,failures
  print('CHROMIUM_EDGE_SMOKE_PASS: polygon double-click 3 vertices, canceled pointer rollback, completed drag, single undo, lock/delete protection')
  b.close()
if __name__=='__main__':run()
