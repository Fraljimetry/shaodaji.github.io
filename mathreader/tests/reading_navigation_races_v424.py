#!/usr/bin/env python3
"""Real Chromium + production reading jump/search handlers with controlled awaits.

Reproduce stale semantic alignment and stale searches, without CDN or OCR.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
source = (root / 'js/50-references-search.js').read_text('utf-8')
notes = (root / 'js/60-notes-bookmarks-data.js').read_text('utf-8')
core = (root / 'js/00-core.js').read_text('utf-8')

def extract(begin, end, text=None):
    text = source if text is None else text
    i = text.index(begin)
    return text[i:text.index(end, i + len(begin))]

reference_src = extract('let referenceNavigationRequestSerial = 0;', '\nasync function resolveOutlineDestination(')
position_src = extract('async function positionTargetAtReadingLead(', '\nfunction showNavigationLandingCue(', notes)
bookmark_src = extract('function equationBookmarkRatio(', '\nfunction renderBookmarks(', notes)
clear_map_src = extract('function clearDocumentMapForIncomingPdf()', '\nfunction activePanelId()', core)
navigation_src = extract('async function emphasizeSemanticDestination(page, ratio, query, stillCurrent = () => true)', '\nfunction searchMatchRangeInLayer(')
search_jump_src = extract('async function goToSearchMatch(match, query) {', '\n// Search runs may outlive')
search_src = extract('let readingSearchSerial = 0;', '\nfunction ') if '\nfunction ' in source[source.index('async function searchPdf(query) {'):] else source[source.index('let readingSearchSerial = 0;'):]

# The search function is the final function in this module in the current version.
html = '''<!doctype html><html><head><style>
#reader{width:600px;height:420px;overflow-y:auto;position:relative}
#surface{height:1900px;position:relative}
#text-layer{position:absolute;inset:0}
#text-layer span{position:absolute;left:20px;top:1450px;font:18px Arial}
</style></head><body>
<div id="reader"><div id="surface"><div id="text-layer"><span>Destination alpha</span></div></div></div>
<div id="search-status"></div><div id="search-results"></div></body></html>'''
bootstrap = '''
const primaryCanvasWrap=document.getElementById('reader');
const primaryPageSurface=document.getElementById('surface');
const primaryTextLayer=document.getElementById('text-layer');
const searchStatus=document.getElementById('search-status');
const searchResults=document.getElementById('search-results');
let pdfDoc={numPages:1},currentFileKey='document-one',currentPage=1;
let readingFlow='single',readerNavigationSerial=0,continuousGeneration=1,continuousSavedAnchor=null;
const continuousPageNodes=new Map();
const searchEquations={checked:false},searchFuzzy={checked:false},searchMatchCase={checked:false};
let record=[];
const t=(en,zh)=>en;
function documentTextFeaturesAvailable(){return true}
function exactSearchMatches(text,q){let i=text.indexOf(q);return i<0?[]:[{index:i,score:1}]}
function fuzzySearchMatches(text,q){return exactSearchMatches(text,q)}
function highlightedSnippet(text,q,i){return document.createTextNode(text)}
function equationSearchMatches(){return []}
async function pageText(page){if(window._delayedText) return await window._delayedText(page);return 'alpha beta'}
function semanticMatchRangeInLayer(layer,surface,query,ratio){let r=document.createRange();r.selectNodeContents(layer.querySelector('span'));return r}
function nearestTextRangeAtRatio(){return null}
function searchMatchRangeInLayer(layer,query,ordinal){return semanticMatchRangeInLayer(layer,primaryPageSurface,query,0)}
function emphasizeSearchRange(){ record.push('emphasis'); }
function showNavigationLandingCue(page,ratio){record.push('cue:'+page)}
function persistDocumentState(){}
function captureContinuousAnchor(){return null}
async function renderContinuousPage(){return true}
function showError(){}
function updateBacklinksForTarget(){record.push('backlink')}
function isEquationLabelQuery(){return true}
function normalizeEquationLatexForSearch(x){return String(x||'')}
let currentOcrResult=null,ocrHistory=[];
let structureIndexBuildToken=0,nativePdfCommentLoadToken=0;
let structureCount=null,bibliographyCount=null,equationIndexCount=null,backlinksCount=null;
function resetEquationDetectionProgress(){}
function showEquationBookmarkCue(page,ratio){record.push('bookmark-cue:'+page)}
async function resolveReferenceTarget(q){ if(window._refPromise) return window._refPromise(q);return {page:1,ratio:.25,matchText:q}; }
function goToLocation(page,ratio,opts={}){readerNavigationSerial++;currentPage=page;primaryCanvasWrap.scrollTop=page===1?310:730;return Promise.resolve()}
const _realRaf=requestAnimationFrame.bind(window);
window._heldFrames=[];
function requestAnimationFrame(cb){window._heldFrames.push(cb); return window._heldFrames.length;}
function releaseFrames(){ const pending=window._heldFrames.splice(0); for(const cb of pending)cb(performance.now()); }
'''

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
    try:
        page = browser.new_page()
        page.set_content(html)
        page.add_script_tag(content=bootstrap+'\n'+position_src+'\n'+bookmark_src+'\n'+navigation_src+'\n'+search_jump_src+'\n'+search_src+'\n'+reference_src+'\n'+clear_map_src)
        # An older Results/Structure/ref jump is delayed inside semantic alignment.
        page.evaluate("() => {window._first=goToMatchedLocation(1,.78,'Destination alpha');}")
        page.wait_for_function('window._heldFrames.length>=1', polling=50)
        page.evaluate('goToLocation(2,.5)')
        page.evaluate('releaseFrames()')
        page.evaluate('window._first')
        result = page.evaluate('({top:primaryCanvasWrap.scrollTop,serial:readerNavigationSerial,record})')
        assert result['top']==730, f'Stale semantic alignment moved newer reading position: {result}'
        print('PASS: stale Results/Structure semantic alignment does not override a newer jump')

        # A clicked search match can likewise have a pending animation frame.
        page.evaluate('() => {window._first=goToSearchMatch({page:1,text:"alpha",index:0,ordinal:0},"alpha");}')
        page.wait_for_function('window._heldFrames.length>=1', polling=50)
        page.evaluate('goToLocation(2,.6)')
        page.evaluate('releaseFrames()')
        page.evaluate('window._first')
        result = page.evaluate('({top:primaryCanvasWrap.scrollTop,record})')
        assert result['top']==730, f'Stale search-match alignment moved newer reading position: {result}'
        print('PASS: stale search-result alignment does not override a newer jump')

        # While an old text search is pending, a later search replaces it.
        page.evaluate('''() => {
          window._pendingText=null;
          window._delayedText=()=>new Promise(resolve=>{window._pendingText=resolve});
          window._oldSearch=searchPdf('alpha');
        }''')
        page.wait_for_function('typeof window._pendingText === "function"', polling=50)
        page.evaluate("window._delayedText=async()=> 'beta';window._newSearch=searchPdf('beta')")
        page.evaluate('window._newSearch')
        page.evaluate("window._pendingText('alpha')")
        page.evaluate('window._oldSearch')
        result = page.evaluate('({status:searchStatus.textContent,rows:[...searchResults.children].map(x=>x.textContent)})')
        assert result['rows'] and all('beta' in x for x in result['rows']), f'Old search replaced newer results: {result}'
        print('PASS: latest text search wins when earlier PDF text resolves late')

        # A document switch invalidates a pending search completely.
        page.evaluate('''() => {
          window._delayedText=()=>new Promise(resolve=>{window._pendingText=resolve});
          window._oldSearch=searchPdf('alpha');
        }''')
        page.wait_for_function('typeof window._pendingText === "function"', polling=50)
        page.evaluate('''() => {
          pdfDoc={numPages:1};currentFileKey='document-two';
          searchResults.replaceChildren();searchStatus.textContent='new document';
          window._pendingText('alpha');
        }''')
        page.evaluate('window._oldSearch')
        result=page.evaluate('({status:searchStatus.textContent,rows:searchResults.children.length})')
        assert result=={'status':'new document','rows':0},f'Old document search contaminated new PDF: {result}'
        print('PASS: document switches invalidate the old search session')

        # An equation bookmark has a second, animation-frame positioning pass.
        page.evaluate("() => {window._bookmark=goToEquationBookmark({page:1,ratio:.75})}")
        page.wait_for_function('window._heldFrames.length>=1',polling=50)
        page.evaluate('goToLocation(2,.5)')
        page.evaluate('releaseFrames()')
        page.evaluate('window._bookmark')
        result=page.evaluate('({top:primaryCanvasWrap.scrollTop,record})')
        assert result['top']==730, f'Old equation bookmark scroll overrode newer jump: {result}'
        print('PASS: old equation bookmark alignment canceled after newer jump')

        # Equivalent race for equations found via the search panel.
        page.evaluate("() => {searchEquations.checked=true; equationSearchMatches=()=>[{page:1,ratio:.75,source:'OCR',latex:'x^2'}]}")
        page.evaluate("searchPdf('x')")
        page.evaluate("searchResults.querySelector('button').click()")
        page.wait_for_function('window._heldFrames.length>=1',polling=50)
        page.evaluate('goToLocation(2,.4)')
        page.evaluate('releaseFrames()')
        page.wait_for_timeout(25)
        result=page.evaluate('({top:primaryCanvasWrap.scrollTop,record})')
        assert result['top']==730, f'Old equation search scroll overrode newer jump: {result}'
        print('PASS: old equation-search alignment canceled after newer jump')
        page.evaluate('searchEquations.checked=false')

        # An old reference lookup must not navigate after document switch.
        page.evaluate("() => {window._refPromise=()=>new Promise(resolve=>{window._resolveReference=resolve});window._reference=goToReferenceQuery('Theorem 3')}")
        page.wait_for_function('typeof window._resolveReference === "function"',polling=50)
        page.evaluate("() => {pdfDoc={numPages:1};currentFileKey='document-three';goToLocation(2,.25);window._resolveReference({page:1,ratio:.55,matchText:'Theorem 3'})}")
        page.evaluate('window._reference')
        result=page.evaluate('({page:currentPage,top:primaryCanvasWrap.scrollTop})')
        assert result['page']==2 and result['top']==730, f'Old reference lookup navigated after document switch: {result}'
        print('PASS: old reference lookup discarded after document switch')

        # Active, uninterrupted jumps still have correct alignment and cues.
        page.evaluate("() => {window._bookmark=goToEquationBookmark({page:1,ratio:.70})}")
        page.wait_for_function('window._heldFrames.length>=1',polling=50)
        page.evaluate('releaseFrames()')
        page.evaluate('window._bookmark')
        result=page.evaluate('({top:primaryCanvasWrap.scrollTop,record})')
        assert result['top']>900 and 'bookmark-cue:1' in result['record'], f'Active bookmark jump failed: {result}'
        print('PASS: active equation bookmark still aligns and renders its landing cue')


        # Switching PDF must clear stale search rows just as it clears stale
        # Structure/Results/Equation/Bibliography rows. This uses the production
        # document-map reset function, not a mock of its behavior.
        page.evaluate("() => {searchResults.textContent='Old PDF search results';searchStatus.textContent='3 occurrences';clearDocumentMapForIncomingPdf()}")
        result=page.evaluate('({rows:searchResults.textContent,status:searchStatus.textContent})')
        assert result=={'rows':'','status':''}, f'Old PDF search UI remained visible after a switch: {result}'
        print('PASS: switching PDFs clears stale visible text-search rows and status')
    finally:
        browser.close()
