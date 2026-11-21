"""Round 259: all mutually represented Properties fields stay synchronized."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1180,'height':820})
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
            algebra=page.locator('#unified-algebra-input')
            algebra.fill('P = (1, 2)');algebra.press('Enter')
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='P')).click()
            ex=page.get_by_label('Expression',exact=True)
            ex.fill('(7, 8)');ex.press('Enter')
            xy=page.locator('#properties .point-coordinate-grid input')
            assert [xy.nth(i).input_value() for i in range(2)]==['7','8'],[xy.nth(i).input_value() for i in range(2)]
            # First coordinate keeps focus, second field and expression follow committed state.
            xy.nth(0).fill('9');xy.nth(0).press('Enter')
            assert ex.input_value()=='(9, 8)',ex.input_value()
            ex.fill('(11, 12)');ex.press('Enter')
            xy=page.locator('#properties .point-coordinate-grid input')
            assert [xy.nth(i).input_value() for i in range(2)]==['11','12']
            algebra.fill('a = Slider(0, 10, 1, 2)');algebra.press('Enter')
            page.locator('#objects [data-slider="a"]').click()
            ex=page.get_by_label('Expression',exact=True)
            ex.fill('Slider(-4, 16, 0.5, 3, 4, once)');ex.press('Enter')
            for label,value in [('Minimum','-4'),('Maximum','16'),('Step','0.5'),('Value','3'),('Speed (cycles/s)','4')]:
                actual=page.get_by_label(label,exact=True).input_value()
                assert actual==value,(theme,label,actual,value)
            assert page.get_by_label('Play mode',exact=True).input_value()=='once'
            value=page.get_by_label('Value',exact=True)
            value.fill('5');value.press('Enter')
            assert ex.input_value()=='Slider(-4, 16, 0.5, 5, 4, once)',ex.input_value()
            assert not errors,(theme,errors)
            page.close()
        print('ROUND259_FIELD_SYNCHRONIZATION_PASS')
    finally:
        browser.close()
