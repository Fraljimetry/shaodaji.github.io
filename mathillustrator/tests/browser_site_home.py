"""Cut07 homepage discovery/locale/responsive browser contract.
Isolated Chromium DOM and CSS layout using the actual original site stylesheet/script.
Not a hosted HTTP check, nor an assertion about third-party MathJax loading.
"""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
import re

ROOT=Path(__file__).resolve().parents[2]
HTML_JS=ROOT/'assets/js/main-v15.js'
CSS=ROOT/'assets/css/style-v15.css'

def markup(path):
    html=path.read_text(encoding='utf-8')
    # This test uses a known local static HTML baseline; suppress third-party
    # scripts/resources while keeping inline homepage styling and real DOM.
    html=re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.I|re.S)
    html=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>', '', html, flags=re.I)
    html=re.sub(r'(<img\b[^>]*?\bsrc=")[^"]*(")',r'\1data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=\2',html,flags=re.I)
    return html

def run():
    assert CSS.is_file(), f'Missing stylesheet fixture: {CSS}'
    assert HTML_JS.is_file(), f'Missing locale script fixture: {HTML_JS}'
    checked=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=os.environ.get('MATHILLUSTRATOR_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'],headless=True)
        for filename in ('index.html','tools.html'):
            for viewport in ({'width':1366,'height':880},{'width':390,'height':844}):
                page=browser.new_page(viewport=viewport)
                page.set_content(markup(ROOT/filename),wait_until='domcontentloaded')
                page.add_style_tag(content=CSS.read_text(encoding='utf8'))
                page.add_script_tag(content=HTML_JS.read_text(encoding='utf8'))
                for lang in ('en','zh'):
                    if page.locator('html').get_attribute('data-lang')!=lang:
                        page.locator('[data-language-toggle]').click()
                    assert page.locator('html').get_attribute('data-lang')==lang
                    assert page.locator('html').get_attribute('lang')==('zh-CN' if lang=='zh' else 'en')
                    links=page.locator('a[href="mathillustrator/"]')
                    assert links.count()>=1
                    for i in range(links.count()):
                        assert links.nth(i).is_visible()
                        assert 'MathIllustrator' in links.nth(i).inner_text()
                    if filename=='index.html':
                        section=page.locator('#mathematical-software')
                        assert section.count()==1
                        assert page.locator('.software-card').count()==2
                        grid=page.locator('.software-grid').evaluate('(e)=>getComputedStyle(e).gridTemplateColumns')
                        assert (len(grid.split())==2)==(viewport['width']>700),(viewport,grid)
                        assert page.locator('a[href="mathreader/"]').count()>=2
                        assert page.locator('a[href="mathillustrator/tutorial.html"]').count()>=1
                        assert page.locator('.hero-tool-links a[href="mathillustrator/"]').is_visible()
                        assert page.locator('.software-card svg').count()==1
                    else:
                        assert page.locator('#mathreader a[href="mathreader/"]').count()==1
                        assert page.locator('#mathillustrator a[href="mathillustrator/"]').count()==1
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'),(filename,viewport,lang,page.evaluate('document.documentElement.scrollWidth'))
                    checked.append(f'{filename}:{viewport["width"]}:{lang}')
                # Independent theme control for both pages, ensure no layout instability
                page.locator('[data-theme-toggle]').click()
                assert page.locator('html').get_attribute('data-theme')=='dark'
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
                page.close()
        browser.close()
    print('CUT07_SITE_CHROMIUM_PASS',len(checked),checked)

if __name__=='__main__':run()
