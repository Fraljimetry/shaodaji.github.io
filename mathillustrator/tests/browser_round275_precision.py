"""Round 275: seven-significant-digit Properties view, exact committed values."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1200,'height':900})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            algebra=page.locator('#unified-algebra-input')
            algebra.fill('P = (-4.335416158040364, -3.362500508626302)')
            algebra.press('Enter')
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='P')).click()
            expr=page.get_by_label('Expression',exact=True)
            coords=page.locator('#properties .point-coordinate-grid input')
            assert expr.input_value()=='(-4.335416, -3.362501)',expr.input_value()
            assert coords.nth(0).input_value()=='-4.335416'
            assert coords.nth(1).input_value()=='-3.362501'
            data=lambda: next(x for x in page.evaluate('()=>JSON.parse(window.__round36Snapshot())')['objects'] if x['name']=='P')
            assert data()['xy']==[-4.335416158040364,-3.362500508626302]
            coords.nth(0).focus()
            assert coords.nth(0).input_value()=='-4.335416158040364'
            coords.nth(0).press('Tab')
            page.wait_for_timeout(50)
            assert coords.nth(0).input_value()=='-4.335416'
            assert data()['xy']==[-4.335416158040364,-3.362500508626302]
            expr.focus()
            assert expr.input_value()=='(-4.335416158040364, -3.362500508626302)',expr.input_value()
            expr.press('Tab')
            page.wait_for_timeout(50)
            assert expr.input_value()=='(-4.335416, -3.362501)',expr.input_value()
            assert data()['xy']==[-4.335416158040364,-3.362500508626302]
            coords.nth(0).click()
            coords.nth(0).press('ControlOrMeta+A')
            coords.nth(0).type('1.123456789123')
            coords.nth(0).press('Tab')
            page.wait_for_timeout(50)
            assert data()['xy'][0]==1.123456789123
            assert coords.nth(0).input_value()=='1.123457'
            assert expr.input_value()=='(1.123457, -3.362501)',expr.input_value()
            # Formula edits retain entered precision; invalid edits are atomic.
            expr.click()
            expr.press('ControlOrMeta+A')
            expr.type('(2.123456789123, 4.000000123456)')
            expr.press('Tab')
            page.wait_for_timeout(50)
            assert data()['xy']==[2.123456789123,4.000000123456]
            assert expr.input_value()=='(2.123457, 4)'
            # Canvas-created point has no xyExpr: focus must still reveal exact geometry.
            page.locator('#auto-pan').uncheck()
            page.locator('[data-tool-choice="point"]').click()
            canvas=page.locator('#drawing').bounding_box()
            page.mouse.click(canvas['x']+canvas['width']*.65,canvas['y']+canvas['height']*.55)
            plain=[x for x in page.evaluate('()=>JSON.parse(window.__round36Snapshot())')['objects'] if x['type']=='point' and not x.get('xyExpr')]
            assert plain, 'canvas point without expression'
            point=plain[-1]
            page.locator(f'[data-id="{point["id"]}"]').first.click()
            c2=page.locator('#properties .point-coordinate-grid input')
            displayed=c2.nth(0).input_value()
            c2.nth(0).focus()
            assert c2.nth(0).input_value()==str(point['xy'][0]),(theme,point,c2.nth(0).input_value())
            c2.nth(0).press('Tab')
            page.wait_for_timeout(30)
            assert c2.nth(0).input_value()==displayed
            snapshot=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
            assert next(x for x in snapshot['objects'] if x['id']==point['id'])['xy']==point['xy']
            assert not errors,(theme,errors)
            page.close()
    finally:
        browser.close()
print('Round 275: exact numeric model and seven-digit Properties display PASS')
