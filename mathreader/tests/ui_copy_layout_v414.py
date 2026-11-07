#!/usr/bin/env python3
"""v414 browser-visible copy/layout regression (real DOM/CSS, no live PDF.js)."""
from pathlib import Path
import sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'regression_tools'))
from p0_browser import inline_shell_browser
checks=0
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for width,height in [(320,568),(320,640),(390,844),(768,900),(1440,900)]:
        ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
        page=ctx.new_page()
        inline_shell_browser(page,root,None)
        assert page.evaluate('document.documentElement.scrollWidth')==width,f'horizontal overflow at {width}px';checks+=1
        assert page.locator('#map-filter-theorems').get_attribute('placeholder')=='Filter results…';checks+=1
        assert page.locator('#structure-empty').text_content()=='Open a PDF to index results.';checks+=1
        assert page.locator('#bibliography-empty').text_content()=='Open a PDF to index references.';checks+=1
        assert page.locator('#equation-index-empty').text_content()=='Open a PDF to index equations.';checks+=1
        title=page.locator('#welcome h1').inner_text()
        assert title=='A focused reader for mathematical PDFs.',title;checks+=1
        assert page.locator('#welcome-open').is_visible();checks+=1
        # On short mobile screens the entire welcome must be scroll-reachable.
        page.locator('#welcome').evaluate('(e)=>{e.scrollTop=e.scrollHeight;}')
        box=page.locator('.privacy-note').bounding_box()
        pane=page.locator('#welcome').bounding_box()
        assert box and pane and box['y']+box['height']<=pane['y']+pane['height']+1,(width,height,box,pane);checks+=1
        assert page.evaluate('document.documentElement.scrollWidth')==width;checks+=1
        page.locator('#theme-button').click()
        assert page.locator('html').get_attribute('data-theme')=='dark';checks+=1
        page.locator('#language-button').click()
        assert page.locator('#map-filter-theorems').get_attribute('placeholder')=='筛选结果…';checks+=1
        assert page.locator('#welcome h1').inner_text()=='数学 PDF 阅读器';checks+=1
        assert page.locator('#structure-empty').text_content()=='打开 PDF 后可建立结果索引。';checks+=1
        assert page.locator('#bibliography-empty').text_content()=='打开 PDF 后可建立参考文献索引。';checks+=1
        assert page.locator('#equation-index-empty').text_content()=='打开 PDF 后可建立公式索引。';checks+=1
        assert page.evaluate('document.documentElement.scrollWidth')==width;checks+=1
        ctx.close()
    browser.close()
print(f'PASS v414 bilingual UI copy and layout: {checks} assertions')
