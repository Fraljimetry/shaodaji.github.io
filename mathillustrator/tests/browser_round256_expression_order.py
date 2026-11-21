"""Properties control order: Name, Expression, label controls where applicable."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for theme in ('light', 'dark'):
            page = browser.new_page(viewport={'width': 1100, 'height': 850})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_content(inline_html(expose_state=True), wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
            algebra = page.locator('#unified-algebra-input')
            for value in ['A = (0,0)', 'B = (2,0)', 'C = Circle(A,B)']:
                algebra.fill(value)
                algebra.press('Enter')
            for name, expected in [('C','Circle(A, B)'),('A','(0, 0)')]:
                page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text=name)).click()
                labels = page.locator('#properties > label.field')
                values = [x.strip().split('\n')[0] for x in labels.all_text_contents()]
                assert values[0:2] == ['Name','Expression'] and values[2].startswith('Label format') and values[3]=='Label', (name,values)
                assert page.get_by_label('Expression',exact=True).input_value() == expected
            assert not errors,errors
            page.close()
        print('ROUND256_EXPRESSION_ORDER_PASS')
    finally:
        browser.close()
