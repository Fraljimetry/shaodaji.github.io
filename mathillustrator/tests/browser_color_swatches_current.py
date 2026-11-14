"""Round 9: real UI swatch transactions in isolated Chromium (not live origin)."""
import json
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html, download


def snapshot(page):
    return json.loads(download(page, 'Save').read_text())


def swatch(page, scope, prop, color):
    return page.locator(f'[data-color-swatches="{scope}"][data-color-property="{prop}"] button[data-color="{color}"]')


def checked(page, scope, prop):
    return page.locator(f'[data-color-swatches="{scope}"][data-color-property="{prop}"] button[aria-pressed="true"]')


def add_point(page, x):
    page.locator('[data-tool-choice="point"]').click()
    box=page.locator('#drawing').bounding_box()
    page.mouse.click(box['x']+box['width']*x, box['y']+box['height']*.48)


def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
        page.on('dialog',lambda dialog:dialog.accept())
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        page.wait_for_function("document.querySelector('[data-tool-choice=point]') !== null")
        assert page.locator('[data-color-swatches="default"]').count()==2
        assert page.locator('[data-color-swatches="default"] button').count()==20
        assert page.locator('#default-stroke').input_value()=='#000000'
        assert checked(page,'default','stroke').count()==0,'black is not an offered swatch; custom default must not pretend it is selected'
        assert swatch(page,'default','stroke','#ef4444').get_attribute('aria-label')=='Red'
        assert swatch(page,'default','stroke','#ffffff').get_attribute('type')=='button'
        swatch(page,'default','stroke','#ef4444').click()
        swatch(page,'default','fill','#ffffff').click()
        assert page.locator('#default-stroke').input_value()=='#ef4444'
        assert page.locator('#default-fill').input_value()=='#ffffff'
        assert checked(page,'default','stroke').get_attribute('data-color')=='#ef4444'
        assert checked(page,'default','fill').get_attribute('data-color')=='#ffffff'
        add_point(page,.42)
        first=snapshot(page)
        assert first['objects'][0]['style']['stroke']=='#ef4444'
        assert first['objects'][0]['style']['fill']=='#ffffff'
        # A selected object has its own palette; changing it must not change global defaults.
        page.locator('#objects .object').first.click()
        assert page.locator('[data-color-swatches="object"][data-color-property="stroke"]').count()==1
        assert page.locator('[data-color-swatches="object"][data-color-property="fill"]').count()==0
        swatch(page,'object','stroke','#3b82f6').click()
        colored=snapshot(page)
        assert colored['objects'][0]['style']['stroke']=='#3b82f6'
        assert colored['settings']['stroke']=='#ef4444'
        assert page.locator('#properties input[type=color]').first.input_value()=='#3b82f6'
        assert checked(page,'object','stroke').get_attribute('data-color')=='#3b82f6'
        # Focused swatch remains usable across edits without detached stale callbacks.
        swatch(page,'object','stroke','#22c55e').click()
        assert snapshot(page)['objects'][0]['style']['stroke']=='#22c55e'
        page.locator('#undo').click()
        assert snapshot(page)['objects'][0]['style']['stroke']=='#3b82f6'
        page.locator('#redo').click()
        assert snapshot(page)['objects'][0]['style']['stroke']=='#22c55e'
        page.locator('#objects .object').first.click()
        # Native custom colors still work and unpress all preset buttons.
        picker=page.locator('#properties input[type=color]').first
        picker.fill('#123abc');picker.dispatch_event('change')
        assert snapshot(page)['objects'][0]['style']['stroke']=='#123abc'
        assert checked(page,'object','stroke').count()==0
        # Test fill swatches on an object type that actually supports fill editing.
        page.locator('[data-tool-choice="rectangle"]').click()
        box=page.locator('#drawing').bounding_box()
        page.mouse.click(box['x']+box['width']*.57,box['y']+box['height']*.54)
        page.mouse.click(box['x']+box['width']*.67,box['y']+box['height']*.63)
        assert len(snapshot(page)['objects'])==8 and sum(o['type']=='segment' for o in snapshot(page)['objects'])==4 and next(o for o in snapshot(page)['objects'] if o['type']=='rectangle')
        page.locator('#objects .object').filter(has_text='Rectangle').first.click()
        assert page.locator('[data-color-swatches="object"][data-color-property="fill"]').count()==1
        swatch(page,'object','fill','#eab308').click()
        assert next(o for o in snapshot(page)['objects'] if o['type']=='rectangle')['style']['fill']=='#eab308'
        # Repeated locale changes must translate group/button names, no duplicates.
        for locale, name in [('zh','红色'),('en','Red'),('zh','红色'),('en','Red')]:
            page.locator('#ui-language').select_option(locale)
            assert swatch(page,'default','stroke','#ef4444').get_attribute('aria-label')==name
            assert page.locator('[data-color-swatches="default"][data-color-property="stroke"]').get_attribute('aria-label')==('线条常用色' if locale=='zh' else 'Stroke colors')
            assert page.locator('[data-color-swatches="default"] button').count()==20
        # Undo/redo default palette; saved JSON changes are normal settings.
        original=snapshot(page)
        page.locator('#default-stroke').fill('#506070')
        page.locator('#default-stroke').dispatch_event('change')
        assert snapshot(page)['settings']['stroke']=='#506070'
        assert checked(page,'default','stroke').count()==0
        page.locator('#undo').click()
        assert snapshot(page)['settings']['stroke']=='#ef4444'
        page.locator('#redo').click()
        assert snapshot(page)['settings']['stroke']=='#506070'
        # Export/import round trip and invalid-input rollback.
        good=snapshot(page)
        page.locator('#open-file').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':json.dumps(good).encode()})
        assert snapshot(page)==good
        assert checked(page,'default','stroke').count()==0
        corrupt=json.loads(json.dumps(good));corrupt['settings']['stroke']='not a color'
        page.locator('#open-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(corrupt).encode()})
        assert snapshot(page)==good,'invalid import must leave existing project unchanged'
        # Locked objects must not acquire palette controls.
        page.locator('#objects .object').first.locator('.object-menu-toggle').click()
        page.locator('#object-action-menu button[data-action="lock"]').click()
        page.locator('#objects .object').first.click()
        assert page.locator('[data-color-swatches="object"]').count()==0
        # Keyboard semantics and responsive wrapping.
        button=swatch(page,'default','stroke','#ef4444')
        button.focus();assert page.evaluate('document.activeElement?.dataset.color')=='#ef4444'
        page.keyboard.press('Enter')
        assert snapshot(page)['settings']['stroke']=='#ef4444'
        for width in (320,390,1440):
            page.set_viewport_size({'width':width,'height':850})
            # Hidden tools panel at mobile widths: open through existing mobile drawer.
            if width<=390:
                page.evaluate('document.body.classList.add("mobile-right-open")')
            assert page.locator('[data-color-swatches="default"] button').count()==20
            assert not page.evaluate('''() => [...document.querySelectorAll('.color-swatch')].some(b => b.getBoundingClientRect().width > 28)''')
        assert not errors,errors
        browser.close()
    print('COLOR_SWATCHES_PASS: accessible colors, defaults, object styles, undo/redo, custom picker, locked state, locale, JSON rollback, mobile')

if __name__=='__main__':run()
