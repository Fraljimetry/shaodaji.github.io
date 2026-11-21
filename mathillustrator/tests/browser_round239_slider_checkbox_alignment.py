"""Round 239: slider checkbox text and box have matching visual centers."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            page = browser.new_page(viewport={'width':1280,'height':860})
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.set_content(inline_html(legacy_search_expanded=False,expose_state=True),wait_until='load')
            box=page.locator('#unified-algebra-input')
            box.fill('a = Slider(0, 10, 0.1, 2)')
            box.press('Enter')
            page.locator('#objects [data-slider="a"] .algebra-entry-label').click()
            label=page.locator('#properties .slider-border-control')
            inp=label.locator('input[type="checkbox"]')
            caption=label.locator('span')
            assert label.is_visible() and caption.inner_text()=='Show border'
            for viewport in ({'width':1280,'height':860},{'width':960,'height':760}):
                page.set_viewport_size(viewport)
                a,b=inp.bounding_box(),caption.bounding_box()
                assert a and b
                center_difference=abs((a['y']+a['height']/2)-(b['y']+b['height']/2))
                assert center_difference<=1.5, (viewport,center_difference,a,b)
                assert 12<=a['height']<=16 and 12<=a['width']<=16
            inp.uncheck()
            assert not inp.is_checked()
            inp.check()
            assert inp.is_checked()
            assert not errors,errors
            print('ROUND239 CHROMIUM CHECK PASSED')
        finally:browser.close()

if __name__=='__main__':run()
