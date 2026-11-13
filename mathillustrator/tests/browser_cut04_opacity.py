"""Opacity zero is visual invisibility across SVG editor/export and TikZ."""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
import os,re

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1400,'height':850},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(inline_html(),wait_until='load');page.wait_for_timeout(100)
  cmd(page,'A=(0,0)');cmd(page,'B=(2,0)');cmd(page,'Segment(A,B)')
  page.locator('#objects .object[data-id="o1"]').click()
  field=page.locator('#properties label.field').filter(has_text='Opacity').locator('input')
  field.fill('0');field.dispatch_event('change');page.wait_for_timeout(80)
  assert page.locator('#drawing .anchor-hit[data-id="o1"]').count()==0,'Invisible point captures underlying clicks'
  label=page.locator('#drawing text').filter(has_text='A')
  assert label.count()==0,'Fully transparent point label should not be in the rendered scene'
  page.locator('#export-open').click()
  tex=download(page,'TikZ / PGF').read_text()
  assert '\\node[above right,opacity=0]' not in tex,'Fully transparent point label should be omitted from LaTeX'
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  assert not re.search(r'<text[^>]*>A</text>',svg), 'SVG export must omit fully transparent label'
  assert not errors,errors
  print('CHROMIUM_CUT04_OPACITY_PASS: zero-opacity points omitted, non-hit-test and SVG/TikZ visual parity')
  b.close()
if __name__=='__main__':run()
