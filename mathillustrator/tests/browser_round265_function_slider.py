"""Chromium regression: Function construction binds to an existing slider."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for theme in ('light','dark'):
            page=browser.new_page(viewport={'width':1200,'height':780})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            entry=page.locator('#unified-algebra-input')
            entry.fill('b = Slider(0, 20, 0.1, 2)');entry.press('Enter')
            assert entry.input_value()==''
            expression=page.locator('#command')
            expression.fill('sin(b*x)');expression.press('Enter')
            assert expression.input_value()=='', ('Function not created',errors)
            snap=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
            assert len([o for o in snap['objects'] if o['type']=='function' and o['expr']=='sin(b*x)'])==1
            curve_id=next(o['id'] for o in snap['objects'] if o['type']=='function')
            path=page.locator(f'#drawing path[data-id="{curve_id}"]').first
            page.wait_for_timeout(100)
            before=path.get_attribute('d')
            page.locator('#objects [data-slider="b"] .algebra-entry-label').first.click()
            value=page.locator('#properties input[data-numeric-expression="true"]').nth(3)
            value.fill('4');value.press('Tab')
            page.wait_for_timeout(100)
            after=path.get_attribute('d')
            assert before and after and before!=after, 'Curve failed to follow slider changes'
            updated=page.evaluate('()=>JSON.parse(window.__round36Snapshot())')
            assert updated['algebra']['sliders'][0]['value']==4
            assert next(o for o in updated['objects'] if o['id']==curve_id)['expr']=='sin(b*x)'
            assert not errors,errors
            page.close()
        print('ROUND265_CHROMIUM_PASS')
    finally:browser.close()
