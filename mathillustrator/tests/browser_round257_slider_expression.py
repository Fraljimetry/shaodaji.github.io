"""Slider expressions are editable, name-free, synchronized and safe."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1160,'height':820})
            errors=[]
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
            algebra=page.locator('#unified-algebra-input')
            algebra.fill('a = Slider(0, 10, 0.5, 3)');algebra.press('Enter')
            slider=page.locator('#objects [data-slider="a"]')
            assert slider.count()==1
            slider.click()
            labels=[x.strip().split('\n')[0] for x in page.locator('#properties > label.field').all_text_contents()]
            assert labels[:2]==['Name','Expression'],labels
            expression=page.get_by_label('Expression',exact=True)
            assert expression.input_value()=='Slider(0, 10, 0.5, 3, 1, periodic)',expression.input_value()
            expression.fill('Slider(-2, 8, 0.25, 4, 2, oscillatory)')
            expression.press('Enter')
            state=page.evaluate('window.__mathillustratorDebug?.getDoc?.()')
            # Editor remains selected and synchronized following redraw.
            expression=page.get_by_label('Expression',exact=True)
            assert expression.input_value()=='Slider(-2, 8, 0.25, 4, 2, oscillatory)'
            expression.fill('Slider(5, 0, 0.1, 2, 1, periodic)')
            expression.press('Enter')
            expression=page.get_by_label('Expression',exact=True)
            assert expression.input_value()=='Slider(-2, 8, 0.25, 4, 2, oscillatory)',expression.input_value()
            name=page.get_by_label('Name',exact=True)
            name.fill('b');name.press('Enter')
            assert page.get_by_label('Expression',exact=True).input_value()=='Slider(-2, 8, 0.25, 4, 2, oscillatory)'
            value=page.get_by_label('Value',exact=True)
            value.fill('6');value.press('Enter')
            assert ', 6, 2, oscillatory)' in page.get_by_label('Expression',exact=True).input_value()
            assert not errors,(theme,errors)
            page.close()
        print('ROUND257_SLIDER_EXPRESSION_PASS')
    finally:
        browser.close()
