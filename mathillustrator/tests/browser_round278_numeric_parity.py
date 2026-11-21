"""Round 278: seven-digit geometry measurements and slider row; exact JSON stays intact."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1200,'height':900})
            errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load',timeout=60000)
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            entry=page.locator('#unified-algebra-input')
            def enter(command):
                entry.fill(command)
                entry.press('Enter')
            enter('A = (0, 0)')
            enter('B = (2.653164812345, 0)')
            enter('S = Segment(A, B)')
            page.locator('#objects .object').filter(has=page.locator('.object-label strong',has_text='S')).click()
            length=page.locator('#properties .measurement-value').input_value()
            assert length=='2.653165',(theme,length)
            enter('a = Slider(0, 10, 0.000000000001, 2.653164812345)')
            label=page.locator('#objects .algebra-entry-label').filter(has_text='a =').first.inner_text()
            assert '2.653165' in label,(theme,label)
            saved=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
            assert any(abs(x['xy'][0]-2.653164812345)<1e-13 for x in saved['objects'] if x['type']=='point')
            assert any(abs(s['value']-2.653164812345)<1e-12 for s in saved.get('algebra',{}).get('sliders',[]))
            assert not errors,(theme,errors)
            page.close()
    finally:
        browser.close()
print('Round 278 Chromium seven-digit measurements, slider label and exact model PASS')
