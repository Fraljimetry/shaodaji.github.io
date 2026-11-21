"""Guard autocomplete typography against form submit-button CSS regressions."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for width in (1280, 1100, 900):
            page = browser.new_page(viewport={'width': width, 'height': 800})
            page.set_content(inline_html(expose_state=True), wait_until='load')
            for selector in ('#command', '#unified-algebra-input'):
                field = page.locator(selector)
                field.fill('sin')
                row = page.locator(f'{selector}-suggestions .input-assist-option').first
                assert row.is_visible(), (width, selector, 'missing suggestion')
                metrics = page.evaluate('''selector => {
                    const input=document.querySelector(selector);
                    const popup=document.querySelector(selector+'-suggestions');
                    const row=popup.querySelector('.input-assist-option');
                    const a=getComputedStyle(input), b=getComputedStyle(row);
                    return {inputFont:a.fontFamily, rowFont:b.fontFamily,
                        inputSize:a.fontSize, rowSize:b.fontSize,
                        fieldWidth:input.getBoundingClientRect().width,
                        popupWidth:popup.getBoundingClientRect().width,
                        rowWidth:row.getBoundingClientRect().width};
                }''', selector)
                assert metrics['inputFont'] == metrics['rowFont'], (width, selector, metrics)
                assert metrics['inputSize'] == metrics['rowSize'], (width, selector, metrics)
                assert abs(metrics['fieldWidth']-metrics['popupWidth']) < 2, (width, selector, metrics)
                assert metrics['rowWidth'] <= metrics['popupWidth'], (width, selector, metrics)
            page.close()
        print('ROUND250_SUGGESTION_TYPOGRAPHY_CHROMIUM_PASS')
    finally:
        browser.close()
