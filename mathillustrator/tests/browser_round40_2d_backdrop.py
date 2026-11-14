"""Round40 Chromium: 2D complex image is behind grid/axes and visible curves, including SVG export."""
import os,json
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  try:
   page=b.new_page(viewport={'width':1440,'height':850},accept_downloads=True)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_default_timeout(10000)
   page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
   page.locator('#plot-mode').select_option('domainColoring')
   page.locator('#command').fill('z^2+1');page.locator('#command-form button').click()
   page.locator('#drawing image[data-id]').first.wait_for(state='attached')
   page.locator('#plot-mode').select_option('function');page.locator('#command').fill('sin(x)');page.locator('#command-form button').click()
   order=page.evaluate('''() => {const children=[...document.querySelector('#drawing').children];return {image:children.findIndex(e=>e.tagName.toLowerCase()==='image'),grid:children.findIndex(e=>e.tagName.toLowerCase()==='g'&&e.getAttribute('stroke')==='#9daec1'),axes:children.findIndex(e=>e.tagName.toLowerCase()==='g'&&e.getAttribute('stroke')==='#738396'),plot:children.findIndex(e=>e.tagName.toLowerCase()==='path'&&e.dataset.id)};}''')
   assert 0<=order['image']<order['grid']<order['plot'] and order['image']<order['axes']<order['plot'],order
   with page.expect_download(timeout=12000) as exported:
    page.locator('#export-open').click();page.locator('#export-options button').filter(has_text='SVG').click()
   svg=exported.value.path().read_text()
   assert svg.index('<image')<svg.index('stroke="#9daec1"'), 'grid must be in front of domain image in exported SVG'
   assert 'sin(x)' in page.evaluate('window.__round36Snapshot()')
   assert not errors,errors
   print('PASS ROUND40_2D_CHROMIUM: domain backdrop, grid/axes/curve layering, SVG, existing formulas')
  finally:b.close()
if __name__=='__main__':run()
