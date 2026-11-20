"""Round 219: record browser main-thread stalls during dense 3D repaint.

Diagnostic only; hardware-specific timings are reported, not asserted as a
cross-machine performance requirement. Exact PNG hash remains mandatory.
"""
import base64
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
import browser_smoke

browser_smoke.ROOT = Path(__file__).resolve().parents[1]
EXPRESSION = 'cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1'
EXPECTED = {
    32: '6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b',
    -38: '5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1',
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(browser_smoke.inline_html(), wait_until='load')
        done = lambda: page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=120000)
        page.locator('#scene3d-enable').check()
        page.locator('#plot-mode').select_option('implicit3d')
        page.locator('#command').fill(EXPRESSION)
        page.locator('#command-form button').click()
        done()
        page.locator('#scene3d-detail').fill('80')
        page.locator('#scene3d-detail').dispatch_event('change')
        done()
        observations = []
        for yaw in (32, -38):
            page.evaluate('''() => {
                window.__r219={intervals:[],last:performance.now(),start:performance.now()};
                window.__r219.timer=setInterval(()=>{
                    let now=performance.now();
                    window.__r219.intervals.push(now-window.__r219.last);
                    window.__r219.last=now;
                }, 8);
            }''')
            page.locator('#scene3d-yaw').fill(str(yaw))
            page.locator('#scene3d-yaw').dispatch_event('change')
            done()
            timing = page.evaluate('''() => {
                clearInterval(window.__r219.timer);
                const {intervals,start}=window.__r219;
                return {elapsedMs:performance.now()-start,heartbeatCount:intervals.length,
                    maxHeartbeatGapMs:Math.max(0,...intervals),
                    gapsOver50Ms:intervals.filter(x=>x>50).length};
            }''')
            href = page.locator('#drawing image[data-3d-raster]').get_attribute('href')
            assert href.startswith('data:image/png;base64,')
            digest = hashlib.sha256(base64.b64decode(href.split(',', 1)[1])).hexdigest()
            assert digest == EXPECTED[yaw], (yaw, digest)
            observations.append({'yaw':yaw, 'sha256':digest, **timing})
        assert not errors, errors
        print('ROUND219_RESPONSIVENESS_PASS')
        print(json.dumps(observations, indent=2))
    finally:
        browser.close()
