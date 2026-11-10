#!/usr/bin/env python3
"""Chromium regression: Structure clicks preserve a heading's page-local Y.

Production PDF-outline resolver, Structure row renderers and click handlers are
used with deterministic PDF.js destination/text-line stubs. No OCR inference.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
outline = (root / 'js/40-outline-structure.js').read_text('utf8')
refs = (root / 'js/50-references-search.js').read_text('utf8')
nav = (root / 'js/30-rendering-navigation.js').read_text('utf8')

def chunk(src, start, end):
    a=src.index(start)
    b=src.index(end,a+len(start))
    return src[a:b]

bootstrap = '''
const el=id=>document.getElementById(id);
const t=en=>en;
const outlineList=el('outline-list'),outlineCount=el('outline-count'),outlineEmpty=el('outline-empty');
let outlineMode='embedded',inferredOutline=[],embeddedOutlineEntries=[],pendingOutlineReselectKey=null,currentFileKey='doc-1';
let readerNavigationSerial=0;
const pdfDoc={numPages:7,
  getPageIndex:async ref=>ref.num,
  getPage:async n=>({view:[0,0,600,800],getViewport:()=>({height:800,convertToViewportPoint:(x,y)=>[x,800-y]})}),
  getDestination:async name=>name==='named-section'?[{num:1},{name:'Fit'}]:null};
let navigation=null;
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
const linesByPage = {
  2:[{text:'In our next Section Details we prove a theorem',ratio:.15}, {text:'Section Details',ratio:.625}],
  3:[{text:'Unrelated passage',ratio:.45}],
};
async function pageTextLines(page){return linesByPage[page]||[];}
'''
source='\n'.join([
  chunk(refs,'async function resolveOutlineDestination(rawDest) {','\nfunction scheduleDetectedOutlineAugmentation()'),
  chunk(outline,'function comparableStructureNavigationText(value) {','\nfunction renderActiveOutline() {'),
  chunk(outline,'function renderEmbeddedOutline(entries) {','\nfunction renderInferredOutline(entries) {'),
  chunk(outline,'function renderInferredOutline(entries) {','\nfunction appendInferredOutlineRow(entry) {'),
  chunk(outline,'function appendInferredOutlineRow(entry) {',"\ndocument.addEventListener('click'"),
])
html='''<!doctype html><html><body><span id="outline-count"></span><div id="outline-empty"></div><div id="outline-list"></div></body></html>'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page()
        page.set_content(html)
        page.add_script_tag(content=bootstrap+'\n'+source)
        def click_entry(dest, title='Section Details', extra=None):
            page.evaluate('''async ({dest,title,extra})=>{
              const location=await resolveOutlineDestination(dest);
              renderEmbeddedOutline([{sourceKey:'bookmark',title,matchText:title,depth:0,...location,...extra}]);
              navigation=null;
            }''',{'dest':dest,'title':title,'extra':extra or {}})
            page.locator('button.outline-item').click()
            page.wait_for_timeout(80)
            return page.evaluate('navigation')
        # Fit bookmark promises page only. Resolve the heading from its real
        # page text, without mistaking earlier prose references for headings.
        target=click_entry([{'num':1},{'name':'Fit'}])
        assert target and target['page']==2 and abs(target['ratio']-.625)<.01, target
        # Explicit XYZ coordinates must win over text matching.
        target=click_entry([{'num':1},{'name':'XYZ'},0,500,0])
        assert target and abs(target['ratio']-.375)<.01,target
        # An XYZ null top is NOT PDF-coordinate zero and must not become the
        # bottom of the page; this is another page-only destination.
        target=click_entry([{'num':1},{'name':'XYZ'},0,None,0])
        assert target and abs(target['ratio']-.625)<.01,target
        # A missing heading match must keep the original page-only location,
        # not silently choose a nearby unrelated line.
        target=click_entry([{'num':2},{'name':'Fit'}],title='Nonexistent Heading')
        assert target and target['ratio']==0,target
        # Same title printed twice on a page is ambiguous: do not invent Y.
        page.evaluate("linesByPage[3]=[{text:'Duplicate Heading',ratio:.26},{text:'Duplicate Heading',ratio:.63}]")
        target=click_entry([{'num':2},{'name':'Fit'}],title='Duplicate Heading')
        assert target and target['ratio']==0,target
        # A rotated PDF's Y depends on the PDF-to-viewport transform, not
        # simply on yMax - top; respect the viewport's converted coordinate.
        rotated=page.evaluate('''async()=>{
          const saved=pdfDoc.getPage;
          pdfDoc.getPage=async()=>({view:[0,0,600,800],getViewport:()=>({height:600,convertToViewportPoint:(x,y)=>[y,x]})});
          const loc=await resolveOutlineDestination([{num:1},{name:'XYZ'},150,400,0]);
          pdfDoc.getPage=saved;
          return loc;
        }''')
        assert rotated['positionKnown'] and abs(rotated['ratio']-.25)<.01,rotated
        # Late heading-search results from a switched PDF must be discarded.
        page.evaluate('''()=>{
          window._oldPageLines=pageTextLines;
          pageTextLines=()=>new Promise(resolve=>{window._resolveLines=resolve});
          navigation=null;
          window._pendingStructure=navigateToStructureEntry({page:2,ratio:0,positionKnown:false,title:'Section Details'});
        }''')
        page.evaluate("currentFileKey='doc-2';_resolveLines([{text:'Section Details',ratio:.625}])")
        page.evaluate('window._pendingStructure')
        assert page.evaluate('navigation') is None
        page.evaluate("currentFileKey='doc-1';pageTextLines=window._oldPageLines")
        # A manually reselected embedded outline item already owns exact Y.
        target=click_entry([{'num':1},{'name':'Fit'}],extra={'userEdited':True,'ratio':.71})
        assert target and abs(target['ratio']-.71)<.01,target
        # A normal inferred/selected entry must retain its measured position.
        page.evaluate("renderInferredOutline([{title:'Detected heading',page:4,ratio:.53,userEdited:false,depth:0}])")
        page.locator('button.outline-item').click()
        page.wait_for_timeout(80)
        target=page.evaluate('navigation')
        assert target and target['page']==4 and abs(target['ratio']-.53)<.01,target
        # End-to-end position test: use the real navigation implementation
        # and actual scrollable Chromium page surfaces, not merely a stubbed
        # destination callback. Click a page-only Structure bookmark.
        real_nav = '\n'.join([
            chunk(nav, 'function alignReaderNavigationToSurface(', '\n// A newer navigation'),
            chunk(nav, 'async function goToLocation(', '\nfunction updateReadingBackButton()'),
        ])
        page.evaluate('''''''''() => {
          const wrap=document.createElement('div');wrap.id='reader';
          wrap.style.cssText='position:relative;height:420px;width:760px;overflow-y:scroll;padding:12px;';
          document.body.append(wrap);
          const nodes=new Map();
          for(let p=1;p<=7;p++){
            const frame=document.createElement('section');frame.style.cssText='height:810px;position:relative;';
            const surface=document.createElement('div');surface.style.cssText='height:800px;width:610px;position:relative;';
            frame.append(surface);wrap.append(frame);nodes.set(p,{frame,surface,rendered:true});
          }
          window._readerNodes=nodes;
        }''''''''' )
        page.add_script_tag(content='''''''''
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
        '''''''''  + real_nav)
        page.evaluate('''''''''()=>{
          goToMatchedLocation=async (page,ratio,query,options)=>{
            navigation={page,ratio,query,options};
            await goToLocation(page,ratio,{contextLead:false});
          };
        }''''''''' )
        page.evaluate('''''''''async()=>{
          const where=await resolveOutlineDestination([{num:1},{name:'Fit'}]);
          renderEmbeddedOutline([{sourceKey:'live',title:'Section Details',matchText:'Section Details',depth:0,...where}]);
        }''''''''' )
        page.locator('button.outline-item').click()
        page.wait_for_timeout(120)
        physical=page.evaluate('''''''''()=>{
          const wrap=document.getElementById('reader');
          const r=window._readerNodes.get(2).surface.getBoundingClientRect();
          const w=wrap.getBoundingClientRect();
          return {scrollTop:wrap.scrollTop,offset:r.top+r.height*.625-w.top,page:currentPage};
        }''''''''' )
        assert physical['scrollTop']>500 and physical['page']==2 and abs(physical['offset'])<3,physical
        print('PASS: real Chromium scroll reaches the Structure heading, not the page top')
        print('PASS: Chromium Structure click placement (page-only, explicit, null, unknown, manual and inferred)')
    finally:
        browser.close()
