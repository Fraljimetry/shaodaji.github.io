#!/usr/bin/env python3
"""Real Chromium scroll-range test: targeted headings must land inside viewport.

Executes the production scroll-range reservation, alignment and navigation
functions against a browser-laid-out reader with genuine CSS scrolling. PDF
loading and heading extraction are deliberately not simulated as certified.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

root = Path(__file__).resolve().parents[1]
source = (root / 'js/30-rendering-navigation.js').read_text('utf8')

def section(start, end):
    left = source.index(start)
    right = source.index(end, left + len(start))
    return source[left:right]

js = '\n'.join([
    section('function navigationTargetLeadPx() {', '\n// Measure the *rendered* PDF page'),
    section('function alignReaderNavigationToSurface(', '\n// Page-local positions'),
    section('function ensureReaderPositionScrollRange(', '\n// A newer navigation'),
    section('async function goToLocation(', '\nfunction updateReadingBackButton()'),
])

html = '''<!doctype html><style>
*{box-sizing:border-box}
#reader{position:relative; width:760px; height:700px;overflow:auto;padding:22px;display:flex;align-items:flex-start;justify-content:center}
#page{position:relative;flex:0 0 auto;width:580px;height:640px;background:white}
#stack{display:none}
#reader.continuous-mode{display:block;padding:18px;overflow-y:scroll}
#reader.continuous-mode #page{display:none}
#reader.continuous-mode #stack{display:flex;flex-direction:column;align-items:center;gap:20px}
.frame{height:660px;position:relative;width:580px}
.surface{height:640px;width:580px;position:relative}
</style><div id="reader"><div id="page"></div><div id="stack"></div></div>'''

bootstrap = '''
const primaryCanvasWrap = document.getElementById('reader');
const primaryPageSurface = document.getElementById('page');
const continuousStack = document.getElementById('stack');
let readingFlow='single',currentPage=1,continuousGeneration=1,continuousSavedAnchor=null;
const pdfDoc={numPages:3}, currentFileKey='doc', scrollByPage={}, generalPrefs={recordReadingTrail:false};
let readerNavigationSerial=0,suppressReadingHistory=true,canvas=null;
const continuousPageNodes = new Map();
function hideSelectionToolbar(){} function updateNavigationState(){}
function persistDocumentState(){} function nextFrame(){return new Promise(r=>requestAnimationFrame(r));}
async function renderContinuousPage(){} async function buildContinuousDocument(){}
async function renderCurrentPage(){}
function canvasHasVisibleContent(){return true;}
for (let i=1;i<=3;i++){
  const frame=document.createElement('div');frame.className='frame';
  const surface=document.createElement('div');surface.className='surface';
  frame.append(surface);continuousStack.append(frame);
  continuousPageNodes.set(i,{frame,surface,rendered:true});
}
'''

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page(viewport={'width':1000,'height':900})
        page.set_content(html)
        page.add_script_tag(content=bootstrap+'\n'+js)
        # Previously no scroll range at all: with 640px page in a 700px reader,
        # a late heading at 75% was locked near the page top (scrollTop=0).
        before=page.evaluate('''()=>({range:primaryCanvasWrap.scrollHeight-primaryCanvasWrap.clientHeight,
            pageTop:primaryPageSurface.getBoundingClientRect().top,
            viewportTop:primaryCanvasWrap.getBoundingClientRect().top})''')
        assert before['range'] <= 5, before
        page.evaluate('goToLocation(1,.75,{recordHistory:false})')
        actual=page.evaluate('''()=>({scroll:primaryCanvasWrap.scrollTop,range:primaryCanvasWrap.scrollHeight-primaryCanvasWrap.clientHeight,
            displacement:primaryPageSurface.getBoundingClientRect().top+primaryPageSurface.getBoundingClientRect().height*.75
                -primaryCanvasWrap.getBoundingClientRect().top,
            lead:navigationTargetLeadPx()})''')
        assert actual['scroll']>200 and abs(actual['displacement']-actual['lead'])<2,actual
        page.evaluate('goToLocation(1,0,{recordHistory:false})')
        assert page.evaluate("primaryPageSurface.style.marginBottom === ''"), 'normal top navigation must clear tail'
        # A real continuous final page needs tail space too. Intermediate pages
        # already have later pages below them and must not retain extra space.
        page.evaluate("readingFlow='continuous';primaryCanvasWrap.classList.add('continuous-mode')")
        page.evaluate('goToLocation(3,.83,{recordHistory:false})')
        final=page.evaluate('''()=>({scroll:primaryCanvasWrap.scrollTop,range:primaryCanvasWrap.scrollHeight-primaryCanvasWrap.clientHeight,
          displacement:continuousPageNodes.get(3).surface.getBoundingClientRect().top+
            continuousPageNodes.get(3).surface.getBoundingClientRect().height*.83
             -primaryCanvasWrap.getBoundingClientRect().top,lead:navigationTargetLeadPx(),tail:continuousStack.style.paddingBottom})''')
        assert final['tail'] and abs(final['displacement']-final['lead'])<2,final
        page.evaluate('goToLocation(2,.25,{recordHistory:false})')
        assert page.evaluate("continuousStack.style.paddingBottom === ''"), 'middle page must clear final-page tail'
        print('PASS: browser-measured heading landing positions, single page and continuous final page')
    finally:
        browser.close()
