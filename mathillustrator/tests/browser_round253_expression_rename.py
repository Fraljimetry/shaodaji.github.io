"""Regression: rename while Name remains focused must update displayed Expression."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1180,'height':820})
            failures=[]
            page.on('pageerror', lambda error: failures.append(str(error)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            algebra=page.locator('#unified-algebra-input')
            for value in ['A = (0,0)','B = (2,0)','C = Circle(A,B)']:
                algebra.fill(value);algebra.press('Enter')
            row=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='C'))
            row.click()
            name=page.get_by_label('Name',exact=True)
            name.fill('D')
            name.press('Enter')
            expression=page.get_by_label('Expression',exact=True)
            assert expression.input_value()=='Circle(A, B)',expression.input_value()
            # Other-object rename should propagate through stored IDs.
            row=page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='A'))
            row.click()
            refname=page.get_by_label('Name',exact=True)
            refname.fill('Alpha');refname.press('Enter')
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='D')).click()
            assert page.get_by_label('Expression',exact=True).input_value()=='Circle(Alpha, B)'
            assert not failures,(theme,failures)
            page.close()
        print('ROUND253_RENAME_SYNC_PASS')
    finally:
        browser.close()
