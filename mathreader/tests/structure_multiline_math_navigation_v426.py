#!/usr/bin/env python3
"""Chromium physical scroll using production PDF.js text rows from PMESTOC25.

The source fixture is a selection of the original fullDocumentText nativePdf.items,
not hand-authored heading text. Page-only embedded bookmarks must land at the
measured position after both the text-matcher and actual browser scroll code.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
outline = (root / 'js/40-outline-structure.js').read_text('utf8')
refs = (root / 'js/50-references-search.js').read_text('utf8')
nav = (root / 'js/30-rendering-navigation.js').read_text('utf8')
core = (root / 'js/00-core.js').read_text('utf8')
detector = (root / 'js/41-equations-bibliography.js').read_text('utf8')
fixture = (root / 'regression/fixtures/structure_navigation_native_rows_v426.json').read_text('utf8')

def chunk(src, start, end):
    a = src.index(start)
    b = src.index(end, a + len(start))
    return src[a:b]

bootstrap = '''
const el=id=>document.getElementById(id);
const t=en=>en;
const outlineList=el('outline-list'),outlineCount=el('outline-count'),outlineEmpty=el('outline-empty');
let outlineMode='embedded',inferredOutline=[],embeddedOutlineEntries=[],pendingOutlineReselectKey=null,currentFileKey='doc-1';
let readerNavigationSerial=0;
const pdfDoc={numPages:12, getPageIndex:async ref=>ref.num,
  getPage:async n=>({view:[0,0,612,792],getViewport:()=>({height:792,convertToViewportPoint:(x,y)=>[x,792-y]})})};
let navigation=null;
const lineCache=new Map(),textCache=new Map(),manualIndexOcrPages=new Map(),documentOcrPages=new Map();
function sourceDocumentUsesOcr(){return false;}
async function nativePageTextData(doc,page){
 const native=window.fixture.pages[String(page)];
 return {page:{view:native.view},content:{items:native.items}};
}
function applyEmbeddedOutlineEdits(entries){return entries;}
function interleaveEmbeddedAndManualOutline(entries){return entries;}
function updateOutlineSource(){}
function applyDocumentMapFilter(){}
function updateDocumentMapCurrentLocation(){}
function setDocumentMapSelectedNode(){}
function positionOutlineEditActions(){}
function rerenderReferenceLinksAfterStructureEdit(){}
function refreshSelectionUI(){}
function persistDocumentState(){}
function pushUndo(){}
async function goToMatchedLocation(page,ratio,query='',options={}){navigation={page,ratio,query,options};}
'''

source = '\n'.join([
    chunk(core,'function findFirstRowInYBuckets(', 'const nativePageTextCacheByDocument'),
    chunk(detector,'async function pageTextLines(', '\n\nfunction bibliographyHeadingText('),
    chunk(refs,'async function resolveOutlineDestination(rawDest) {', '\nfunction scheduleDetectedOutlineAugmentation()'),
    chunk(outline,'function comparableStructureNavigationText(value) {','\nfunction renderActiveOutline() {'),
    chunk(outline,'function renderEmbeddedOutline(entries) {','\nfunction renderInferredOutline(entries) {'),
    chunk(outline,'function renderInferredOutline(entries) {','\nfunction appendInferredOutlineRow(entry) {'),
    chunk(outline,'function appendInferredOutlineRow(entry) {',"\ndocument.addEventListener('click'"),
])
real_nav = '\n'.join([
    chunk(nav, 'function alignReaderNavigationToSurface(', '\n// A newer navigation'),
    chunk(nav, 'async function goToLocation(', '\nfunction updateReadingBackButton()'),
])

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    try:
        page = browser.new_page(viewport={'width': 980, 'height': 720})
        page.set_content('<!doctype html><html><body><span id="outline-count"></span><div id="outline-empty"></div><div id="outline-list"></div></body></html>')
        page.evaluate('raw=>{window.fixture=JSON.parse(raw)}', fixture)
        page.add_script_tag(content=bootstrap + '\n' + source)
        page.evaluate('''() => {
          const wrap=document.createElement('div');wrap.id='reader';
          wrap.style.cssText='position:relative;height:400px;width:790px;overflow-y:scroll;padding:12px;';
          document.body.append(wrap);
          const nodes=new Map();
          for(let p=1;p<=12;p++){
            const frame=document.createElement('section');frame.style.cssText='height:810px;position:relative;';
            const surface=document.createElement('div');surface.style.cssText='height:800px;width:610px;position:relative;';
            frame.append(surface);wrap.append(frame);nodes.set(p,{frame,surface,rendered:true});
          }
          window._readerNodes=nodes;
        }''')
        page.add_script_tag(content='''
          const primaryCanvasWrap=document.getElementById('reader');
          let readingFlow='continuous',currentPage=1,continuousGeneration=1,continuousSavedAnchor=null;
          let primaryPageSurface=null,canvas=null,suppressReadingHistory=true;
          const continuousPageNodes=window._readerNodes,scrollByPage={},generalPrefs={recordReadingTrail:false};
          function hideSelectionToolbar(){} function updateNavigationState(){}
          function persistDocumentState(){} function nextFrame(){return new Promise(r=>requestAnimationFrame(r));}
          async function renderContinuousPage(){return true;}
          async function buildContinuousDocument(){}
          async function renderCurrentPage(){}
          function navigationTargetLeadPx(){return 80;}
        ''' + real_nav)
        page.evaluate('''()=>{
          goToMatchedLocation=async (page,ratio,query,options)=>{
            navigation={page,ratio,query,options};
            await goToLocation(page,ratio,{contextLead:false});
          };
        }''')
        # All four are genuine headings, not merely expected ratios from a stub.
        for pg,name,expected in [
            (4,'2.1 Principal Minor Equivalence', .320612),
            (5,'2.5 Cut-Transpose Operation', .224429),
            (5,'3 Characterization of Prinicipal Minor Equivalence for Irreducible Matrices', .406597),
            (11,'5.1 A0=B0=0', .4963),
        ]:
            page.evaluate('''async ({pg,name})=>{
              const where=await resolveOutlineDestination([{num:pg-1},{name:'Fit'}]);
              renderEmbeddedOutline([{sourceKey:'live',title:name,matchText:name,depth:0,...where}]);
              navigation=null;
            }''',{'pg':pg,'name':name})
            page.locator('button.outline-item').click()
            page.wait_for_timeout(120)
            target=page.evaluate('''({pg,expected})=>{
              const wrap=document.getElementById('reader');
              const r=window._readerNodes.get(pg).surface.getBoundingClientRect();
              const w=wrap.getBoundingClientRect();
              return {navigation,scrollTop:wrap.scrollTop,offset:r.top+r.height*expected-w.top,page:currentPage};
            }''',{'pg':pg,'expected':expected})
            assert target['navigation'] and target['navigation']['page']==pg, (name,target)
            assert abs(target['navigation']['ratio']-expected)<.003, (name,target)
            assert target['page']==pg and abs(target['offset'])<3, (name,target)
        print('PASS: v426 real native PDF text + embedded Structure clicks + physical Chromium scroll for 2.1, 2.5, 3, 5.1')
    finally:
        browser.close()
