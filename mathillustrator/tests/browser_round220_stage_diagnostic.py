"""Diagnose main-thread work phases on the exact dense 3D fixture.

Instrumentation is injected into the isolated Chromium test document only.
This is a diagnostic, not a production-code change or a portable speed claim.
"""
import base64
import hashlib
import json
import statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
import browser_smoke

browser_smoke.ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {32: '6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b',
            -38: '5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1'}

html = browser_smoke.inline_html()
# This test is not part of the site. Observe separate uninterrupted JS segments.
init = '''<script>window.__r220={sort:[],compute:[],paint:[],encode:[]};
const __origSort220=Array.prototype.sort;Array.prototype.sort=function(compare){const t=performance.now();const r=__origSort220.call(this,compare);if(this.length>10000)window.__r220.sort.push({n:this.length,ms:performance.now()-t});return r;};</script>'''
html = html.replace('<script type="module">', init + '<script type="module">', 1)
patches = [
    ('const paint=()=>{\n   sceneRenderTimer=null;',
     'const paint=()=>{\n   const __r220paintStart=performance.now();\n   sceneRenderTimer=null;'),
    ('if(next<result.primitives.length)sceneRenderTimer=scheduleSceneWork(paint);',
     'window.__r220.paint.push(performance.now()-__r220paintStart);\n   if(next<result.primitives.length)sceneRenderTimer=scheduleSceneWork(paint);'),
    ("href:raster.canvas.toDataURL('image/png')", "href:(()=>{const t=performance.now();const s=raster.canvas.toDataURL('image/png');window.__r220.encode.push(performance.now()-t);return s;})()"),
    ('const compute=()=>{\n  sceneRenderTimer=null;',
     'const compute=()=>{\n  const __r220computeStart=performance.now();\n  sceneRenderTimer=null;'),
    ('const state=sceneRenderTask.step(7);',
     'const state=sceneRenderTask.step(7);window.__r220.compute.push(performance.now()-__r220computeStart);'),
]
for before, after in patches:
    assert before in html, f'Missing expected site source: {before[:80]}'
    assert html.count(before) == 1, f'Ambiguous substitution: {before[:80]}'
    html = html.replace(before, after, 1)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(html, wait_until='load')
        done = lambda: page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=120000)
        page.locator('#scene3d-enable').check()
        page.locator('#plot-mode').select_option('implicit3d')
        page.locator('#command').fill('cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1')
        page.locator('#command-form button').click()
        done()
        page.locator('#scene3d-detail').fill('80')
        page.locator('#scene3d-detail').dispatch_event('change')
        done()
        observations=[]
        for yaw in (32, -38, 32, -38):
            page.evaluate('window.__r220={sort:[],compute:[],paint:[],encode:[]}')
            page.locator('#scene3d-yaw').fill(str(yaw))
            page.locator('#scene3d-yaw').dispatch_event('change')
            done()
            href=page.locator('#drawing image[data-3d-raster]').get_attribute('href')
            digest=hashlib.sha256(base64.b64decode(href.split(',',1)[1])).hexdigest()
            assert digest == EXPECTED[yaw], (yaw,digest)
            info=page.evaluate('window.__r220')
            assert info['paint'] and info['compute'] and info['encode']
            # Cooperative sorting produces no >10k-element native sort calls.
            # Preserve the diagnostic for both the legacy and new renderer.
            obs={'yaw':yaw,'sha256':digest}
            for key, values in info.items():
                timings=[v['ms'] for v in values] if key=='sort' else values
                obs[key]={'count':len(values),'sumMs':round(sum(timings),2),'maxMs':round(max(timings),2) if timings else 0, 'medianMs':round(statistics.median(timings),2) if timings else 0}
                if key=='sort':obs[key]['sizes']=[v['n'] for v in values]
            observations.append(obs)
        assert not errors, errors
        print('ROUND220_STAGE_DIAGNOSTIC_PASS')
        print(json.dumps(observations,indent=2))
    finally:
        browser.close()
