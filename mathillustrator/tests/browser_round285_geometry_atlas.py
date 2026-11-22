"""Round 285: authoritative geometry atlas import, animation, themes, export, reopen.

Isolated real Chromium using the production app bundle through browser_smoke.inline_html.
This tests scene integrity and export validity, not pixel-exact mathematical topology.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

FIXTURE = Path(__file__).parent / 'fixtures' / 'mathillustrator_advanced_geometry_atlas.json'


def run():
    atlas = json.loads(FIXTURE.read_text(encoding='utf-8'))
    assert len(atlas['objects']) == 136
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'),
            args=['--no-sandbox'],
        )
        try:
            page = browser.new_page(viewport={'width': 1600, 'height': 960}, accept_downloads=True)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('dialog', lambda dialog: dialog.accept())
            page.set_content(inline_html(expose_state=True, legacy_search_expanded=False), wait_until='load')
            state = lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
            page.locator('#open-file').set_input_files({
                'name': FIXTURE.name, 'mimeType': 'application/json',
                'buffer': FIXTURE.read_bytes(),
            })
            page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length === 136')
            assert [item['id'] for item in state()['objects']] == [item['id'] for item in atlas['objects']]
            assert all(a.get('refs') == b.get('refs') for a, b in zip(state()['objects'], atlas['objects']))
            for theme in ('light', 'dark'):
                page.evaluate('(value) => document.documentElement.dataset.theme = value', theme)
                page.locator('#fit').click()
                assert page.locator('#drawing [data-id]').count() >= 136
            toggle = page.locator('#objects [data-slider="t"] .slider-play-toggle')
            assert toggle.count() == 1
            initial = state()['algebra']['sliders'][0]['value']
            toggle.click()
            page.wait_for_timeout(350)
            updated = state()['algebra']['sliders'][0]['value']
            toggle.click()
            assert initial != updated, 'Atlas slider playback did not advance'
            assert len(state()['objects']) == 136
            # SVG and raster exports of the imported complex scene.
            for fmt in ('SVG', 'PNG'):
                page.locator('#export-open').click()
                with page.expect_download(timeout=45000) as download:
                    page.locator('#export-options button').filter(has_text=fmt).click()
                data = download.value.path().read_bytes()
                if fmt == 'SVG':
                    assert data.startswith(b'<?xml') or b'<svg' in data[:500]
                    assert all(('data-id="' + item['id'] + '"').encode() in data for item in atlas['objects'])
                else:
                    assert data.startswith(b'\x89PNG\r\n\x1a\n') and len(data) > 20000
            with page.expect_download(timeout=45000) as download:
                page.locator('#save').click()
            saved = json.loads(download.value.path().read_text(encoding='utf-8'))
            assert [item['id'] for item in saved['objects']] == [item['id'] for item in atlas['objects']]
            assert all(a.get('refs') == b.get('refs') for a, b in zip(saved['objects'], atlas['objects']))
            page.locator('#open-file').set_input_files({
                'name': 'atlas_reopened.json', 'mimeType': 'application/json',
                'buffer': json.dumps(saved).encode(),
            })
            page.wait_for_function('JSON.parse(window.__round36Snapshot()).objects.length === 136')
            assert [item['id'] for item in state()['objects']] == [item['id'] for item in atlas['objects']]
            assert not errors, errors
            print('ROUND285_ATLAS_CHROMIUM_PASS: 136 objects, references, themes, Fit, slider, SVG, PNG, JSON reopen')
        finally:
            browser.close()


if __name__ == '__main__':
    run()
