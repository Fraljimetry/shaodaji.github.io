"""Live Chromium: inversion spacing and lowercase plotting bounds."""
import os, math
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
 try:
  page=b.new_page(viewport={'width':1500,'height':950});errors=[]
  page.on('pageerror',lambda exc:errors.append(str(exc)))
  page.set_content(inline_html(),wait_until='load')
  glyph=page.locator('[data-tool-choice="circleInversion"] svg').first
  markers=glyph.locator('circle[fill="currentColor"]')
  assert markers.count()==2
  coords=[(float(markers.nth(i).get_attribute('cx')),float(markers.nth(i).get_attribute('cy'))) for i in (0,1)]
  assert math.dist(*coords)>11,coords
  page.locator('#plot-mode').select_option('vectorField')
  page.locator('#command').fill('-y')
  page.locator('#command-y').fill('x')
  page.locator('#command-form button').click()
  page.locator('#properties .plot-region-editor').wait_for(timeout=10000)
  region=page.locator('#properties .plot-region-editor')
  for label in ('x min','x max','y min','y max'):
   assert region.get_by_label(label).count()==1,label
  assert region.get_by_label('X min',exact=True).count()==0
  # Switching to 3D must retain the same lowercase convention.
  page.locator('#scene3d-enable').check(force=True)
  page.locator('#plot-mode').select_option('surface3d')
  page.locator('#command').fill('x+y')
  page.locator('#command-form button').click()
  page.locator('#properties .plot-region-editor').wait_for(timeout=10000)
  region=page.locator('#properties .plot-region-editor')
  for label in ('x min','x max','y min','y max','z min','z max'):
   assert region.get_by_label(label).count()==1,label
  assert not errors,errors
  print('ROUND132 CHROMIUM PASS: inverse points separated and scope labels lowercase')
 finally:b.close()
