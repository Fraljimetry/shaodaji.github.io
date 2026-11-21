"""Round280 actual Chromium: imported single-visible implicit surface, no incomplete render/export."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html


def run():
    source = json.loads((Path(__file__).resolve().parent / 'fixtures' / 'round280_implicit_surface3.json').read_text())
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
        try:
            page = browser.new_page(viewport={'width': 1500, 'height': 900}, accept_downloads=True)
            errors = []
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.on('dialog', lambda dialog: dialog.accept())
            page.set_content(inline_html(expose_state=True), wait_until='domcontentloaded')
            page.locator('#open-file').set_input_files({'name': 'round280-scene.json', 'mimeType': 'application/json', 'buffer': json.dumps(source).encode()})
            page.wait_for_function("JSON.parse(window.__round36Snapshot()).scene3d.plots.length === 3", timeout=25000)
            page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=60000)
            state = json.loads(page.evaluate('window.__round36Snapshot()'))
            assert state['scene3d']['plots'][2]['a'] == 'sin(x)+sin(y)+sin(z)'
            assert sum(not plot['hidden'] for plot in state['scene3d']['plots']) == 1
            assert state['scene3d']['options']['detail'] == 16
            render_info = page.locator('#render-info').inner_text()
            assert 'PLOT LIMIT' not in render_info, render_info
            assert page.locator('#drawing polygon').count() >= 8000, render_info
            assert not errors, errors
            print('PASS ROUND280 CHROMIUM', json.dumps({'polygons':page.locator('#drawing polygon').count(),'info':render_info,'errors':errors}))
        finally:
            browser.close()

if __name__ == '__main__':
    run()
