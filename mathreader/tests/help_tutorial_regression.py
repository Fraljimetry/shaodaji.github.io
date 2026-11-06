#!/usr/bin/env python3
"""v365 reader header and Export interaction plus static tutorial Chromium regression.

The sandbox blocks HTTP/file/data navigation, so this checks the real reader
shell and independently renders the genuine tutorial HTML/CSS in Chromium.
It verifies the new-tab href/target contract but does NOT assert that a real
new-tab navigation was successfully exercised. No PDF.js/Texify acceptance.
"""
from __future__ import annotations
from pathlib import Path
import json
import sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'regression_tools'))
from p0_browser import inline_shell_browser

def tutorial_html():
    html=(ROOT/'tutorial.html').read_text(encoding='utf8')
    css=(ROOT/'tutorial.css').read_text(encoding='utf8')
    assert '<link rel="stylesheet" href="tutorial.css?v=370">' in html
    return html.replace('<link rel="stylesheet" href="tutorial.css?v=370">',f'<style>{css}</style>')

def run():
    checks=[]
    def check(value,description):checks.append({'name':description,'pass':bool(value)})
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for width in (320,375,768,1024,1440):
            ctx=browser.new_context(viewport={'width':width,'height':780},reduced_motion='reduce')
            reader=ctx.new_page(); errors=[]
            reader.on('pageerror',lambda error:errors.append(str(error)))
            inline_shell_browser(reader,ROOT,None)
            reader.wait_for_function('Boolean(window.__mathreaderP0)',timeout=14000)
            help_link=reader.locator('#help-button')
            check(reader.locator('#open-button').count()==0,f'{width}: top Open button removed')
            check(help_link.is_visible(),f'{width}: prominent Help visible')
            header_heights=reader.evaluate("""() => ['help-button','theme-button','language-button']
                .map(id => Math.round(document.getElementById(id).getBoundingClientRect().height * 100) / 100)""")
            check(all(abs(height-34)<0.5 for height in header_heights),
                  f'{width}: Help/Theme/Language uniform 34px height (actual {header_heights})')
            check(reader.evaluate("getComputedStyle(document.getElementById('help-button')).fontSize")=='15px',
                  f'{width}: compact question-mark glyph 15px')
            export_button=reader.locator('#export-reading-data')
            check(export_button.inner_text()=='Export' and
                  export_button.get_attribute('data-en')=='Export' and
                  export_button.get_attribute('data-zh')=='导出',
                  f'{width}: concise bilingual Export action')
            check(export_button.get_attribute('title')=='Export reading data',
                  f'{width}: full export description retained on hover')
            check(help_link.get_attribute('href')=='tutorial.html',f'{width}: Help targets tutorial.html')
            check(help_link.get_attribute('target')=='_blank' and help_link.get_attribute('rel')=='noopener',f'{width}: safe new-tab contract')
            check(reader.evaluate('document.documentElement.scrollWidth===innerWidth'),f'{width}: reader has no overflow')
            reader.evaluate("window.__fileClicks=0; document.getElementById('file-input').addEventListener('click',()=>window.__fileClicks++);")
            reader.keyboard.press('o')
            check(reader.evaluate('window.__fileClicks')==1,f'{width}: O shortcut retains file chooser')
            reader.keyboard.press('h')
            check(reader.locator('#library-open-pdf').is_visible(),f'{width}: History alternative PDF opener visible')
            reader.locator('#language-button').click()
            check(reader.locator('#export-reading-data').inner_text()=='导出',
                  f'{width}: language switch uses concise Chinese Export')
            reader.locator('#language-button').click()
            check(reader.locator('#export-reading-data').inner_text()=='Export',
                  f'{width}: switching back restores concise English Export')
            reader.locator('#library-open-pdf').click()
            check(reader.evaluate('window.__fileClicks')==2,f'{width}: History open triggers chooser')
            check(not errors,f'{width}: no reader JS exceptions')
            guide=ctx.new_page()
            guide_errors=[];guide.on('pageerror',lambda error:guide_errors.append(str(error)))
            guide.set_content(tutorial_html(),wait_until='domcontentloaded')
            check(guide.locator('h1').count()==1,f'{width}: tutorial has one top-level heading')
            check(guide.locator('section[id]').count()==12,f'{width}: twelve organized tutorial chapters')
            check(guide.locator('#crossdoc').count()==1 and guide.locator('#shortcuts').count()==1,f'{width}: P1 and shortcuts documented')
            check(guide.locator('.lang.zh').first.is_hidden(),f'{width}: default English language shown')
            check(guide.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'{width}: tutorial has no horizontal overflow')
            guide.locator('#help-language').click()
            check(guide.locator('html').get_attribute('data-lang')=='zh',f'{width}: tutorial switches to Chinese')
            check(guide.locator('.lang.en').first.is_hidden(),f'{width}: English text hidden in Chinese mode')
            guide.locator('#help-theme').click()
            check(guide.locator('html').get_attribute('data-theme')=='dark',f'{width}: tutorial switches theme')
            check(guide.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'{width}: Chinese mode has no overflow')
            guide.locator('.guide-nav a[href="#crossdoc"]').click()
            check(guide.evaluate('location.hash')=='#crossdoc',f'{width}: chapter navigation works')
            check(not guide_errors,f'{width}: no tutorial JS exceptions')
            ctx.close()
        browser.close()
    failures=[x for x in checks if not x['pass']]
    print(json.dumps({'assertions':len(checks),'passed':len(checks)-len(failures),'failures':failures},ensure_ascii=False,indent=2))
    return 1 if failures else 0

if __name__=='__main__':raise SystemExit(run())
