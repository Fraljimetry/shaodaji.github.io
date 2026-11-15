"""Round 178: Density belongs to left column, Normalize lengths to right, 2D/3D."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    try:
        for width in (1440,768,390,320):
            page=browser.new_page(viewport={'width':width,'height':850})
            page.set_default_timeout(12000)
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(inline_html(expose_state=True),wait_until='load',timeout=45000)
            if width<700: page.locator('#left-collapse').click()
            page.locator('#plot-mode').select_option('vectorField')
            page.locator('#command').fill('x')
            page.locator('#command-y').fill('y')
            page.locator('#command').press('Enter')
            def verify():
                r=page.evaluate('''() => {
                  const pair=document.querySelector('#properties .property-check-number-pair');
                  if(!pair)return null;
                  const [left,right]=pair.children;
                  const a=left.getBoundingClientRect(),b=right.getBoundingClientRect(),box=pair.getBoundingClientRect();
                  return {left:left.textContent.trim(),right:right.textContent.trim(),a:a.x,ar:a.right,b:b.x,br:b.right,edge:box.right,order:left.className+' '+right.className};
                }''')
                assert r and r['left']=='Density' and r['right']=='Normalize lengths', (width,r)
                assert r['a']<r['b'] and r['ar']<=r['b']+1 and r['br']<=r['edge']+1, (width,r)
            verify()
            page.locator('.property-check-number-pair input[type=checkbox]').check()
            page.locator('.property-check-number-pair input[data-numeric-expression=true]').fill('10')
            page.locator('.property-check-number-pair input[data-numeric-expression=true]').press('Tab')
            state=page.evaluate('JSON.parse(window.__round36Snapshot())')
            assert state['objects'][-1]['density']==10 and state['objects'][-1]['normalized'] is True,(width,state['objects'][-1])
            if width>=700:
                toggle=page.locator('#scene3d-enable')
                if not toggle.is_visible():page.locator('.controls:has(#scene3d-enable) .section-toggle').click()
                toggle.check()
                page.locator('#plot-mode').select_option('vector3d')
                page.locator('#command').fill('x')
                page.locator('#command-y').fill('y')
                page.locator('#command-z').fill('z')
                page.locator('#command').press('Enter')
                verify()
            assert not errors,(width,errors)
            print('ROUND178_VECTOR_ORDER_PASS',width,flush=True)
            page.close()
    finally:
        browser.close()
