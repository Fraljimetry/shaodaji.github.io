"""Permanent folded implicit benchmark: real app, exact repeat-image stability.

Runs in a local isolated headless Chromium fixture (not a GPU/hosted certification).
Outputs measured times without asserting a machine-dependent performance threshold.
"""
import base64
import hashlib
import json
import statistics
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright
import browser_smoke

ROOT = Path(__file__).resolve().parents[1]
EXPRESSION = 'cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)=1'


def image_sha(page):
    image = page.locator('#drawing image[data-3d-raster]')
    assert image.count() == 1, 'Dense benchmark must use complete raster display'
    href = image.get_attribute('href')
    assert href.startswith('data:image/png;base64,'), 'Unexpected raster format'
    return hashlib.sha256(base64.b64decode(href.partition(',')[2])).hexdigest()


def complete(page):
    page.wait_for_function("!document.querySelector('#render-info').textContent.includes('rendering')", timeout=120000)


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        browser_smoke.ROOT = ROOT
        page = browser.new_page(viewport={'width': 1280, 'height': 800})
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.set_content(browser_smoke.inline_html(), wait_until='load')
        page.locator('#scene3d-enable').check()
        page.locator('#plot-mode').select_option('implicit3d')
        page.locator('#command').fill(EXPRESSION)
        page.locator('#command-form button').click()
        complete(page)
        results = []
        for detail in (22, 48, 80, 96):
            t0 = time.perf_counter()
            page.locator('#scene3d-detail').fill(str(detail))
            page.locator('#scene3d-detail').dispatch_event('change')
            complete(page)
            cold = round((time.perf_counter() - t0) * 1000, 2)
            samples = []
            hashes = {}
            for yaw in (32, -38, 32, -38):
                t0 = time.perf_counter()
                page.locator('#scene3d-yaw').fill(str(yaw))
                page.locator('#scene3d-yaw').dispatch_event('change')
                complete(page)
                elapsed = round((time.perf_counter() - t0) * 1000, 2)
                digest = image_sha(page)
                if yaw in hashes:
                    assert digest == hashes[yaw], f'Non-deterministic PNG at detail={detail}, yaw={yaw}'
                hashes[yaw] = digest
                samples.append(elapsed)
            if detail == 80:
                assert set(hashes.values()) == {
                    '5b97dcdc712615231d5bf618fc93b965b9905b9ccbb6c8a9d66a3c27159201c1',
                    '6700019d3a4151d7c880f282916ab2e5364c34e951274d9611de03fe9cb6458b',
                }, 'Round 216 pixel-reference hashes changed'
            results.append({'detail': detail, 'initial_ms': cold, 'camera_median_ms': statistics.median(samples),
                            'camera_range_ms': [min(samples), max(samples)], 'samples_ms': samples,
                            'yaw_png_sha256': hashes})
        assert not errors, errors
        print('ROUND217_CHROMIUM_FIXTURE_PASS')
        print(json.dumps(results, indent=2))
    finally:
        browser.close()
