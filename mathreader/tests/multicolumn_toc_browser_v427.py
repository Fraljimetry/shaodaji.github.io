#!/usr/bin/env python3
"""Chromium click/scroll integration using the production PDF.js-native text
line builder and TOC resolver with exported two-column PDF.js geometry.
No remote PDF, model, or CDN is used; scroll container is controlled.
"""
import json
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
fixture=json.loads((root/'regression/fixtures/structure_navigation_native_rows_v426.json').read_text('utf8'))
assert fixture['document_sha256']=='sha256:c1e71f0441ecb6401b085a653028921b38fa35aca5bd27726f370eb5d8153d20'
core=(root/'js/00-core.js').read_text('utf8')
detect=(root/'js/41-equations-bibliography.js').read_text('utf8')
outline=(root/'js/40-outline-structure.js').read_text('utf8')
reference=(root/'js/50-references-search.js').read_text('utf8')
def extract(s,a,b):
    start=s.index(a)
    return s[start:s.index(b,start+len(a))]
page_js='''
const sourcePages=__PAGES__;
const pdfDoc={numPages:12}, currentFileKey='stoc', lineCache=new Map(), textCache=new Map();
const manualIndexOcrPages=new Map(), documentOcrPages=new Map();
const sourceDocumentUsesOcr=()=>false;
async function nativePageTextData(_doc,page){const d=sourcePages[page];return {page:{view:d?.view||[0,0,612,792]},content:{items:d?.items||[]}};}
const t=(en,zh)=>en;
let inferredOutline=[],structureEntries=[],bibliographyEntries=[];
let lastDestination=null;
async function goToMatchedLocation(page,ratio){
  lastDestination={page,ratio};
  document.getElementById('reader').scrollTop=Math.round(ratio*1000);
}
function normalizedReferenceLabel(v){return String(v).toLowerCase().trim()}
function documentTextFeaturesAvailable(){return true}
''' .replace('__PAGES__',json.dumps(fixture['pages']))
assembly='\n'.join([page_js,extract(core,'function findFirstRowInYBuckets(', 'const nativePageTextCacheByDocument'),extract(detect,'async function pageTextLines(', '\n\nfunction bibliographyHeadingText('),extract(outline,'function comparableStructureNavigationText(value) {','\nfunction renderActiveOutline() {'),reference])
html='''<!doctype html><html><body><button id="sec3">Section 3</button><button id="sec21">Section 2.1</button><div id="reader" style="height:200px;width:300px;overflow-y:auto"><div style="height:1600px"></div></div></body></html>'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    try:
        page=browser.new_page()
        page.set_content(html)
        page.add_script_tag(content=assembly)
        page.evaluate('''() => {
          // Replace only the final navigation effect; the production TOC
          // resolver, native text-line builder and locator run unchanged.
          goToMatchedLocation=async (page,ratio)=>{
             lastDestination={page,ratio};
             document.getElementById('reader').scrollTop=Math.round(ratio*1000);
          };
          const bind=(id,title)=>document.getElementById(id).addEventListener('click',async()=>{
             const found=await resolveTocContentDestination({page:0,title},1);
             if(found) await goToMatchedLocation(found.page,found.ratio);
          });
          bind('sec3','3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices');
          bind('sec21','2.1 Principal Minor Equivalence');
        }''')
        for button,wanted_page,wanted_ratio in [('sec3',5,.4066),('sec21',4,.3206)]:
            page.locator('#'+button).click()
            page.wait_for_function('(page) => lastDestination?.page===page',arg=wanted_page,timeout=12000)
            got=page.evaluate('({destination:lastDestination,scroll:document.getElementById("reader").scrollTop})')
            assert abs(got['destination']['ratio']-wanted_ratio)<.005,got
            assert abs(got['scroll']-round(wanted_ratio*1000))<=1,got
        print('PASS: Chromium production TOC resolver and physical scroll, section 3 and 2.1')
    finally:browser.close()
