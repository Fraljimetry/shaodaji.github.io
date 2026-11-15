"""Round 70 actual Chromium: 3D implicit discontinuities, SVG alpha,
lighting/camera invariance, saved settings, and undisturbed 2D state.
Uses the source-inline offline fixture, not an asserted live-site result.
"""
import json,os,xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def run():
 with sync_playwright() as pw:
  executable=os.environ.get('MATHILLUSTRATOR_CHROMIUM') or ('/usr/bin/chromium' if os.path.isfile('/usr/bin/chromium') else None)
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox'],**({'executable_path':executable} if executable else {}))
  try:
   page=browser.new_page(viewport={'width':1360,'height':850},accept_downloads=True)
   page.set_default_timeout(40000)
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.on('dialog',lambda dialog:dialog.accept())
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   state=lambda:json.loads(page.evaluate('window.__round36Snapshot()'))
   def complete():page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')",timeout=60000)
   def add(mode,text):
    page.locator('#plot-mode').select_option(mode)
    page.locator('#command').fill(text)
    page.locator('#command-form button').click();complete()
   def export_svg():
    if page.locator('#export-menu').is_hidden():page.locator('#export-open').click()
    with page.expect_download(timeout=20000) as event:
     page.locator('#export-options button').filter(has_text='SVG').click()
    return event.value.path().read_text()
   # 2D objects and settings survive the entire 3D editing pass.
   page.locator('#command').fill('A=(1,2)');page.locator('#command-form button').click()
   count2d=len(state()['objects'])
   page.locator('#scene3d-enable').check();complete()
   add('surface3d','sin(x)*cos(y)')
   assert page.locator('#drawing polygon').count()>400
   scene=state()['scene3d']
   assert scene['options']['lighting'] and scene['plots'][0]['kind']=='surface3d'
   # Export transparency: screen remains opaque; only export removes background.
   assert page.locator('#drawing rect').count()>=1
   page.locator('#scene3d-export-transparent').check()
   transparent=ET.fromstring(export_svg())
   ns={'s':'http://www.w3.org/2000/svg'}
   assert not transparent.findall('.//s:rect',ns),'transparent 3D SVG must not have backdrop rectangles'
   assert len(transparent.findall('.//s:polygon',ns))>400
   assert page.locator('#drawing rect').count()>=1,'screen background must remain present'
   page.locator('#scene3d-export-transparent').uncheck()
   opaque=ET.fromstring(export_svg())
   assert len(opaque.findall('.//s:rect',ns))==1,'opaque SVG must contain a background rectangle'
   # World-fixed lighting must not flash/change surface color during orbit.
   before=sorted(page.locator('#drawing polygon').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("fill"))'))
   page.locator('#scene3d-yaw').fill('122');page.locator('#scene3d-yaw').dispatch_event('change');complete()
   assert before==sorted(page.locator('#drawing polygon').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("fill"))'))
   # A reciprocal discontinuity has no zero set, including at odd grid density.
   add('implicit3d','1/x')
   page.locator('#objects-3d .object').filter(has_text='Surface 1').get_by_role('button',name='Hide').click();complete()
   page.locator('#scene3d-detail').fill('23');page.locator('#scene3d-detail').dispatch_event('change');complete()
   assert page.locator('#drawing polygon').count()==0,'pole must not draw an implicit surface'
   add('implicit3d','x')
   assert page.locator('#drawing polygon').count()>400,'genuine implicit plane was lost'
   snapshot=state()
   assert len(snapshot['objects'])==count2d
   assert snapshot['scene3d']['options']['detail']==23
   with page.expect_download(timeout=12000) as event:page.locator('#save').click()
   saved=json.loads(event.value.path().read_text())
   assert saved['scene3d']==snapshot['scene3d']
   page.locator('#scene3d-enable').uncheck()
   assert len(state()['objects'])==count2d
   page.locator('#scene3d-enable').check();complete()
   assert len(state()['scene3d']['plots'])==3
   assert not errors,errors
   print('PASS ROUND70_CHROMIUM: 3D SVG transparency, mathematical pole rejection, lighting/camera, saved state, 2D/3D preservation')
  finally:browser.close()

if __name__=='__main__':run()
