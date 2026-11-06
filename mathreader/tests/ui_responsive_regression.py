#!/usr/bin/env python3
"""Real Chromium UI/layout/stability regression for MathReader's real ten-part shell.

This runs the actual v362 JS and CSS without PDF.js or Texify. It cannot
certify original-PDF rendering, recognition or final mathematical indexes.
"""
from __future__ import annotations
import json
from pathlib import Path
import statistics
import sys
import time
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'regression_tools'))
from p0_browser import inline_shell_browser


def inspect(page):
    return page.evaluate('''() => {
      const rect=(el)=>el.getBoundingClientRect();
      const main=rect(document.getElementById('reader-stage'));
      const toolbar=rect(document.getElementById('reader-toolbar'));
      const visible=(id)=>{
        const e=document.getElementById(id),c=getComputedStyle(e),r=rect(e);
        return c.display!=='none' && c.visibility!=='hidden' && r.width>0 && r.height>0;
      };
      const buttons=[...document.querySelectorAll('#reader-toolbar button,#reader-toolbar input')]
        .filter(e=>{const c=getComputedStyle(e),r=rect(e);return c.display!=='none'&&r.width>0})
        .map(e=>({id:e.id, left:rect(e).left,right:rect(e).right,
                   top:rect(e).top,bottom:rect(e).bottom}));
      return {width:innerWidth, docScrollWidth:document.documentElement.scrollWidth, mainWidth:main.width,mainLeft:main.left,
        toolbarWidth:toolbar.width,toolbarRight:toolbar.right,
        helpVisible:visible('help-button'),
        libraryOpenExists:!!document.getElementById('library-open-pdf'),
        mobileLeft:visible('mobile-left-toggle'),mobileRight:visible('mobile-right-toggle'),
        leftClose:visible('mobile-left-close'),rightClose:visible('mobile-right-close'),
        leftExpanded:document.getElementById('mobile-left-toggle').getAttribute('aria-expanded'),
        rightExpanded:document.getElementById('mobile-right-toggle').getAttribute('aria-expanded'),
        leftOpen:document.getElementById('reader-shell').classList.contains('mobile-left-open'),
        rightOpen:document.getElementById('reader-shell').classList.contains('mobile-right-open'),
        formulaModal:!document.getElementById('formula-ocr-init-overlay').classList.contains('is-hidden'),
        toolbarItems:buttons};
    }''')


def run():
    checks=[];errors=[]; timings=[]
    def check(condition,label,detail=None):
        checks.append({'label':label,'passed':bool(condition),'detail':detail if not condition else None})
        if not condition:errors.append(label + (' '+str(detail) if detail is not None else ''))

    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        for width in (320, 375, 390, 520, 768, 860, 861, 1024, 1440):
            context=browser.new_context(viewport={'width':width,'height':740},reduced_motion='reduce')
            page=context.new_page()
            page_errors=[]
            page.on('pageerror',lambda error:page_errors.append(str(error)))
            begin=time.monotonic()
            inline_shell_browser(page,ROOT,None)
            page.wait_for_function('Boolean(window.__mathreaderP0)',timeout=12000)
            timings.append({'width':width,'shell_s':round(time.monotonic()-begin,4)})
            initial=inspect(page)
            mobile=width<=860
            check((abs(initial['mainWidth'] - width)<14) if mobile else (initial['mainWidth']>260 and initial['mainWidth']<width),
                  f'{width}: reader has usable width with configured panel defaults',initial)
            check(initial['docScrollWidth']==width, f'{width}: no horizontal page overflow', initial['docScrollWidth'])
            check(initial['helpVisible'],f'{width}: tutorial Help accessible')
            check(initial['libraryOpenExists'],f'{width}: local-library file opener available')
            check(initial['mobileLeft']==mobile and initial['mobileRight']==mobile,
                  f'{width}: side toggles use correct breakpoint')
            check(initial['toolbarRight']<=width+1,f'{width}: toolbar within viewport')
            if mobile:
                page.locator('#mobile-left-toggle').click()
                page.wait_for_function("document.getElementById('reader-shell').classList.contains('mobile-left-open')")
                opened=inspect(page)
                check(opened['leftClose'] and opened['leftExpanded']=='true' and not opened['rightOpen'],
                      f'{width}: Contents opens with reachable close')
                page.locator('#mobile-left-close').click()
                page.wait_for_function("!document.getElementById('reader-shell').classList.contains('mobile-left-open')")
                check(inspect(page)['leftExpanded']=='false',f'{width}: Contents closes')
                page.locator('#mobile-right-toggle').click()
                page.wait_for_function("document.getElementById('reader-shell').classList.contains('mobile-right-open')")
                opened=inspect(page)
                check(opened['rightClose'] and opened['rightExpanded']=='true' and not opened['leftOpen'],
                      f'{width}: Workspace opens with reachable close')
                page.locator('#mobile-right-close').click()
                page.wait_for_function("!document.getElementById('reader-shell').classList.contains('mobile-right-open')")
                check(inspect(page)['rightExpanded']=='false',f'{width}: Workspace closes')
                page.evaluate("document.getElementById('crossdoc-return').classList.remove('is-hidden')")
                simulated=inspect(page)
                check(simulated['toolbarRight']<=width+1 and
                      all(b['left']>=-1 and b['right']<=width+1 for b in simulated['toolbarItems']),
                      f'{width}: P1 return does not clip toolbar controls',simulated['toolbarItems'])
                # Re-run both mobile panel transitions after showing P1 return.
                page.locator('#mobile-left-toggle').click()
                page.keyboard.press('Escape')
                page.wait_for_function("!document.getElementById('reader-shell').classList.contains('mobile-left-open')")
                check(inspect(page)['leftExpanded']=='false',f'{width}: Escape restores sidebar state')
            else:
                for shortcut in ('l','r','l','r'):
                    page.keyboard.press(shortcut)
                check(abs(inspect(page)['mainWidth'] - initial['mainWidth'])<14,
                      f'{width}: desktop collapse/expand restores initial panel widths')
            page.locator('#theme-button').click()
            check(page.locator('html').get_attribute('data-theme')=='dark',f'{width}: theme switch')
            page.locator('#language-button').click()
            check(page.locator('html').get_attribute('data-lang')=='zh',f'{width}: language switch')
            page.locator('#welcome-open').click()
            check(page.locator('#file-input').count()==1,f'{width}: welcome file chooser remains wired')
            page.keyboard.press('Escape')
            page.keyboard.press('h')
            check(page.locator('#library-open-pdf').count()==1,f'{width}: History alternative PDF opener exists')
            page.locator('#library-open-pdf').click()
            check(page.locator('#file-input').count()==1,f'{width}: History PDF opener remains wired')
            check(page.locator('#help-button').get_attribute('href')=='tutorial.html',f'{width}: help links to dedicated page')
            check(not inspect(page)['formulaModal'],f'{width}: no eager Formula OCR modal')
            check(not page_errors,f'{width}: no uncaught UI JavaScript errors',page_errors)
            context.close()

        # Bound a stress run; state/DOM must not accumulate with repeated toggles.
        context=browser.new_context(viewport={'width':375,'height':740},reduced_motion='reduce')
        page=context.new_page();inline_shell_browser(page,ROOT,None)
        nodes0=page.evaluate('document.querySelectorAll("*").length')
        for i in range(30):
            page.locator('#mobile-left-toggle').click()
            page.locator('#mobile-left-close').click()
            page.locator('#mobile-right-toggle').click()
            page.locator('#mobile-right-close').click()
            page.locator('#theme-button').click()
        end=inspect(page)
        nodes1=page.evaluate('document.querySelectorAll("*").length')
        check(nodes0==nodes1,'30x open/close cycles do not accumulate DOM nodes',(nodes0,nodes1))
        check(not end['leftOpen'] and not end['rightOpen'],'30x cycles leave panels closed')
        check(not end['formulaModal'],'30x cycles leave OCR unblocked')
        context.close()

        # A touch-enabled browser must be able to operate both side panels;
        # the desktop-only keyboard shortcuts are not a substitute.
        touch=browser.new_context(viewport={'width':375,'height':667},is_mobile=True,has_touch=True,reduced_motion='reduce')
        page=touch.new_page();inline_shell_browser(page,ROOT,None)
        check(abs(inspect(page)['mainWidth']-375)<2,'touch viewport fills full width')
        page.locator('#mobile-left-toggle').tap()
        check(inspect(page)['leftOpen'],'touch Contents opens')
        page.locator('#mobile-left-close').tap()
        check(not inspect(page)['leftOpen'],'touch Contents closes')
        page.locator('#mobile-right-toggle').tap()
        check(inspect(page)['rightOpen'],'touch Workspace opens')
        page.locator('#mobile-right-close').tap()
        check(not inspect(page)['rightOpen'],'touch Workspace closes')
        touch.close()
        landscape=browser.new_context(viewport={'width':640,'height':320},is_mobile=True,has_touch=True,reduced_motion='reduce')
        page=landscape.new_page();inline_shell_browser(page,ROOT,None)
        check(abs(inspect(page)['mainWidth']-640)<2,'touch landscape reader fills width')
        check(inspect(page)['helpVisible'],'touch landscape shows tutorial help')
        check(inspect(page)['libraryOpenExists'],'touch landscape has History Open PDF')
        landscape.close();browser.close()

    report={'schema':1,'source':'real v362 application shell in isolated Chromium; PDF.js/Texify unavailable',
            'assertions':len(checks),'passed':sum(c['passed'] for c in checks),
            'failed':errors,'load_timings_s':timings,'checks':checks,
            'limitations':['No actual PDF.js document rendering or Texify inference',
                           'No P1 real-PDF IndexedDB navigation in this shell check']}
    print(json.dumps({k:report[k] for k in ('assertions','passed','failed','load_timings_s')},indent=2))
    if '--report' in sys.argv:
        ix=sys.argv.index('--report')
        Path(sys.argv[ix+1]).write_text(json.dumps(report,indent=2)+'\n')
    return 0 if not errors else 1

if __name__=='__main__':raise SystemExit(run())
