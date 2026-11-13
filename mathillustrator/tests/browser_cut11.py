"""Cut11 isolated Chromium regressions: actual multiline SVG labels, arrow bounds,
Fit label inclusion, tiny coordinate readout, spatial picking and TikZ gating.
Tests the app DOM, not deployed HTTP or an assistive-technology stack.
"""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html,cmd
import os, re

def check():
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1200,'height':800},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('dialog',lambda d:d.accept())
  page.set_content(inline_html(),wait_until='load')
  page.wait_for_timeout(200)
  desc='A very long diagram node label that must preserve every word without overflowing its available box dimensions'
  cmd(page,'A=Node(-5,0,"'+desc+'")');cmd(page,'B=Node(5,0,"B")');cmd(page,'Morphism(A,B,"f")')
  page.wait_for_timeout(150)
  texts=page.locator('#drawing g[data-id="o1"] text tspan')
  assert texts.count()>1,texts.count()
  assert ''.join(texts.all_text_contents()).replace(' ','')==desc.replace(' ',''),texts.all_text_contents()
  box=page.locator('#drawing g[data-id="o1"] rect')
  assert float(box.get_attribute('height'))>50
  path=page.locator('#drawing g[data-id="o3"] path').first.get_attribute('d')
  assert path and path.startswith('M'),path
  print('CUT11_PASS node label wrapping and semantic arrow follow same dimensions')
  page.locator('#fit').click();page.wait_for_timeout(120)
  result=page.evaluate('''() => {const svg=document.querySelector('#drawing');return {width:svg.getBoundingClientRect().width,
    rectangles:[...svg.querySelectorAll('g[data-id] rect')].map(r=>({x:+r.getAttribute('x'),width:+r.getAttribute('width')}))};}''')
  assert len(result['rectangles'])==2,result
  for r in result['rectangles']:
   assert r['x']>0 and r['x']+r['width']<result['width'],result
  print('CUT11_PASS Fit includes full fixed-pixel node labels')
  page.locator('#export-open').click()
  assert page.get_by_role('button',name='TikZ / PGF',exact=True).is_disabled()
  assert page.get_by_role('button',name='SVG',exact=True).is_enabled()
  page.locator('#export-close').click()
  print('CUT11_PASS wrapped SVG-only label disables geometrically inexact TikZ export')
  cmd(page,'P=(0.000000001,0)')
  page.locator('#object-search').fill('P')
  assert 'e-9' in page.locator('#objects .object small').first.inner_text()
  page.locator('#object-search').fill('')
  cmd(page,'f(x)=sin(17*x)')
  plot=page.locator('#drawing path.clickable[data-id="o5"]').first
  plot.wait_for();balanced=plot.get_attribute('d')
  page.locator('#plot-quality').select_option('detailed')
  page.wait_for_timeout(100)
  detailed=plot.get_attribute('d')
  assert balanced!=detailed,(len(balanced),len(detailed))
  assert page.locator('#plot-quality').input_value()=='detailed'
  page.locator('#plot-quality').select_option('fast')
  page.wait_for_timeout(100)
  fast=plot.get_attribute('d');assert fast!=detailed
  print('CUT11_PASS Plot detail changes actual sampling and invalidates cached paths')
  # Imported/typed untrusted text is treated as text, not executable markup.
  cmd(page,'E=Node(0,4,"<img src=x onerror=alert(1)>")')
  page.wait_for_timeout(100)
  assert page.locator('#drawing img').count()==0
  assert '<img' in page.locator('#drawing g[data-id="o6"] text').text_content()
  # Prime snap search, then change an anchor; the spatial index must not
  # keep its old screen position after a property transaction.
  cmd(page,'Q=(0.23,1)')
  q_id='o7'
  old_cx=float(page.locator(f'#drawing circle[data-id="{q_id}"]').get_attribute('cx'))
  old_cy=float(page.locator(f'#drawing circle[data-id="{q_id}"]').get_attribute('cy'))
  page.locator(f'#objects .object[data-id="{q_id}"]').click()
  xfield=page.locator('#properties .twocol input').first
  xfield.fill('3.23');xfield.dispatch_event('change')
  page.wait_for_timeout(50)
  page.locator('button.tool[data-tool-choice="point"]').click()
  canvas=page.locator('#drawing').bounding_box()
  page.mouse.click(canvas['x']+old_cx+5,canvas['y']+old_cy)
  page.wait_for_timeout(60)
  new_desc=page.locator('#objects .object[data-id="o8"] small').inner_text()
  assert '(0.5, 1)' in new_desc,new_desc
  print('CUT11_PASS snap index invalidates after coordinate-property edits')
  assert not errors,errors
  browser.close()
  print('CUT11_PASS tiny nonzero coordinates remain distinguishable; no JS page errors')

if __name__=='__main__':check()
