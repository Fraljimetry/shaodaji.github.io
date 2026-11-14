"""Round40 Chromium: isolated 3D domain surface, properties, history, file export/reopen and i18n."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=b.new_page(viewport={'width':1440,'height':850},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept());page.set_default_timeout(9000)
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   snapshot=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   page.locator('#scene3d-enable').check()
   assert page.locator('#plot-mode option').count()==5
   page.locator('#plot-mode').select_option('domain3d')
   page.locator('#command').fill('z^2+1');page.locator('#command-form button').click()
   plot=snapshot()['scene3d']['plots'][0]
   assert plot['kind']=='domain3d' and plot['heightMode']=='modulus' and plot['bounds']['zMax']>=32
   assert page.locator('#drawing polygon').count()>100
   height=page.locator('#properties select').filter(has=page.locator('option[value="argument"]'))
   height.select_option('argument')
   assert snapshot()['scene3d']['plots'][0]['heightMode']=='argument' and snapshot()['scene3d']['plots'][0]['bounds']['zMin']<0
   page.locator('#undo').click();assert snapshot()['scene3d']['plots'][0]['heightMode']=='modulus'
   page.locator('#redo').click();assert snapshot()['scene3d']['plots'][0]['heightMode']=='argument'
   page.locator('#properties select').filter(has=page.locator('option[value="contours"]')).select_option('contours')
   assert snapshot()['scene3d']['plots'][0]['colorMode']=='contours'
   with page.expect_download(timeout=10000) as download:page.locator('#save').click()
   saved=json.loads(download.value.path().read_text())
   assert saved['scene3d']['plots'][0]['kind']=='domain3d'
   with page.expect_download(timeout=10000) as exported:
    page.locator('#export-open').click();page.locator('#export-options button').filter(has_text='SVG').click()
   assert '<polygon' in exported.value.path().read_text()
   page.locator('#new').click()
   page.locator('#open-file').set_input_files({'name':'round40.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
   assert snapshot()['scene3d']['plots'][0]['kind']=='domain3d'
   page.locator('#objects-3d .object').first.click()
   page.locator('#ui-language').select_option('zh')
   assert page.locator('#properties').get_by_text('高度表示').count()==1
   page.set_viewport_size({'width':390,'height':810})
   assert page.locator('#drawing').count()==1 and not errors,errors
   print('PASS ROUND40_3D_CHROMIUM: fifth mode, argument/modulus, safe bounds, colors, SVG/JSON/history/import/zh/mobile')
  finally:b.close()
if __name__=='__main__':run()
