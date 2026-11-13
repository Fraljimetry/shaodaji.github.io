"""Cut02 focused narrow viewport, live polygon, stale editing, export encoder paths."""
import json,os,tempfile
from pathlib import Path
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright

def project(page):
    return json.loads(download(page,'Save').read_text())

def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1400,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  for c in ['A=(0,0)','B=(3,0)','RegularPolygon(A,B,5)']:cmd(page,c)
  assert page.locator('#object-count').inner_text()=='3'
  assert page.locator('#drawing polygon[data-id="o3"]').count()==1
  d=project(page);assert d['objects'][-1]['sides']==5
  page.locator('#objects .object[data-id="o3"]').click()
  sides=page.locator('#properties label.field').filter(has_text='Number of sides').locator('input')
  sides.fill('7');sides.dispatch_event('change');page.wait_for_timeout(70)
  assert project(page)['objects'][-1]['sides']==7
  # Rollback after invalid property; the next valid change must affect the CURRENT document.
  sides=page.locator('#properties label.field').filter(has_text='Number of sides').locator('input')
  sides.fill('102');sides.dispatch_event('change');page.wait_for_timeout(70)
  assert project(page)['objects'][-1]['sides']==7
  sides=page.locator('#properties label.field').filter(has_text='Number of sides').locator('input')
  sides.fill('8');sides.dispatch_event('change');page.wait_for_timeout(70)
  assert project(page)['objects'][-1]['sides']==8
  page.locator('#undo').click();assert project(page)['objects'][-1]['sides']==7
  page.locator('#redo').click();assert project(page)['objects'][-1]['sides']==8
  # Malformed command must not leave a partially saved object or advance ID.
  cmd(page,'RegularPolygon(A,A,3)');assert project(page)['nextId']==4
  page.locator('#export-open').click();source=download(page,'TikZ / PGF').read_text()
  assert '-- cycle;' in source
  page.locator('#export-open').click();svg=download(page,'SVG').read_text()
  assert 'data-id="o3"' in svg and '<polygon' in svg
  page.locator('#export-open').click();jpg=download(page,'JPEG').read_bytes()
  assert jpg[:2]==b'\xff\xd8' and len(jpg)>1000
  # Mobile collapsed rails must reopen real tool controls and object properties.
  mobile=browser.new_page(viewport={'width':580,'height':780},accept_downloads=True)
  mobile.on('pageerror',lambda e:errors.append('mobile: '+str(e)))
  mobile.set_content(inline_html(),wait_until='load')
  assert not mobile.locator('#construction-tools').is_visible()
  mobile.locator('#right-collapse').click()
  assert mobile.locator('#construction-tools').is_visible()
  mobile.locator('[data-tool-choice="regularPolygon"]').click()
  assert mobile.locator('#drawing').get_attribute('data-tool')=='regularPolygon'
  mobile.locator('#left-collapse').click()
  assert mobile.locator('#command').is_visible()
  assert not mobile.locator('#construction-tools').is_visible()
  cmd(mobile,'A=(0,0)')
  assert mobile.locator('#object-count').inner_text()=='1'
  assert not errors,errors
  print('CHROMIUM_CUT02_PASS: live regular polygon, rejected edits and commands, undo/redo, SVG/TikZ/JPEG output, mobile drawer recovery')
  browser.close()

if __name__=='__main__':run()
