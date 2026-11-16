"""Actual Chromium checks for construction-mode instructions, reversible locale and a11y."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    try:
        for width in (1440,768,390):
            page=browser.new_page(viewport={'width':width,'height':830})
            errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.set_content(inline_html(legacy_search_expanded=False),wait_until='domcontentloaded',timeout=90000)
            for language in ('zh','en','zh'):
                page.locator('#ui-language').select_option(language)
                for tool in ('pointOnObject','tangentCircle','freehand','morphism','circleInversion'):
                    # Tool shortcuts are not relied on; direct tool switching exercises the real handlers.
                    page.locator(f'[data-tool-choice="{tool}"]').evaluate('(e)=>e.click()')
                    label=page.locator('#drawing').get_attribute('aria-label')
                    assert label,(width,language,tool,'empty')
                    if language=='zh':
                        assert any(c in label for c in ('选择','点击','拖动','绘制')),(width,language,tool,label)
                        assert 'Click ' not in label and 'Drag ' not in label,(width,language,tool,label)
                    else:
                        assert ('Click ' in label or 'Drag ' in label or 'Choose ' in label),(width,language,tool,label)
            assert not errors,(width,errors)
            print('ROUND201_CHROMIUM_TRANSLATION_PASS',width,flush=True)
            page.close()
    finally:
        browser.close()
