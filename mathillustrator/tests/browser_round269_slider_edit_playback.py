"""Regression: editing one slider must not cancel independently playing sliders."""
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        for theme in ('light', 'dark'):
            page = browser.new_page(viewport={'width': 1280, 'height': 850})
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(inline_html(expose_state=True), wait_until='load', timeout=60000)
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            entry=page.locator('#unified-algebra-input')
            for text in ('a=Slider(0, 10, 0.1, 5)', 'b=Slider(0, 10, 0.1, 5)'):
                entry.fill(text);entry.press('Enter')
            for name in ('a','b'):
                page.get_by_role('button',name='Play slider '+name).click()
            assert page.locator('[title="Pause slider"]').count()==2
            page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
            color=page.locator('#properties').get_by_label('Color', exact=True)
            color.fill('#e05a55');color.press('Tab')
            assert page.locator('[title="Pause slider"]').count()==2,(theme,'color edit stopped animation')
            page.locator('#properties').get_by_label('Speed (cycles/s)', exact=True).fill('2')
            page.locator('#properties').get_by_label('Speed (cycles/s)', exact=True).press('Tab')
            assert page.locator('[title="Pause slider"]').count()==2,(theme,'speed edit stopped animation')
            page.locator('#properties').get_by_label('Play mode', exact=True).select_option('oscillatory')
            assert page.locator('[title="Pause slider"]').count()==2,(theme,'play mode edit stopped animation')
            # Manually drag a while b animates: b must keep playing and the
            # other slider's value must continue advancing.
            track=page.locator('#properties .slider-property-value-range')
            track.evaluate('''el=>{el.value='7';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}''')
            assert page.get_by_role('button',name='Pause slider b').count()==1,(theme,'dragging a stopped b')
            assert page.get_by_role('button',name='Pause slider a').count()==0,(theme,'manually edited slider a still playing')
            page.locator('#properties').get_by_label('Name', exact=True).fill('frequency')
            page.locator('#properties').get_by_label('Name', exact=True).press('Enter')
            assert page.locator('[title="Pause slider"]').count()==1,(theme,'renaming should only stop the changed slider')
            assert page.get_by_role('button',name='Pause slider b').count()==1
            assert not errors, errors
            page.close()
    finally:
        browser.close()
print('ROUND269_SLIDER_EDIT_PLAYBACK_PASS')
