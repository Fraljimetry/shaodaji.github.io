#!/usr/bin/env python3
"""Measure the real Settings typography in Chromium at supported sidebar widths.
Requires no live PDF, OCR, server, or network. Rejects inherited bigger child headings.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'mathreader.css').read_text(encoding='utf-8')
start = html.index('<section class="workspace-section settings-section"')
end = html.index('<section class="workspace-section shortcuts"', start)
settings = html[start:end]
markup = ('<!doctype html><html data-theme="dark"><head><meta charset="utf-8"><style>' + css
          + '</style></head><body><aside class="sidebar-right" style="width:250px;padding:12px 14px;background:var(--surface)">'
          + settings + '</aside></body></html>')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),
                                headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':720,'height':780})
    page.set_content(markup)
    for section in page.locator('.settings-group').all():
        section.evaluate('(e)=>e.open=true')
    checks = 0
    for theme in ['dark','light']:
        page.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
        for width in [204,220,244,250,270,330]:
            page.locator('.sidebar-right').evaluate('(e,w)=>e.style.width=w+"px"', width)
            font = page.evaluate('''() => {
              const f = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
              return {
                heading:f('#settings-section > .panel-heading'),
                summary:[...document.querySelectorAll('#settings-section > .settings-group > summary')]
                  .map(el=>parseFloat(getComputedStyle(el).fontSize)),
                inner:[...document.querySelectorAll('#settings-section .settings-group-heading, #settings-section .export-setting-title, #settings-section .display-label, #settings-section .ocr-troubleshooting > summary')]
                  .map(el=>parseFloat(getComputedStyle(el).fontSize)),
                boxes:[...document.querySelectorAll('#settings-section > .settings-group > summary')]
                  .map(el=>el.getBoundingClientRect().width)
              };
            }''')
            assert font['heading'] >= 12, (theme, width, font)
            assert len(font['summary']) == 3 and all(0 < n < font['heading'] for n in font['summary']), (theme,width,font)
            assert font['inner'] and all(0 < n <= max(font['summary']) for n in font['inner']), (theme,width,font)
            assert all(n > 0 for n in font['boxes']), (theme,width,font)
            assert page.locator('.sidebar-right').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'), (theme,width,'overflow')
            checks += 1
    browser.close()
print(f'PASS | v400 Settings font hierarchy | {checks} width/theme pairs, all three groups and nested labels')
