"""End-to-end accessible mouse, keyboard, touch and 3D Smart Input interactions."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for theme in ('light', 'dark'):
            page=browser.new_page(viewport={'width':1180,'height':760})
            errors=[];page.on('pageerror', lambda e:errors.append(str(e)))
            page.set_content(inline_html(expose_state=True),wait_until='load')
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            alg=page.locator('#unified-algebra-input')
            alg.fill('Slid')
            popup=page.locator('#unified-algebra-input-suggestions')
            option=popup.get_by_role('option',name='Slider(…)')
            assert option.count()==1,theme
            option.click()
            assert alg.input_value()=='Slider()',alg.input_value()
            assert page.evaluate('document.getElementById("unified-algebra-input").selectionStart')==7
            alg.fill('A=(0,0)');alg.press('Enter')
            assert popup.is_hidden() and page.locator('#objects [data-id]').count()==1
            alg.fill('sin');alg.press('Tab')
            assert alg.input_value()=='sin()' and popup.is_hidden()
            alg.fill('cos');assert popup.is_visible();alg.press('Escape');assert popup.is_hidden()
            alg.fill('s')
            count=popup.get_by_role('option').count()
            assert count>=6,count
            for _ in range(count-1):alg.press('ArrowDown')
            metrics=popup.evaluate("""e=>{const selected=e.querySelector('[data-selected=true]');
                const p=e.getBoundingClientRect(),r=selected.getBoundingClientRect();
                return {scrollTop:e.scrollTop, visible:r.top>=p.top-1&&r.bottom<=p.bottom+1}}""")
            assert metrics['visible'] and metrics['scrollTop']>0,(theme,metrics)
            alg.press('Escape')
            plot=page.locator('#command');plot.fill('x+')
            plot.press('Control+Space')
            assert page.locator('#command-suggestions').get_by_role('option', name='sin(…)',exact=True).is_visible()
            plot.press('ArrowDown');plot.press('ArrowUp');plot.press('Tab')
            assert plot.input_value()=='x+sin()'
            page.locator('#scene3d-enable').check(force=True)
            page.locator('#plot-mode').select_option('surface3d')
            plot.fill('co')
            assert page.locator('#command-suggestions').get_by_role('option',name='cos(…)',exact=True).is_visible()
            assert not errors,errors
            page.close()
        # Touch selects a suggestion without losing the input focus or submitting.
        mobile=browser.new_context(viewport={'width':390,'height':780},is_mobile=True,has_touch=True)
        page=mobile.new_page()
        page.set_content(inline_html(expose_state=True),wait_until='load')
        page.evaluate("document.body.classList.add('mobile-left-open')")
        alg=page.locator('#unified-algebra-input')
        alg.fill('Sli')
        item=page.locator('#unified-algebra-input-suggestions').get_by_role('option',name='Slider(…)')
        item.scroll_into_view_if_needed();r=item.bounding_box()
        page.touchscreen.tap(r['x']+min(40,r['width']/2),r['y']+r['height']/2)
        assert alg.input_value()=='Slider()',alg.input_value()
        assert page.locator('#unified-algebra-input-suggestions').is_hidden()
        mobile.close()
        print('ROUND250_EDITOR_INTERACTIONS_CHROMIUM_PASS')
    finally:
        browser.close()
