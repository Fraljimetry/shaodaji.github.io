"""Chromium-only diagnostic: count Canvas2D dense triangle operations.

Instrumentation is limited to this isolated test document. Not a speed benchmark:
monkey-patching Canvas APIs adds overhead, so report counts and approximate cost only.
"""
import base64
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
import browser_smoke

browser_smoke.ROOT = Path(__file__).resolve().parents[1]
EXPRESSION = 'cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1'
INSTRUMENT = '''<script>
window.__paint218 = {fills: 0, beginPaths: 0, lines: 0, fillMs: 0};
const proto218 = CanvasRenderingContext2D.prototype;
for (const [name, count] of [['fill','fills'],['beginPath','beginPaths'],['lineTo','lines']]) {
 const original = proto218[name];
 proto218[name] = function(...args) {
  window.__paint218[count]++;
  if (name !== 'fill') return original.apply(this,args);
  const t = performance.now();
  try { return original.apply(this,args); }
  finally { window.__paint218.fillMs += performance.now()-t; }
 };
}
</script>'''
EXPECTED = {
    '32': '6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b',
    '-38': '5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1',
}
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        html = browser_smoke.inline_html()
        assert '<script type="module">' in html
        html = html.replace('<script type="module">', INSTRUMENT+'<script type="module">', 1)
        page.set_content(html, wait_until='load')
        done = lambda: page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=120000)
        page.locator('#scene3d-enable').check()
        page.locator('#plot-mode').select_option('implicit3d')
        page.locator('#command').fill(EXPRESSION)
        page.locator('#command-form button').click()
        done()
        page.locator('#scene3d-detail').fill('80')
        page.locator('#scene3d-detail').dispatch_event('change')
        done()
        measures=[]
        for yaw in (32, -38):
            page.evaluate('window.__paint218 = {fills:0,beginPaths:0,lines:0,fillMs:0}')
            page.locator('#scene3d-yaw').fill(str(yaw))
            page.locator('#scene3d-yaw').dispatch_event('change')
            done()
            image = page.locator('#drawing image[data-3d-raster]')
            assert image.count() == 1
            href = image.get_attribute('href')
            assert href.startswith('data:image/png;base64,')
            digest = hashlib.sha256(base64.b64decode(href.split(',',1)[1])).hexdigest()
            assert digest == EXPECTED[str(yaw)], (yaw, digest)
            data=page.evaluate('window.__paint218')
            assert 150000 < data['fills'] < 250000, data
            assert data['beginPaths'] >= data['fills'], data
            assert data['lines'] >= 2*data['fills'], data
            measures.append({'yaw':yaw,'sha256':digest,**data})
        assert not errors, errors
        print('ROUND218_PAINT_DIAGNOSTIC_PASS')
        print(json.dumps(measures,indent=2))
    finally:
        browser.close()
