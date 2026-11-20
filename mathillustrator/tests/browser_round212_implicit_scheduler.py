"""Round 212: real Chromium, demanding implicit surface, cancel/restart and settled-orbit fidelity.

Uses an isolated inline document: not a test of the hosted production origin.
"""
import base64, hashlib, json, os, time
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

EXPR = 'cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1'

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(inline_html(expose_state=True), wait_until='load')
        settled = lambda: page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=120000)
        png = lambda: base64.b64decode(page.locator('#drawing image[data-3d-raster]').get_attribute('href').split(',', 1)[1])
        page.locator('#scene3d-enable').check()
        page.locator('#plot-mode').select_option('implicit3d')
        page.locator('#command').fill(EXPR)
        page.locator('#command-form button').click()
        settled()
        page.locator('#scene3d-detail').fill('64')
        page.locator('#scene3d-detail').dispatch_event('change')
        settled()
        reference = hashlib.sha256(png()).hexdigest()
        # Many changes while a demanding projection is pending: the latest wins.
        for yaw in [-95, -20, 35, 105, 20, 65]:
            page.locator('#scene3d-yaw').fill(str(yaw))
            page.locator('#scene3d-yaw').dispatch_event('change')
        settled()
        assert json.loads(page.evaluate('window.__round36Snapshot()'))['scene3d']['options']['yaw'] == 65
        changed = hashlib.sha256(png()).hexdigest()
        assert reference != changed, 'stale camera image survived rapid changes'
        # Interrupt a new expensive projection by switching modes, then return.
        page.locator('#scene3d-yaw').fill('-65')
        page.locator('#scene3d-yaw').dispatch_event('change')
        page.locator('#scene3d-enable').uncheck()
        assert page.locator('#drawing image[data-3d-raster]').count() == 0
        page.wait_for_timeout(100)
        assert page.locator('#drawing image[data-3d-raster]').count() == 0
        page.locator('#scene3d-enable').check()
        settled()
        assert page.locator('#drawing image[data-3d-raster]').count() == 1
        assert png().startswith(b'\x89PNG\r\n\x1a\n')
        assert not errors, errors
        print('PASS ROUND212_CHROMIUM', json.dumps({'formula': EXPR, 'detail': 64, 'rapidYawChanges': 6, 'finalYaw': -65, 'cancelAndRestore': True, 'pageErrors': errors}))
    finally:
        browser.close()
