"""Exercise the actual canvas rotation toggle, camera transaction and lifecycle."""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())
        page.set_content(inline_html(legacy_search_expanded=False, expose_state=True), wait_until='load')
        button = page.locator('#auto-orbit')
        mode = page.locator('#scene3d-enable')
        snapshot = lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
        pose = lambda: snapshot()['scene3d']['options']
        def complete():
            page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')")
        def start():
            before = pose()
            button.click()
            assert button.get_attribute('aria-pressed') == 'true'
            page.wait_for_function('(yaw)=>Math.abs(JSON.parse(window.__round36Snapshot()).scene3d.options.yaw-yaw)>1', arg=before['yaw'])
            return before
        def stopped():
            assert button.get_attribute('aria-pressed') == 'false'
            final = pose()
            page.wait_for_timeout(300)
            assert pose() == final, (pose(), final)
            complete()
            return final
        assert button.is_hidden()
        mode.check()
        page.locator('#plot-mode').select_option('vector3d')
        page.locator('#command').fill('x,y,z')
        page.locator('#command').press('Enter')
        complete()
        assert button.is_visible()
        speed = page.locator("#auto-orbit-speed")
        controls = page.locator("#auto-orbit-controls")
        stage = page.locator(".stage").bounding_box()
        box = controls.bounding_box()
        assert box["x"] - stage["x"] < 20 and box["y"] > stage["y"] + stage["height"] - 100
        page.mouse.move(stage['x'] + stage['width']/2, stage['y'] + stage['height']/2)
        assert speed.is_hidden()
        button.hover()
        assert speed.is_visible()
        speed.hover()
        assert speed.is_visible()
        page.mouse.move(stage['x'] + stage['width']/2, stage['y'] + stage['height']/2)
        assert speed.is_hidden()
        # Keyboard focus must reveal the extension and allow reaching the slider.
        page.locator('#drawing').focus()
        page.keyboard.press('Tab')
        assert button.evaluate('(el)=>el===document.activeElement')
        page.keyboard.press('Tab')
        assert speed.evaluate('(el)=>el===document.activeElement') and speed.is_visible()
        page.keyboard.press('Tab')
        assert speed.is_hidden()
        assert speed.input_value() == "6"
        assert page.locator("#auto-orbit-rate").text_content() == "6°/s"
        original_geometry = page.locator('#drawing').inner_html()
        before = start()
        page.wait_for_function('(html)=>document.querySelector("#drawing").innerHTML!==html', arg=original_geometry)
        button.click()
        after = stopped()
        assert before['yaw'] != after['yaw']
        assert {k:v for k,v in before.items() if k != 'yaw'} == {k:v for k,v in after.items() if k != 'yaw'}
        page.locator('#undo').click()
        assert pose() == before
        page.locator('#redo').click()
        assert pose() == after
        page.locator('#ui-language').select_option('zh')
        assert button.get_attribute('aria-label') == '自动旋转'
        assert speed.get_attribute('aria-label') == '旋转速度'
        page.locator('#ui-language').select_option('en')
        assert button.get_attribute('aria-label') == 'Automatic rotation'
        button.hover()
        speed.fill('6')
        start()
        speed.fill('90')
        assert button.get_attribute('aria-pressed') == 'true'
        assert page.locator('#auto-orbit-rate').inner_text() == '90°/s'
        yaw = pose()['yaw']
        page.wait_for_function('(yaw)=>Math.abs((JSON.parse(window.__round36Snapshot()).scene3d.options.yaw-yaw+540)%360-180)>15', arg=yaw)
        button.click()
        stopped()
        button.hover()
        speed.fill('24')
        start()
        page.locator('#zoom-in').click()
        stopped()
        start()
        box = page.locator('#drawing').bounding_box()
        page.mouse.move(box['x']+box['width']/2, box['y']+box['height']/2)
        page.mouse.down()
        page.mouse.move(box['x']+box['width']/2+25, box['y']+box['height']/2, steps=3)
        page.mouse.up()
        stopped()
        start()
        mode.uncheck()
        assert button.is_hidden() and button.get_attribute('aria-pressed') == 'false'
        mode.check()
        complete()
        start()
        # Replacing the project must not let a pending orbit mutate the new document.
        replacement = snapshot()
        replacement['scene3d']['options']['yaw'] = 42
        page.locator('#open-file').set_input_files({'name':'replacement.json','mimeType':'application/json','buffer':json.dumps(replacement).encode()})
        page.wait_for_function("JSON.parse(window.__round36Snapshot()).scene3d.options.yaw===42")
        assert stopped()['yaw'] == 42
        page.set_viewport_size({'width':390,'height':844})
        assert button.is_visible()
        button.hover()
        assert speed.is_visible()
        page.wait_for_function('''() => {
            const box = document.querySelector('#auto-orbit-controls').getBoundingClientRect();
            const stage = document.querySelector('.stage').getBoundingClientRect();
            return box.left >= stage.left && box.right <= stage.right && box.bottom <= stage.bottom;
        }''')
        start()
        button.click()
        stopped()
        touch = browser.new_page(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True)
        touch.set_content(inline_html(legacy_search_expanded=False, expose_state=True), wait_until='load')
        touch.locator('#scene3d-enable').check()
        touch_button = touch.locator('#auto-orbit')
        touch_speed = touch.locator('#auto-orbit-speed')
        assert touch_speed.is_hidden()
        touch_button.tap()
        assert touch_speed.is_visible()
        touch.locator('#zoom-in').tap()
        assert touch_speed.is_hidden()
        touch.close()
        assert not errors, errors
        print('ROUND339_CHROMIUM_PASS: rotation, pause, undo/redo, zoom, 2D mode, import, localization and mobile')
    finally:
        browser.close()
