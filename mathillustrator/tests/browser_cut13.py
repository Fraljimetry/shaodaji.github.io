"""Cut13 settings/UI state matrix. Isolated Chromium, not deployed-site evidence."""
import os, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, cmd

def main():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1430,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(100)
  cmd(page,'A=(0,0)');cmd(page,'B=(2,1)')
  page.locator('#objects .object').first.click()
  assert page.locator('#delete').is_enabled()
  page.locator('#zoom-in').focus();page.keyboard.press('Backspace')
  assert page.locator('#object-count').inner_text()=='2','Backspace on toolbar unexpectedly deletes selected geometry'
  page.locator('#zoom-out').focus();page.keyboard.press('Delete')
  assert page.locator('#object-count').inner_text()=='2','Delete on unrelated toolbar button unexpectedly deletes geometry'
  print('CUT13_PASS destructive shortcuts restricted to canvas/object-list context')
  page.locator('#preset').select_option('General')
  assert page.locator('#preset').input_value()=='General'
  page.locator('#snap-anchors').uncheck()
  assert page.locator('#preset').input_value()=='Custom','Changed anchor snapping must update drawing-preset indicator'
  page.locator('#polygon-sides').fill('9');page.locator('#polygon-sides').dispatch_event('change')
  assert page.locator('#preset').input_value()=='Custom'
  page.locator('#preset').select_option('Olympiad geometry')
  assert page.locator('#preset').input_value()=='Olympiad geometry','Selecting a drawing preset should reestablish its drawing defaults'
  assert page.locator('#snap-anchors').is_checked() and page.locator('#polygon-sides').input_value()=='6'
  print('CUT13_PASS preset indicator and drawing defaults remain consistent')
  # Canvas SVG must not rebuild when only export image scale/area changes.
  page.locator('#page').select_option('a4')
  page.wait_for_timeout(100)
  page.evaluate('''() => {const svg=document.querySelector('#drawing'); window.__testSvgFirst=svg.firstElementChild;}''')
  page.locator('#export-scale').select_option('4')
  page.wait_for_timeout(100)
  assert page.evaluate("document.querySelector('#drawing').firstElementChild===window.__testSvgFirst"),'Export-only scale needlessly rebuilt the full scene'
  page.locator('#export-region').select_option('page')
  page.wait_for_timeout(100)
  assert page.evaluate("document.querySelector('#drawing').firstElementChild===window.__testSvgFirst"),'Export-only region needlessly rebuilt the full scene'
  page.locator('#export-guides').check()
  page.wait_for_timeout(100)
  assert page.evaluate("document.querySelector('#drawing').firstElementChild===window.__testSvgFirst"),'Export-only guide flag needlessly rebuilt the full scene'
  assert page.locator('#undo').is_enabled()
  # Undo must correctly synchronize controls even if no canvas redraw is necessary.
  page.locator('#undo').click()
  assert not page.locator('#export-guides').is_checked()
  page.locator('#redo').click()
  assert page.locator('#export-guides').is_checked()
  print('CUT13_PASS export-only settings avoid redraw; undo/redo synchronizes UI')
  # Invalid settings rollback is atomic and visible; later valid changes still stick.
  step=page.locator('#snap-step');step.fill('0');step.dispatch_event('change')
  assert step.input_value()=='0.25','Invalid snap interval failed to restore previously accepted UI value'
  step.fill('0.125');step.dispatch_event('change')
  assert step.input_value()=='0.125'
  page.locator('#undo').click();assert step.input_value()=='0.25'
  page.locator('#redo').click();assert step.input_value()=='0.125'
  print('CUT13_PASS invalid-then-valid setting commits and history')
  # Historical v1 points were permitted to omit individual pointSize. Their
  # appearance must NOT change when the user edits 'New object style'.
  project=json.loads((Path(__file__).resolve().parents[1]/'examples/geometry-demo.json').read_text())
  original=next(o for o in project['objects'] if o['type']=='point')
  original['style'].pop('pointSize',None)
  project['settings']['pointSize']=5
  page.locator('#open-file').set_input_files({'name':'legacy.json','mimeType':'application/json','buffer':json.dumps(project).encode()})
  page.wait_for_timeout(90)
  point=page.locator(f'#drawing circle[data-id="{original["id"]}"]')
  before=float(point.get_attribute('r'))
  page.locator('#point-size').fill('14');page.locator('#point-size').dispatch_event('change')
  after=float(point.get_attribute('r'))
  assert after==before,(before,after,'New object size retroactively changed a legacy point')
  print('CUT13_PASS imported legacy point radius preserved across default-size changes')
  assert not errors,errors
  browser.close()

if __name__=='__main__':main()
