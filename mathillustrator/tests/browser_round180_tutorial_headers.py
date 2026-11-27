"""Verify actual bilingual tutorial table alignment at desktop and mobile widths."""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def run():
    html = (ROOT / 'tutorial.html').read_text(encoding='utf-8')
    css = (ROOT / 'style.css').read_text(encoding='utf-8')
    html = re.sub(r'<link[^>]*stylesheet[^>]*>',
                  lambda m: '<style>' + css + '</style>' if 'style.css' in m[0] else m[0], html)
    exe = os.environ.get('MATHILLUSTRATOR_CHROMIUM')
    if not exe and Path('/usr/bin/chromium').is_file():
        exe = '/usr/bin/chromium'
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=['--no-sandbox'],
                                     **({'executable_path': exe} if exe else {}))
        try:
            for width in (1440, 768, 390):
                page = browser.new_page(viewport={'width': width, 'height': 900})
                try:
                    page.set_content(html, wait_until='domcontentloaded')
                    for lang in ('en', 'zh'):
                        if page.locator('html').get_attribute('data-lang') != lang:
                            page.locator('#lang-switch').click()
                        assert page.locator('html').get_attribute('data-lang') == lang
                        headers = page.locator('#guide th:visible')
                        count = headers.count()
                        alignment = headers.evaluate_all('ns => ns.map(e => getComputedStyle(e).textAlign)')
                        assert count >= 2 and all(a == 'left' for a in alignment), (width, lang, count, alignment)
                        print(f'PASS {width}px {lang}: {count} visible table headers')
                finally:
                    page.close()
        finally:
            browser.close()
    print('ROUND180_CHROMIUM_PASS')


if __name__ == '__main__':
    run()
