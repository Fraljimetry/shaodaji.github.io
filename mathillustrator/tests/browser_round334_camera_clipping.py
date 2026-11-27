"""Real Chromium perspective near-plane clipping, including downloaded SVG."""
import json, math, os, re
from xml.etree import ElementTree as ET
from playwright.sync_api import sync_playwright
from browser_smoke import inline_html

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=os.getenv('MATHILLUSTRATOR_CHROMIUM', '/usr/bin/chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('dialog', lambda d: d.accept())
        page.set_content(inline_html(expose_state=True), wait_until='load')
        snapshot = lambda: json.loads(page.evaluate('window.__round36Snapshot()'))
        page.locator('#scene3d-enable').check()
        page.locator('#plot-mode').select_option('vector3d')
        page.locator('#command').fill('1,0,0')
        page.locator('#command').press('Enter')
        # Import an explicit fixture rather than depending on UI region edits.
        doc = snapshot()
        scene = doc['scene3d']
        bounds = lambda lo, hi: {axis + edge: value for axis in 'xyz' for edge, value in [('Min', lo), ('Max', hi)]}
        scene['options'].update(fixRegion=True, fixedBounds=bounds(-1, 1), yaw=90, pitch=0, detail=8)
        scene['plots'] = [{'id': 1, 'name': 'Vector field', 'kind': 'vector3d', 'a': '1', 'b': '0', 'c': '0', 'bounds': bounds(-7, 7), 'color': '#000000', 'opacity': 1, 'hidden': False, 'locked': False, 'colorRange': False, 'density': 5, 'normalized': True, 'lineWidth': 1.5}, {'id': 2, 'name': 'Surface', 'kind': 'surface3d', 'a': '0', 'b': '', 'c': '', 'bounds': bounds(-7, 7), 'color': '#000000', 'opacity': 1, 'hidden': False, 'locked': False, 'colorRange': False}]
        scene['nextId'] = 3
        page.locator('#open-file').set_input_files({'name': 'camera.json', 'mimeType': 'application/json', 'buffer': json.dumps(doc).encode()})
        page.wait_for_function("JSON.parse(window.__round36Snapshot()).scene3d.plots.length===2")
        page.wait_for_function("document.querySelectorAll('#drawing polygon').length>50 && !document.querySelector('#render-info').textContent.includes('rendering')")
        def check(polygons):
            assert len(polygons) > 50
            for points in polygons:
                coords = [float(v) for v in re.split(r'[ ,]+', points.strip())]
                assert len(coords) == 6 and all(math.isfinite(v) for v in coords), points
        check(page.locator('#drawing polygon').evaluate_all('(ps)=>ps.map(p=>p.getAttribute("points"))'))
        page.locator('#export-open').click()
        with page.expect_download(timeout=45000) as pending:
            page.locator('#export-options button', has_text='SVG').click()
        root = ET.parse(pending.value.path())
        check([p.get('points') for p in root.findall('.//{http://www.w3.org/2000/svg}polygon')])
        assert not errors, errors
        print('ROUND334_CHROMIUM_PASS: clipped vector and surface SVG, finite triangle coordinates')
    finally:
        browser.close()
