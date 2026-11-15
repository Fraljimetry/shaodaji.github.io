"""Real Chromium input test via an isolated loopback web server (not deployed website)."""
from browser_smoke import inline_html
from playwright.sync_api import sync_playwright
import os,re
with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  try:
   for width in (1440,390):
    page=browser.new_page(viewport={'width':width,'height':850})
    page.set_default_timeout(4500)
    print('viewport',width,flush=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
    page.locator('#object-count').wait_for(state='attached')
    if width<700:page.locator('#left-collapse').click()
    page.locator('#plot-mode').select_option('parametric')
    page.locator('#command').fill('cos(t)');page.locator('#command-y').fill('sin(t)')
    page.locator('#command-form button').click()
    assert page.locator('#object-count').inner_text()=='1'
    print('before selecting',width,flush=True)
    page.locator('.object').first.click()
    toggle=page.get_by_role('checkbox',name='Use polar coordinates')
    assert not toggle.is_checked()
    toggle.check()
    assert page.locator('#properties label').filter(has_text='r(t)').count()>0
    radius=page.locator('#properties label').filter(has_text='r(t)').locator('input').first
    radius.fill('2');radius.press('Enter')
    assert toggle.is_checked()
    state=page.evaluate('JSON.parse(window.__round36Snapshot())')
    assert state['objects'][0]['polar'] is True and state['objects'][0]['rExpr']=='2',state['objects'][0]
    assert page.locator('#properties label').filter(has_text='r min').count()==0
    assert page.locator('#properties label').filter(has_text='r max').count()==0
    assert page.locator('#properties label').filter(has_text='t min').count()>0
    assert page.locator('#properties label').filter(has_text='t max').count()>0
    toggle.uncheck()
    assert page.locator('#properties label').filter(has_text='x(t)').count()>0
    state=page.evaluate('JSON.parse(window.__round36Snapshot())')
    assert state['objects'][0]['polar'] is False and state['objects'][0]['xExpr']=='cos(t)' and state['objects'][0]['yExpr']=='sin(t)'
    # Verify the cursor label never expands with moving world coordinates.
    before=page.locator('#coords').evaluate('(n)=>n.getBoundingClientRect().width')
    canvas=page.locator('#drawing').bounding_box()
    page.mouse.move(canvas['x']+canvas['width']*.2,canvas['y']+canvas['height']*.4)
    coords=page.locator('#coords').inner_text()
    assert re.match(r'^x -?\d+\.\d{2} · y -?\d+\.\d{2}$',coords),coords
    after=page.locator('#coords').evaluate('(n)=>n.getBoundingClientRect().width')
    assert abs(before-after)<.1,(before,after)
    assert not errors,(width,errors)
    print('PASS Round145 browser polar / cursor',width,flush=True)
    page.close()
  finally:browser.close()
