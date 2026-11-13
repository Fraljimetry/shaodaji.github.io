"""Cut03 UI evidence: isolated Chromium with inlined module imports (not hosted HTTP)."""
from browser_smoke import inline_html, cmd, download
from playwright.sync_api import sync_playwright
from pathlib import Path
import os,struct,re,json


def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  page.wait_for_timeout(110)
  assert page.locator('#export-guides').count()==1 and page.locator('#export-scale').count()==1
  cmd(page,'A=(0,0)');cmd(page,'B=(4,0)')
  before=page.locator('#object-count').inner_text()
  cmd(page,'Segment(A,A)')
  assert page.locator('#object-count').inner_text()==before
  assert 'distinct' in page.locator('#toast').inner_text().lower()
  cmd(page,'Segment(A,B)')
  assert page.locator('#object-count').inner_text()=='3'
  page.locator('#page').select_option('a4')
  page.locator('#export-region').select_option('page')
  page.locator('#export-open').click()
  svg=download(page,'SVG').read_text()
  assert '#9daec1' not in svg, 'Editor grid leaked to default image export'
  assert 'stroke-dasharray="5 4"' not in svg, 'Page guide leaked into exported art'
  assert not re.search(r'viewBox="0 0 \d+ \d+"',svg)
  page.locator('#export-guides').check()
  page.locator('#export-open').click()
  svg2=download(page,'SVG').read_text()
  assert '#9daec1' in svg2, 'Opted-in grid was not exported'
  assert 'stroke-dasharray="5 4"' not in svg2
  page.locator('#export-scale').select_option('1')
  page.locator('#export-open').click()
  png1=download(page,'PNG').read_bytes()
  assert png1[:8]==b'\x89PNG\r\n\x1a\n'
  w1,h1=struct.unpack('>II',png1[16:24])
  page.locator('#export-scale').select_option('4')
  page.locator('#export-open').click()
  png4=download(page,'PNG').read_bytes()
  w4,h4=struct.unpack('>II',png4[16:24]);assert w4 in (4*w1-2,4*w1-1,4*w1,4*w1+1,4*w1+2) and h4>=4*h1-2
  page.locator('#export-open').click()
  data=json.loads(download(page,'JSON project').read_text())
  assert data['version']==1 and data['settings']['exportGuides'] is True and data['settings']['exportScale']==4
  # LaTeX special plain-text characters must be escaped rather than produce invalid TikZ.
  cmd(page,'T=Node(1,2,"A")')
  # Text property allows literal characters that are special in TeX.
  page.locator('#objects .object').first.click()
  page.locator('#properties textarea').first.fill('^~')
  page.locator('#properties textarea').first.press('Tab')
  page.locator('#export-open').click()
  tex=download(page,'TikZ / PGF').read_text()
  assert r'\textasciicircum{}' in tex and r'\textasciitilde{}' in tex,tex
  # Browser app must plot multiple paths around a true pole (non-connective SVG segments).
  cmd(page,'f(x)=1/x')
  d=page.locator('#drawing [data-id="o5"]')
  assert d.count()>=1
  path=d.first.get_attribute('d') or ''
  assert path.count('M')>=2, 'Plot did not break across singularity'
  # Pan cancellation restores original viewport.
  page.locator('button[data-tool-choice="pan"]').click()
  start=page.locator('#drawing').bounding_box()
  x=start['x']+start['width']*.4;y=start['y']+start['height']*.4
  original=page.locator('#drawing [data-id="o1"]').first.get_attribute('cx')
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+90,y+45,steps=3)
  page.keyboard.press('Escape');page.mouse.up()
  page.wait_for_timeout(85)
  restored=page.locator('#drawing [data-id="o1"]').first.get_attribute('cx')
  assert original==restored,(original,restored)
  # Secondary pointer must not turn into a drawing action.
  page.locator('button[data-tool-choice="point"]').click()
  count=page.locator('#object-count').inner_text()
  page.eval_on_selector('#drawing',"e => e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:13,isPrimary:false,clientX:420,clientY:340}))")
  assert page.locator('#object-count').inner_text()==count
  assert not errors,errors
  print('CHROMIUM_CUT03_PASS: editor-only guide omission, opted-in guide, page crop, PNG resolutions, JSON settings, plot pole, invalid geometry rollback, pan Escape, nonprimary pointer')
  b.close()

if __name__=='__main__':run()
