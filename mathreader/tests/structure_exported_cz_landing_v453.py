#!/usr/bin/env python3
"""Browser layout acceptance using heading anchors from the user's actual CZ export.

No PDF.js worker is bundled: this covers production click/navigation and browser
scroll geometry, not live PDF.js image decoding or deployed-site verification.
"""
import json
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
nav = (root / 'js/30-rendering-navigation.js').read_text('utf8')
outline = (root / 'js/40-outline-structure.js').read_text('utf8')
refs = (root / 'js/50-references-search.js').read_text('utf8')
fixture = root / 'regression/fixtures/structure_cz_exported_headings_v453.json'
export = json.loads(fixture.read_text('utf8'))
headings = export['headings']
assert len(headings) >= 20
# The actual document's page 3 alone contains four distinct heading anchors.
assert len({round(x['ratio'], 4) for x in headings if x['page'] == 3}) >= 4


def part(source, start, end):
    a = source.index(start)
    return source[a:source.index(end, a + len(start))]

code = '\n'.join([
    part(outline, 'function comparableStructureNavigationText(', '\nfunction renderActiveOutline()'),
    part(nav, 'let activeReaderLanding = null;', '\nasync function renderPage('),
    part(nav, 'function navigationTargetLeadPx()', '\n// Measure the *rendered* PDF page'),
    part(nav, 'function alignReaderNavigationToSurface(', '\n// Page-local positions'),
    part(nav, 'function ensureReaderPositionScrollRange(', '\n// A newer navigation'),
    part(nav, 'async function goToLocation(', '\nfunction updateReadingBackButton()'),
    part(refs, 'async function goToMatchedLocation(', '\nfunction searchMatchRangeInLayer('),
])
html = '''<!doctype html><style>
*{box-sizing:border-box}
#reader{height:520px;width:740px;overflow-y:auto;padding:18px;position:relative;display:block;scroll-behavior:auto;overflow-anchor:none}
#stack{display:flex;flex-direction:column;gap:24px;align-items:center}
.frame{position:relative;flex:0 0 auto;width:640px;height:826px;}
.surface{position:relative;width:612px;height:792px;background:#fff}
#page{display:none}
#reader.single{display:flex;align-items:flex-start;justify-content:center}
#reader.single #stack{display:none}
#reader.single #page{display:block;width:612px;height:792px;flex:0 0 auto}
</style><div id="reader"><div id="page"></div><div id="stack"></div></div>'''
bootstrap = '''
let currentPage=1, readingFlow='continuous', readerNavigationSerial=0, currentFileKey='CZ', suppressReadingHistory=true;
const primaryCanvasWrap=document.getElementById('reader');
const primaryPageSurface=document.getElementById('page');
const continuousStack=document.getElementById('stack');
const continuousPageNodes=new Map();
const scrollByPage={}, generalPrefs={recordReadingTrail:false};
const pdfDoc={numPages:19};
let continuousGeneration=1,continuousSavedAnchor=null, canvas=null, inferredOutline=[];
const primaryTextLayer=document.createElement('div');
function persistDocumentState(){}function hideSelectionToolbar(){}function updateNavigationState(){}
function showNavigationLandingCue(){}function nextFrame(){return new Promise(r=>requestAnimationFrame(r));}
function updateBacklinksForTarget(){}function renderReadingTrail(){}
async function renderCurrentPage(){}
async function renderContinuousPage(){return true;}
async function buildContinuousDocument(){}
async function pageTextLines(){return [];}
function renderedStructureHeadingRatio(){return null;}
function uniqueStructureHeadingRatio(){return null;}
for(let n=1;n<=19;n++){
  const frame=document.createElement('div');frame.className='frame';
  const surface=document.createElement('div');surface.className='surface';
  frame.append(surface);continuousStack.append(frame);
  continuousPageNodes.set(n,{frame,surface,rendered:true});
}
'''
# The extracted production functions run against real browser layout; PDF.js
# rendering itself is not part of this regression.
bootstrap = bootstrap.replace('function renderedStructureHeadingRatio(){return null;}\n', '')
bootstrap = bootstrap.replace('function uniqueStructureHeadingRatio(){return null;}\n', '')

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width':1100,'height':900})
        page.set_content(html)
        page.add_script_tag(content=bootstrap + '\n' + code)
        page.evaluate('rows => { inferredOutline = rows; }', headings)
        tested = 0
        for flow in ('continuous', 'single'):
            page.evaluate('''flow => {
               readingFlow=flow;primaryCanvasWrap.classList.toggle('single',flow==='single');
               primaryCanvasWrap.scrollTop=0;currentPage=1;invalidateReaderLanding();
            }''', flow)
            items = [h for h in headings if h['page'] in (3,4,5,8,10,11,17,18)]
            for entry in items:
                target={'page':entry['page'], 'ratio':0.045, 'positionKnown':True,
                        'coarseDestination':True, 'title':entry['title'].split(' ',1)[-1]}
                # Use the original printed title without its hierarchical prefix
                # as an embedded-bookmark title, exactly as in the supplied PDF.
                page.evaluate('async entry => await navigateToStructureEntry(entry)', target)
                result=page.evaluate('''target=>{
                    const wrap=primaryCanvasWrap.getBoundingClientRect();
                    const surface=readingFlow==='continuous'?continuousPageNodes.get(target.page).surface:primaryPageSurface;
                    const box=surface.getBoundingClientRect();
                    const lead=navigationTargetLeadPx();
                    return {delta:box.top+box.height*target.ratio-wrap.top-lead,
                        scroll:primaryCanvasWrap.scrollTop,page:currentPage,landing:activeReaderLanding?.ratio};
                }''',entry)
                assert result['page']==entry['page'], (flow,entry['title'],result)
                assert abs(result['delta'])<3, (flow,entry['title'],result)
                assert abs(result['landing']-entry['ratio'])<.0001, (flow,entry['title'],result)
                tested+=1
        assert tested>=30,tested
        print(f'PASS: {tested} Structure clicks use original exported coordinates and measured browser layout across both reading modes')
    finally:
        browser.close()
