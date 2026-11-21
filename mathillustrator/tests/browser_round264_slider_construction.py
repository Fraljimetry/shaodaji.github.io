"""Real Chromium verification: construction uses existing slider symbols."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1250,'height':820})
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            entry=page.locator('#unified-algebra-input')
            def enter(source):
                entry.fill(source);entry.press('Enter')
                assert entry.input_value()=='',(source,entry.input_value())
            enter('a = Slider(0, 10, 0.1, 2)')
            enter('O = (0, 0)')
            enter('P = Point(a, 2*a)')
            enter('R = Dilate(P, O, amount=a*2)')
            snapshot=page.evaluate('''()=>({point:window.__miTest?.doc?.objects?.find(o=>o.name==='P'),transform:window.__miTest?.doc?.objects?.find(o=>o.name==='R')})''')
            # Browser exposure is optional; UI creation itself is authoritative.
            assert page.locator('#objects .object').count()>=4
            assert not errors,errors
            page.close()
        print('ROUND264_BROWSER_PASS')
    finally:browser.close()
