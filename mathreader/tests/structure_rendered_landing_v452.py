#!/usr/bin/env python3
"""Chromium regression: click-to-scroll must use rendered heading geometry.

The PDF page paint is represented by laid-out DOM spans so this is NOT a
certification of the PDF.js CDN/backend or production deployment.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

root = Path(__file__).resolve().parents[1]
outline = (root / 'js/40-outline-structure.js').read_text('utf8')
nav = (root / 'js/30-rendering-navigation.js').read_text('utf8')
def extract(source, start, end):
    a = source.index(start)
    return source[a:source.index(end, a + len(start))]
js = '\n'.join([
    extract(outline, 'function comparableStructureNavigationText(', '\n// PDF.js can merge'),
    extract(outline, 'function structureHeadingRowSegments(', '\nfunction structureHeadingRowFragments'),
    extract(outline, 'function compactStructureNavigationText(', '\nfunction structureHeadingMatchQuality'),
    extract(outline, 'function structureHeadingMatchQuality(', '\nfunction structureSameColumnContinuation'),
    extract(outline, 'function structureSameColumnContinuation(', '\nfunction uniqueStructureHeadingRatio'),
    extract(outline, 'function uniqueStructureHeadingRatio(', '\n// The existing typography detector'),
    extract(outline, 'function uniqueDetectedStructureHeadingRatio(', '\n// A heading\'s final'),
    extract(outline, 'function renderedStructureHeadingRatio(', '\nasync function alignStructureToRenderedHeading'),
    extract(outline, 'async function alignStructureToRenderedHeading(', '\nlet structureNavigationSerial'),
    extract(outline, 'let structureNavigationSerial = 0;', '\nfunction renderActiveOutline'),
    extract(nav, 'function navigationTargetLeadPx()', '\n// Measure the *rendered* PDF page'),
    extract(nav, 'function alignReaderNavigationToSurface(', '\n// Page-local positions'),
    extract(nav, 'function ensureReaderPositionScrollRange(', '\n// A newer navigation'),
])
html = '''<!doctype html><style>
#reader{width:750px;height:490px;position:relative;overflow:auto;padding:16px;display:flex;align-items:flex-start;justify-content:center;box-sizing:border-box}
#page{position:relative;width:560px;height:790px;flex:0 0 auto;background:white}
#text{position:absolute;inset:0}
#text span{position:absolute;white-space:nowrap;font-size:16px}
</style><div id="reader"><div id="page"><div id="text"></div></div></div>'''
bootstrap = '''
const primaryCanvasWrap = document.getElementById('reader');
const primaryPageSurface = document.getElementById('page');
const primaryTextLayer = document.getElementById('text');
const continuousStack = document.createElement('div');
const continuousPageNodes = new Map();
let readingFlow = 'single',currentPage=3,readerNavigationSerial=0,currentFileKey='fixture',inferredOutline=[];
const pdfDoc={numPages:19}; const scrollByPage={};
function nextFrame(){return new Promise(resolve=>requestAnimationFrame(resolve));}
function persistDocumentState(){};
function showNavigationLandingCue(){};
async function pageTextLines(){return [];} // Deliberately unavailable prepaint geometry
async function goToMatchedLocation(page,ratio){readerNavigationSerial++;primaryCanvasWrap.scrollTop=0;}
const headings=[
['What are we trying to prove?',70],
['Preliminaries and the proof roadmap',250],
['Norms and three basic inequalities',350],
['Foundational facts we use',640]];
for(const [label,y] of headings){const span=document.createElement('span');span.textContent=label;
span.style.top=y+'px';span.style.left='30px';primaryTextLayer.append(span);}
'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page(viewport={'width':1000,'height':900})
        page.set_content(html)
        page.add_script_tag(content=bootstrap+'\n'+js)
        observed=[]
        for title, expected_y in [('What are we trying to prove?',70),('Preliminaries and the proof roadmap',250),('Norms and three basic inequalities',350),('Foundational facts we use',640)]:
            # Every PDF bookmark has the same near-top position. A real click must override it.
            page.evaluate('async title => await navigateToStructureEntry({page:3,ratio:.045,positionKnown:true,coarseDestination:true,title})', title)
            found=page.evaluate('''title=>{const span=[...primaryTextLayer.children].find(s=>s.textContent===title);
              const wr=primaryCanvasWrap.getBoundingClientRect();return {screen:span.getBoundingClientRect().top-wr.top,
               scroll:primaryCanvasWrap.scrollTop};}''',title)
            assert abs(found['screen']-72)<2, (title,found)
            observed.append(round(found['scroll']))
        assert len(set(observed))==4, observed
        # An explicit manually positioned item must not be overridden.
        page.evaluate('async()=>await navigateToStructureEntry({page:3,ratio:.045,positionKnown:true,userEdited:true,title:"Foundational facts we use"})')
        assert page.evaluate('primaryCanvasWrap.scrollTop')==0
        print('PASS: four different rendered headings land at context offset despite identical bookmark coordinates; manual destination preserved', observed)
    finally:
        browser.close()
