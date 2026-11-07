#!/usr/bin/env python3
"""Chromium execution of production Results parser against original-PDF text.
Does not load or render PDF.js or run online site; native text lines from
Leon Simon PDE and Yamabe manuscript are original printed-page observations.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/'js/41-equations-bibliography.js').read_text('utf-8')
CASES=[
 ('Lemma 3. (Sobolev embedding theorem.)Ifk2{1; 2; : : : ;}and ifN>', 'Lemma 3',52),
 ('Lemma 4 (Rellich’s Theorem.)Suppose\u007fis bounded, andm\u00151. Then the', 'Lemma 4',53),
 ('Theorem 2 (Weyl.)For\u00152R, letN\u0015denote the number of eigenvalues','Theorem 2',122),
 ('Theorem 1 (Weak maximum principle.)Suppose\u007fis bounded and letu2','Theorem 1',152),
 ('Proposition 5.3(Asymptotic flatness of the Green blow-up).In the Green-function regimes of','Proposition 5.3',13),
 ('Corollary 6.3(Green constant equals one half the mass).Under the normalization','Corollary 6.3',14),
 ('Theorem 2.1(a) follows by induction.',None,3),
 ('Lemma 4.4 from the main obstruction.',None,1),
]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page()
        page.set_content('<!doctype html><html><body></body></html>')
        page.add_script_tag(content=SOURCE)
        checks=0
        for s,label,page_num in CASES:
            observed=page.evaluate('({s,p})=>detectedStructureResult([{text:s,ratio:.42,xStartRatio:.1,xEndRatio:.8}],0,p)',{'s':s,'p':page_num})
            actual=observed['label'] if observed else None
            assert actual==label,f'{s}: {actual!r} != {label!r}'
            checks+=1
            if observed:
                assert observed['page']==page_num
                checks+=1
        print(f'PASS | v413 real Chromium named-heading classifier: {checks} assertions')
    finally:
        browser.close()
