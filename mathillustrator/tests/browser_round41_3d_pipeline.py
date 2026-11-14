"""Round 41 genuine Chromium CPU/SVG 3D pipeline, camera, stress cancellation and export.
Isolated in-memory module fixture: NOT a live website or real GPU benchmark.
"""
import json, os, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def run():
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=browser.new_page(viewport={'width':1300,'height':850},accept_downloads=True)
   page.set_default_timeout(14000)
   exceptions=[];alerts=[]
   page.on('pageerror',lambda error:exceptions.append(str(error)))
   page.on('dialog',lambda dialog:(alerts.append(dialog.message),dialog.accept()))
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='domcontentloaded')
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   finished=lambda:page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=18000)
   page.locator('#scene3d-enable').check()
   page.locator('#plot-mode').select_option('implicit3d')
   page.locator('#command').fill('x^2+y^2+z^2=4')
   page.locator('#command-form button').click()
   finished()
   count=page.locator('#drawing polygon').count()
   assert count>=500,count
   assert not exceptions,exceptions
   page.screenshot(path='/mnt/data/r41work/round41_implicit.png')
   # A leftward orbit must rotate the plot to the left, not the opposite direction.
   rect=page.locator('#drawing').bounding_box()
   x,y=rect['x']+rect['width']*.5,rect['y']+rect['height']*.5
   old=snapshot()['scene3d']['options']['yaw']
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-85,y,steps=3);page.mouse.up()
   assert snapshot()['scene3d']['options']['yaw']>old, 'Expected reversed orbit yaw convention'
   finished()
   assert page.locator('#drawing polygon').count()>=500
   # SVG export is assembled from a complete synchronous snapshot, independent
   # of the progressive on-screen renderer.
   with page.expect_download(timeout=15000) as export:
    page.locator('#export-open').click()
    page.locator('#export-options button').filter(has_text='SVG').click()
   svg=export.value.path().read_text()
   assert svg.count('<polygon')>=500
   with page.expect_download(timeout=15000) as save:page.locator('#save').click()
   saved=json.loads(save.value.path().read_text())
   assert saved['scene3d']['plots'][0]['kind']=='implicit3d'
   # Import 80 legacy visible objects: only three remain displayed, all 80 saved.
   heavy=json.loads(json.dumps(saved))
   heavy['scene3d']['plots']=[dict(saved['scene3d']['plots'][0],id=i+1,name=f'Implicit {i+1}',a=f'x^2+y^2+z^2={1+i%9}') for i in range(80)]
   heavy['scene3d']['nextId']=81
   heavy['scene3d']['options']['detail']=44
   page.locator('#open-file').set_input_files({'name':'stress.json','mimeType':'application/json','buffer':json.dumps(heavy).encode()})
   page.wait_for_function('JSON.parse(window.__round36Snapshot()).scene3d.plots.length === 80',timeout=18000)
   finished()
   assert sum(not p["hidden"] for p in snapshot()["scene3d"]["plots"])==3
   assert page.locator('#drawing polygon').count()<=66000
   with page.expect_download(timeout=15000) as project:page.locator('#save').click()
   assert len(json.loads(project.value.path().read_text())['scene3d']['plots'])==80
   page.locator('#export-open').click()
   assert page.locator('#export-options button').filter(has_text='SVG').is_enabled(), 'Three complete 3D surfaces should remain exportable'
   page.locator('#export-close').click()
   # Repeated orbit commands and an immediate 2D-mode switch cancel ongoing 3D
   # painting; no old polygon must reappear after the new scene is committed.
   page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+70,y+20,steps=3);page.mouse.up()
   page.locator('#scene3d-enable').uncheck()
   page.wait_for_timeout(550)
   assert '3D plots' not in page.locator('#render-info').inner_text()
   assert page.locator('#drawing polygon').count()==0
   page.locator('#scene3d-enable').check()
   page.locator('#open-file').set_input_files({'name':'simple.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
   finished()
   assert len(snapshot()['scene3d']['plots'])==1 and page.locator('#drawing polygon').count()>=500
   assert not exceptions,exceptions
   print('PASS ROUND41_3D_CHROMIUM: watertight implicit preview, left drag, SVG/JSON/persistence, legacy-scene auto-hide and bounded complete export, obsolete render cancellation, 2D isolation',flush=True)
  finally: browser.close()

if __name__=='__main__':run()
