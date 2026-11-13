"""Cut10 isolated Chromium: semantic diagram clipping, modal keyboard isolation,
object-list keyboard virtualization, plot reuse, and explicit overlap/visibility.
No hosted-site/cross-browser claims.
"""
from browser_smoke import inline_html,cmd
from playwright.sync_api import sync_playwright
import os, re, json


def check():
 with sync_playwright() as w:
  b=w.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  p=b.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('dialog',lambda d:d.accept())
  p.set_content(inline_html(),wait_until='load')
  p.wait_for_timeout(150)
  cmd(p,'A=Node(0,0,"A")');cmd(p,'B=Node(3.5,0,"B")');cmd(p,'Morphism(A,B,"f")')
  # Morphism marker and path should stay clear of actual source/dest node bounds.
  g=p.locator('#drawing g.clickable[data-id="o3"]');g.wait_for()
  def extract():
   return p.evaluate('''() => {
    const source=document.querySelector('[data-id="o1"] rect');
    const target=document.querySelector('[data-id="o2"] rect');
    const g=document.querySelector('g.clickable[data-id="o3"]');
    return {source: source&&{x:+source.getAttribute('x'),width:+source.getAttribute('width')},
      target:target&&{x:+target.getAttribute('x'),width:+target.getAttribute('width')},
      path:g?.querySelector('path')?.getAttribute('d')??null};
   }''')
  d=extract();assert d['path'],d
  match=re.search(r'^M([+-]?[\d.]+) ([+-]?[\d.]+) Q[\d. -]+ ([+-]?[\d.]+) ([+-]?[\d.]+)$',d['path']);assert match,d
  x1,x2=float(match[1]),float(match[3]);assert x1>d['source']['x']+d['source']['width'],d
  assert x2<d['target']['x'],d
  print('CUT10_PASS morphism stops outside both node rectangles')
  # Explicit overlap does not reverse the arrow, does not delete semantic edge.
  p.locator('#objects .object[data-id="o2"]').click()
  xfield=p.locator('#properties .twocol input').first
  xfield.fill('0.25');xfield.dispatch_event('change');p.wait_for_timeout(70)
  assert p.locator('g.clickable[data-id="o3"] path').count()==0,extract()
  # Move back, arrow recovers, topology stays intact.
  p.locator('#properties .twocol input').first.fill('3.5');p.locator('#properties .twocol input').first.dispatch_event('change')
  p.wait_for_timeout(70);assert p.locator('g.clickable[data-id="o3"] path').count()==1
  print('CUT10_PASS overlapping diagram boxes suppress reversed SVG arrow, semantic graph intact')
  # Keyboard selection should survive a virtualized re-render (the row node is replaced).
  p.locator('#objects .object[data-id="o2"]').focus()
  p.keyboard.press('Home')
  assert p.evaluate('document.activeElement?.dataset?.id')=='o3'
  p.keyboard.press('End')
  assert p.evaluate('document.activeElement?.dataset?.id')=='o1'
  p.keyboard.press('ArrowUp')
  assert p.evaluate('document.activeElement?.dataset?.id')=='o2'
  print('CUT10_PASS object list arrow/home/end focus follows virtualization')
  # Export acts as an actual keyboard context; tab never escapes to other controls.
  p.locator('#export-open').click()
  assert p.locator('#export-backdrop').is_visible()
  # The export selector is modal for pointer users as well as keyboard users.
  before=int(p.locator('#object-count').inner_text())
  box=p.locator('#drawing').bounding_box()
  p.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2)
  assert int(p.locator('#object-count').inner_text())==before
  # If the backdrop intercepted the click, export is closed; reopen it.
  if p.locator('#export-menu').is_hidden():p.locator('#export-open').click()
  p.locator('#export-close').focus();p.keyboard.press('Shift+Tab')
  assert p.evaluate('document.activeElement.closest("#export-menu")!==null')
  p.locator('#export-close').focus();p.keyboard.press('Tab')
  assert p.evaluate('document.activeElement.closest("#export-menu")!==null')
  p.keyboard.press('Escape');assert p.locator('#export-menu').is_hidden()
  assert p.evaluate('document.activeElement?.id')=='export-open'
  p.locator('#tikzcd-open').click();p.locator('#tikzcd-input').focus();p.keyboard.press('Shift+Tab')
  assert p.evaluate('document.activeElement.closest("#tikzcd-dialog")!==null')
  p.locator('#tikzcd-apply').focus();p.keyboard.press('Tab')
  assert p.evaluate('document.activeElement.closest("#tikzcd-dialog")!==null')
  p.keyboard.press('Escape');assert p.locator('#tikzcd-dialog').is_hidden()
  print('CUT10_PASS import/export focus loops and escape restore launcher')
  # Function curves should survive repeated redraws with unchanged coordinates.
  cmd(p,'f(x)=sin(x)');p.wait_for_timeout(60)
  path=p.locator('#drawing path.clickable[data-id="o4"]').first.get_attribute('d')
  for _ in range(6):p.locator('#zoom-reset').click()
  assert p.locator('#drawing path.clickable[data-id="o4"]').first.get_attribute('d')==path
  p.locator('#zoom-in').click();p.wait_for_timeout(50)
  assert p.locator('#drawing path.clickable[data-id="o4"]').first.get_attribute('d')!=path
  assert not errors,errors
  print('CUT10_PASS cached plots stable when view identical, invalidated by zoom, no browser exceptions')
  b.close()

if __name__=='__main__':check()
