"""Cut 06 isolated Chromium regressions: atomic anchor planning, hidden anchoring, TikZ export invariants.
Run on Cut 05 first as RED, then on Cut 06 as GREEN. No hosted-site assertions.
"""
from browser_smoke import inline_html,cmd,download
from playwright.sync_api import sync_playwright
import os,json,math

def project(p):return json.loads(download(p,'Save').read_text())
def browser_page(browser):
 p=browser.new_page(viewport={'width':1450,'height':900},accept_downloads=True)
 p.on('dialog',lambda d:d.accept())
 p.set_content(inline_html(),wait_until='load');p.wait_for_timeout(140)
 return p

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  # With anchor snapping enabled, two nearby *new* endpoints must not alias
  # because the first is inserted halfway through a single transaction.
  page=browser_page(b)
  page.locator('#snap').uncheck()
  page.locator('#construction-tools [data-tool-choice="segment"]').click()
  rect=page.locator('#drawing').bounding_box();cx=rect['x']+rect['width']/2+150;cy=rect['y']+rect['height']/2+65
  page.mouse.click(cx,cy);page.mouse.click(cx+7,cy)
  d=project(page)
  segs=[o for o in d['objects'] if o['type']=='segment']
  assert len(segs)==1 and segs[0]['refs'][0]!=segs[0]['refs'][1], ('short segment silently collapses',d['objects'])
  coords={o['id']:o['xy'] for o in d['objects'] if o['type']=='point'}
  assert math.dist(coords[segs[0]['refs'][0]],coords[segs[0]['refs'][1]])>0.01
  page.close()
  # An invisible anchor remains a mathematical dependency, but must not be
  # implicitly chosen by a pointer drawing operation.
  page=browser_page(b)
  cmd(page,'A=(0,0)');page.locator('#objects .object[data-id="o1"]').click()
  opacity=page.locator('#properties .field').filter(has_text='Opacity').locator('input')
  opacity.fill('0');opacity.dispatch_event('change')
  page.locator('#snap').uncheck()
  page.locator('#construction-tools [data-tool-choice="segment"]').click()
  r=page.locator('#drawing').bounding_box();cx=r['x']+r['width']/2;cy=r['y']+r['height']/2
  page.mouse.click(cx+2,cy+2);page.mouse.click(cx+105,cy-25)
  d=project(page);segs=[o for o in d['objects'] if o['type']=='segment']
  assert len(segs)==1 and segs[0]['refs'][0]!='o1', ('transparent anchor captured pointer',d['objects'])
  page.close()
  # Hidden unsupported types should not disable export of visible supported content.
  page=browser_page(b)
  cmd(page,'A=(0,0)');cmd(page,'B=(3,0)');cmd(page,'Segment(A,B)');cmd(page,'f(x)=x^2')
  page.locator('#objects .object').first.locator('button').first.click()
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF').is_enabled(),'Hidden function disabled otherwise-supported TikZ export'
  first=download(page,'TikZ / PGF').read_text()
  page.locator('#zoom-in').click();page.locator('#zoom-in').click()
  page.locator('#export-open').click();second=download(page,'TikZ / PGF').read_text()
  assert first==second,'TikZ geometry/style changes on viewport zoom even with same document'
  assert 'f(x)' not in second
  page.close()
  # User may hide the general module, but must retain reachable Move/Pan
  # controls; this prevents a keyboard/pointer dead-end after preset changes.
  page=browser_page(b)
  page.locator('#module-basic').uncheck()
  assert page.locator('#basic-tools [data-tool-choice="select"]').is_visible()
  assert page.locator('#basic-tools [data-tool-choice="pan"]').is_visible()
  assert page.locator('#basic-tools [data-tool-choice="point"]').is_hidden()
  page.locator('#basic-tools [data-tool-choice="pan"]').click()
  assert page.locator('#drawing').get_attribute('data-tool')=='pan'
  page.locator('#undo').click()
  assert page.locator('#basic-tools [data-tool-choice="point"]').is_visible()
  page.close();b.close()
  print('CHROMIUM_CUT06_PASS: atomic short construction, opacity-aware snapping, hidden unsupported export, zoom-invariant TikZ, reachable basic tools')

if __name__=='__main__':run()
