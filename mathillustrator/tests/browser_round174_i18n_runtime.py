"""Round 174: verified Chinese runtime dialogs and dynamic UI across viewports."""
import os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
    try:
        for width in (1440,768,390):
            page=browser.new_page(viewport={'width':width,'height':800})
            errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.set_content(inline_html(legacy_search_expanded=False),wait_until='load',timeout=90000)
            page.locator('#ui-language').select_option('zh')
            dialogs=[]
            page.on('dialog',lambda dialog: (dialogs.append((dialog.type,dialog.message)),dialog.dismiss()))
            page.locator('#new').evaluate('e=>e.click()')
            assert dialogs and dialogs[-1][0]=='confirm' and dialogs[-1][1]=='新建绘图？如有需要，请先下载当前项目。',(width,dialogs)
            page.locator('#scene3d-enable').evaluate("e=>{e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}))}")
            assert page.locator('#scene3d-detail').get_attribute('title').startswith('范围：')
            page.locator('#ui-language').select_option('en')
            page.locator('#new').evaluate('e=>e.click()')
            assert dialogs[-1][0]=='confirm' and dialogs[-1][1].startswith('Start a new illustration?'),(width,dialogs)
            page.locator('#ui-language').select_option('zh')
            assert page.locator('#ui-language').input_value()=='zh'
            assert not errors,(width,errors)
            page.close()
        print('PASS Round 174 actual Chromium 1440/768/390 dialogs, dynamic settings, reversible locale')
    finally:browser.close()
