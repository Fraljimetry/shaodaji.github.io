#!/usr/bin/env python3
"""Production renderPage + goToLocation: repeated PDF.js-style paints cannot erase landing."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
nav=(root/'js/30-rendering-navigation.js').read_text('utf8')
def part(start,end):
    a=nav.index(start)
    return nav[a:nav.index(end,a+len(start))]
code='\n'.join([
    part('let activeReaderLanding = null;', '\nfunction clearContinuousObserver()'),
    part('function navigationTargetLeadPx()', '\n// Measure the *rendered* PDF page'),
    part('function alignReaderNavigationToSurface(', '\n// Page-local positions'),
    part('function ensureReaderPositionScrollRange(', '\n// A newer navigation'),
    part('async function goToLocation(', '\nfunction updateReadingBackButton()'),
])
html='''<!doctype html><style>
*{box-sizing:border-box}#reader{width:750px;height:470px;position:relative;overflow-y:auto;padding:18px;display:flex;align-items:flex-start;justify-content:center;overflow-anchor:none}
#page{position:relative;width:612px;height:792px;flex:0 0 auto;background:white}
canvas{display:block}
</style><div id="reader"><div id="page"><canvas id="canvas"></canvas><div id="text"></div></div></div>'''
bootstrap='''
const primaryCanvasWrap=document.getElementById('reader');
const primaryPageSurface=document.getElementById('page');
const primaryTextLayer=document.getElementById('text');
const canvas=document.getElementById('canvas');
const continuousStack=document.createElement('div');
const continuousPageNodes=new Map();
const scrollByPage={'3':{top:0,left:0}},referenceScrollByPage={};
const generalPrefs={recordReadingTrail:false};
let currentPage=3, readingFlow='single', readerNavigationSerial=0, currentFileKey='DOC';
let zoomScale=1, zoomMode='custom', primaryRenderTask=null,referenceRenderTask=null;
let suppressReadingHistory=true, continuousSavedAnchor=null;
const referenceTextLayer=null,referencePageSurface=null,referenceOcrLayer=null;
const primaryOcrLayer={dataset:{}};
const pdfDoc={numPages:19,getPage:async () => ({
  getViewport:({scale})=>({width:612*scale,height:792*scale}),
  render:()=>({promise:Promise.resolve(),cancel:()=>{}})
})};
function pageScale(){return zoomScale;}
function applySinglePageHorizontalOverflow(){}
async function renderSelectableText(){}
function renderAnnotationsForPage(){}
function persistDocumentState(){}
function hideSelectionToolbar(){}
function updateNavigationState(){}
function nextFrame(){return new Promise(r=>requestAnimationFrame(r));}
async function renderCurrentPage(){await renderPage(currentPage,canvas,primaryCanvasWrap,'primary');}
'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page(viewport={'width':1050,'height':900})
        page.set_content(html)
        page.add_script_tag(content=bootstrap+'\n'+code)
        for ratio in (.562155303,.794877525):
            page.evaluate('async ratio => await goToLocation(3,ratio,{recordHistory:false})',ratio)
            for zoom in (1,1.3,.8,1.8,1):
                page.evaluate('async zoom => {zoomScale=zoom;scrollByPage["3"]={top:0,left:0};await renderPage(3,canvas,primaryCanvasWrap,"primary")}',zoom)
                page.wait_for_timeout(50)
                state=page.evaluate('''ratio=>{
                  const a=primaryCanvasWrap.getBoundingClientRect(), b=primaryPageSurface.getBoundingClientRect();
                  return {error:b.top+b.height*ratio-a.top-navigationTargetLeadPx(),scroll:primaryCanvasWrap.scrollTop};
                }''',ratio)
                assert abs(state['error'])<2,(ratio,zoom,state)
        # An explicit user scroll supersedes an earlier semantic jump.
        page.evaluate('''async()=>{invalidateReaderLanding();scrollByPage['3']={top:138,left:0};await renderPage(3,canvas,primaryCanvasWrap,'primary');}''')
        assert abs(page.evaluate('primaryCanvasWrap.scrollTop')-138)<2
        print('PASS: 10 production renderPage reflows preserve heading position across zoom; manual scroll supersedes navigation')
    finally:
        browser.close()
