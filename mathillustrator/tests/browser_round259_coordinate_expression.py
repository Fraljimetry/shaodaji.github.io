"""Round 259: point coordinate draft, commit, rollback and Expression parity."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for theme in ('light', 'dark'):
            page = browser.new_page(viewport={'width': 1180, 'height': 820})
            errors=[]
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            algebra=page.locator('#unified-algebra-input')
            algebra.fill('A = (6, -2.5625009536743164)');algebra.press('Enter')
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='A')).click()
            expression=page.get_by_label('Expression',exact=True)
            xy=page.locator('#properties .point-coordinate-grid input')
            assert expression.input_value()=='(6, -2.5625009536743164)'
            xy.nth(0).fill('6.714583079020182')
            assert expression.input_value()=='(6.714583079020182, -2.5625009536743164)',expression.input_value()
            xy.nth(0).press('Tab')
            assert expression.input_value()=='(6.714583079020182, -2.5625009536743164)',expression.input_value()
            xy=page.locator('#properties .point-coordinate-grid input')
            xy.nth(1).fill('3.25')
            assert expression.input_value()=='(6.714583079020182, 3.25)',expression.input_value()
            xy.nth(1).press('Tab')
            assert expression.input_value()=='(6.714583079020182, 3.25)'
            xy=page.locator('#properties .point-coordinate-grid input')
            xy.nth(0).fill('bad xyz')
            xy.nth(0).press('Tab')
            assert expression.input_value()=='(6.714583079020182, 3.25)',expression.input_value()
            assert not errors,(theme,errors)
            page.close()
        print('ROUND259_COORDINATE_EXPRESSION_PASS')
    finally:
        browser.close()
