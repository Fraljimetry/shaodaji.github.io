"""Round45 Chromium: atomic 3D frames, orbit preview, real locks, and recently-deleted 3D restore."""
import base64, io, json, os
from xml.etree import ElementTree as ET
from PIL import Image
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1420,'height':890},accept_downloads=True)
   page.set_default_timeout(50000)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   def saved():return json.loads(page.evaluate('window.__round36Snapshot()'))
   def scene():return saved()['scene3d']
   def complete():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=55000)
   def add(mode,formula):
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(formula)
    page.locator('#command-form button').click()
    complete()
   page.locator('#scene3d-enable').check();complete()
   add('implicit3d','cos(x+y+z)=cos(x)+cos(y)+cos(z)')
   page.locator('#scene3d-detail').fill('64');page.locator('#scene3d-detail').dispatch_event('change');complete()
   def full_faces():
    # Dense scenes intentionally use a raster preview, never thousands of live
    # polygons. The full-detail SVG is the authoritative face-count check.
    raster=page.locator('#drawing image[data-3d-raster]')
    if raster.count():
     data=raster.get_attribute('href');assert data.startswith('data:image/png;base64,')
     image=Image.open(io.BytesIO(base64.b64decode(data.split(',',1)[1]))).convert('RGBA')
     assert image.getchannel('A').getbbox(), 'blank dense frame'
    else:assert page.locator('#drawing polygon').count()>5000
    page.locator('#export-open').click()
    with page.expect_download(timeout=90000) as pending:page.locator('#export-options button',has_text='SVG').click()
    root=ET.fromstring(pending.value.path().read_bytes())
    count=len(root.findall('.//{http://www.w3.org/2000/svg}polygon'))
    assert count>5000,count
    return count
   before=full_faces()
   # Lock is a working edit guard, not a decorative icon. Hide remains independent.
   row=page.locator('#objects-3d .object').first
   row.get_by_role('button',name='Lock',exact=True).click();complete()
   assert scene()['plots'][0]['locked']
   assert page.locator('#objects-3d .object').first.get_by_role('button',name='Delete').is_disabled()
   assert page.locator('#properties').get_by_text('Locked').count()==1
   page.locator('#objects-3d .object').first.get_by_role('button',name='Hide').click();complete()
   assert scene()['plots'][0]['hidden'] and scene()['plots'][0]['locked']
   page.locator('#objects-3d .object').first.get_by_role('button',name='Show').click();complete()
   page.locator('#objects-3d .object').first.get_by_role('button',name='Unlock').click();complete()
   assert not scene()['plots'][0]['locked']
   # Neither vector nor dense raster frames may become transiently empty while orbiting.
   page.evaluate("""() => { const svg=document.querySelector('#drawing');window.__r45Counts=[];
     window.__r45Obs=new MutationObserver(()=>window.__r45Counts.push(svg.querySelectorAll('polygon, image[data-3d-raster]').length));
     window.__r45Obs.observe(svg,{childList:true,subtree:true}); }""")
   box=page.locator('#drawing').bounding_box();x=box['x']+box['width']*.55;y=box['y']+box['height']*.55
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+80,y+50,steps=7)
   page.wait_for_function("document.querySelector('#render-info').textContent.includes('drag preview')",timeout=55000)
   low=page.locator('#drawing polygon').count()
   assert low>50 and low<before,(low,before)
   assert page.locator('#scene3d-detail').input_value()=='64', 'preview must not change saved quality'
   page.mouse.move(x+115,y+35,steps=3);page.mouse.up();complete()
   after=full_faces()
   assert after>low*2,(low,after)
   counts=page.evaluate('window.__r45Counts');assert counts and min(counts)>0,counts
   assert scene()['options']['yaw']!= -38
   # Delete stores a full plot snapshot, then restore preserves ID and formula.
   entry=scene()['plots'][0].copy();page.locator('#objects-3d .object').first.get_by_role('button',name='Delete').click();complete()
   assert scene()['plots']==[]
   assert page.locator('#trash-count').inner_text()=='1'
   title=page.locator('#trash-items .trash-names');assert title.get_attribute('title')==entry['name']
   assert title.text_content().startswith('3D · ')
   page.locator('#trash-items button').first.evaluate('e=>e.click()');complete()
   assert len(scene()['plots'])==1 and scene()['plots'][0]==entry
   assert page.locator('#trash-count').inner_text()=='0'
   # Delete/restore after switching to 2D must still retain 3D plots and 2D objects.
   page.locator('#objects-3d .object').first.get_by_role('button',name='Delete').click();complete()
   page.locator('#scene3d-enable').uncheck()
   page.locator('#trash-items button').first.evaluate('e=>e.click()')
   assert len(scene()['plots'])==1 and scene()['plots'][0]==entry
   assert page.locator('#trash-count').inner_text()=='0'
   page.locator('#scene3d-enable').check();complete()
   assert page.locator('#objects-3d .object').count()==1
   assert not errors,errors
   print(f'PASS ROUND45_CHROMIUM: atomic orbit frames ({before}->{low}->{after}), low-detail preview, 3D lock, hide, deleted restore across 2D/3D modes')
  finally:browser.close()
if __name__=='__main__':run()
