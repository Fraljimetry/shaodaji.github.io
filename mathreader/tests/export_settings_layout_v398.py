#!/usr/bin/env python3
"""Chromium layout checks for the v398 compact Export data settings UI.
Uses actual project CSS/markup; no OCR or PDF.js worker is simulated.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
html = (root/'index.html').read_text(encoding='utf-8')
css = (root/'mathreader.css').read_text(encoding='utf-8')
part = html[html.index('<section class="workspace-section settings-section"'):html.index('<section class="workspace-section shortcuts"')]
markup = '<!doctype html><html data-theme="dark" data-lang="en"><head><meta charset="utf-8"><style>'+css+'</style></head><body><aside class="sidebar-right" style="width:244px;max-width:100%;box-sizing:border-box;padding:12px 14px;background:var(--surface);">'+part+'</aside></body></html>'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':330,'height':800},device_scale_factor=1)
    page.set_content(markup)
    group=page.locator('#settings-export-group')
    group.locator('summary').click()
    body=page.locator('.export-settings-body')
    option=page.locator('.export-setting-option')
    desc=page.locator('.export-setting-description')
    checks=page.locator('.export-setting-option input[type="checkbox"]')
    assert option.count()==desc.count()==checks.count()==2
    box=body.bounding_box()
    assert box and box['height']<155,box
    for i in range(2):
        label=option.nth(i).bounding_box(); txt=option.nth(i).locator('.export-setting-title').bounding_box()
        note=desc.nth(i).bounding_box(); ctrl=checks.nth(i).bounding_box()
        assert all((label,txt,note,ctrl))
        assert 0 <= note['y']-(txt['y']+txt['height']) <= 7,(i,txt,note)
        assert abs(ctrl['y']-txt['y'])<6,(i,ctrl,txt)
        assert note['x']>=txt['x']-1,(i,note,txt)
        assert label['x']>=0 and label['x']+label['width']<=244,(i,label)
    # Keep instructions compact and both click targets operable in dark/light and
    # narrow viewport. No descriptive text should overflow the right sidebar.
    for theme in ['dark','light']:
        page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
        for width in [220,330]:
            page.set_viewport_size({'width':width,'height':800})
            side=page.locator('.sidebar-right')
            assert side.evaluate('(el)=>el.scrollWidth <= el.clientWidth+1'),(theme,width)
            for i in range(2):
                checks.nth(i).check();assert checks.nth(i).is_checked()
                checks.nth(i).uncheck();assert not checks.nth(i).is_checked()
            assert body.bounding_box()['height']<175,(theme,width,body.bounding_box())
    browser.close()
print('PASS | Chromium v398 compact export settings | aligned text, close descriptions, two themes, narrow widths')
