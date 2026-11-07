#!/usr/bin/env python3
"""Real Chromium parser regression against original-PDF-derived heading geometry.

Runs the exact production v412 Results classifier in Chromium. Source lines are
reconstructed from selected PDF native spans; no PDF.js or real-site render is
claimed. Uses no network and never changes PDF contents.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / 'js/41-equations-bibliography.js').read_text('utf-8')

def row(text, y, x0, x1, first_end, first_text):
    return {'text': text, 'ratio': y, 'xStartRatio': x0, 'xEndRatio': x1,
            'parts': [{'start': 0, 'end': len(first_text), 'xStartRatio': x0, 'xEndRatio': first_end}]}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page()
        page.set_content('<!doctype html><html><body><main id="reader"></main></body></html>')
        page.add_script_tag(content=SOURCE)
        def detect(lines, index=0, pageno=23):
            return page.evaluate('({lines,index,pageno})=>detectedStructureResult(lines,index,pageno)',
                                 {'lines':lines,'index':index,'pageno':pageno})
        checks = 0
        def eq(actual, expected, label):
            global checks
            assert actual == expected, f'{label}: got {actual!r}, expected {expected!r}'
            checks += 1
        h=row('THEOREM Let P k and let The a symmetric (k 2)-tensor on', .1733,.150,.881,.2404,'THEOREM')
        n=row('5.2. e M, ^ 0, +',.1701,.2404,.756,.2824,'5.2.')
        eq(detect([h,n])['label'], 'Theorem 5.2', 'printed theorem across baselines')
        eq(detect([h,n])['page'],23,'physical page preserved')
        eq(round(detect([h,n])['ratio'],4),.1701,'printed position preserved')
        eq(detect([h,{**n,'ratio':.20}]),None,'distant numeric token rejected')
        eq(detect([h,{**n,'xStartRatio':.71}]),None,'other-column token rejected')
        eq(detect([h]) ,None,'missing number is never invented')
        eq(detect([row('THEOREM5.1(CONFORMAL NORMAL COORDINATES).Let M be a manifold',.32,.15,.86,.25,'THEOREM5.1')])['label'], 'Theorem 5.1', 'joined uppercase declaration')
        superscript=[
          row('approach fails. Instead, note that ... for any q > 1, e > 0 by',.8513,.134,.885,.250,'approach'),
          row('T 1+e',.8588,.561,.607,.607,'T 1+e'),
          row('Lemma 9.1. If we set ft = ...',.868,.134,.886,.3,'Lemma 9.1.')
        ]
        eq(detect(superscript,2,40), None,'superscript does not disguise prior prose reference')
        eq(detect([row('THEOREM5.1 shows the claim',.32,.15,.86,.25,'THEOREM5.1')]),None,'narrative continuation rejected')
        print(f'PASS | Chromium Results geometry v412: {checks} assertions')
    finally:
        browser.close()
