"""Round 194: simplified two-row interface, legacy preference migration."""
import json, os
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page(viewport={'width':1536,'height':864})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script('''localStorage.setItem('mathillustrator-layout-v1', JSON.stringify({autoDiagramLabels:true, autoPan:true, selectionPreview:true}));''')
        page.set_content(inline_html(legacy_search_expanded=False),wait_until='load')
        assert page.locator('#auto-diagram-labels').count()==0
        def rect(selector):return page.locator(selector).bounding_box()
        pan,sel,mode=(rect('#auto-pan'),rect('#selection-preview'),rect('#scene3d-enable'))
        assert abs(pan['y']-sel['y'])<4,(pan,sel)
        assert mode['y']>pan['y']+10,(mode,pan)
        assert pan['x']<sel['x'] and abs(pan['x']-mode['x'])<5,(pan,sel,mode)
        assert page.locator('.interface-check-grid input:visible').count()==3
        page.locator('#auto-pan').uncheck()
        page.locator('#selection-preview').uncheck()
        assert not page.locator("#auto-pan").is_checked()
        assert not page.locator("#selection-preview").is_checked()
        page.locator('#scene3d-enable').check()
        assert page.locator('#fast-3d-orbit').is_visible()
        assert not page.locator('#auto-pan').is_visible()
        assert not page.locator('#selection-preview').is_visible()
        assert page.locator('#scene3d-fix-region').is_visible()
        assert page.locator('.interface-check-grid input:visible').count()==3
        page.locator('#scene3d-enable').uncheck()
        assert not page.locator('#fast-3d-orbit').is_visible()
        assert page.locator('.interface-check-grid input:visible').count()==3
        assert not errors,errors
        print('ROUND194_CHROMIUM_PASS: placement, 2D/3D, saved preferences, no console errors')
    finally:
        browser.close()
