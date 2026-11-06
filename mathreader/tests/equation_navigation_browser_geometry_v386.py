#!/usr/bin/env python3
"""Actual Chromium layout test for long-document equation target placement.

This intentionally simulates page surfaces, NOT live PDF.js/Tesseract OCR.
The measured Giusti 17.11 ratio is from the original 1984 PDF.
"""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
nav=(root/'js/30-rendering-navigation.js').read_text()
css=(root/'mathreader.css').read_text()
core=(root/'js/00-core.js').read_text()
fn=re.search(r'function alignReaderNavigationToSurface\([\s\S]*?\n\}(?=\n)',nav)
assert fn, 'navigation alignment helper must exist'

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1360,'height':880})
    page.set_content(f'''<!doctype html><html><head><style>{css}</style><style>
    html,body{{height:100%;margin:0}}.reader-viewport{{height:880px}}#reader{{height:740px}}
    .continuous-page-frame{{width:900px}}
    </style></head><body><main class="reader-viewport"><div id="reader" class="canvas-wrap continuous-mode"><div class="continuous-stack" id="stack"></div></div></main></body></html>''')
    page.add_script_tag(content='''
    const primaryCanvasWrap=document.getElementById('reader');
    const continuousPageNodes=new Map();
    let readingFlow='continuous';let currentPage=1;let primaryPageSurface=null;
    for(let i=1;i<=253;i++){
      const frame=document.createElement('section');frame.className='continuous-page-frame';frame.dataset.page=String(i);
      const label=document.createElement('div');label.className='continuous-page-number';label.textContent=`Page ${i}`;
      const surface=document.createElement('div');surface.className='page-surface continuous-page-surface';
      surface.style.height=`${720+(i%7)*27}px`;surface.style.width='640px';
      frame.append(label,surface);document.getElementById('stack').append(frame);
      continuousPageNodes.set(i,{frame,surface});
    }
    '''+fn.group(0))
    # A true hOCR page-size mismatch creates exactly the reported affine drift:
    # an OCR glyph at y=1280/1600=.80 would previously land at 1280/2000=.64.
    hocr_funcs=[]
    for name in ['parseHocrBbox','parseHocrConfidence','pageRecordFromHocr']:
        match=re.search(r'function '+name+r'\([\s\S]*?\n\}(?=\n)',core)
        assert match, name
        hocr_funcs.append(match.group(0))
    page.add_script_tag(content='\n'.join(hocr_funcs))
    measured=page.evaluate("""()=>{
      const hocr=`<div class="ocr_page" title="bbox 0 0 1000 1600">
        <span class="ocr_line" title="bbox 100 1280 220 1310">
          <span class="ocrx_word" title="bbox 100 1280 220 1310; x_wconf 96">(17.11)</span>
        </span></div>`;
      const result=pageRecordFromHocr(hocr,'',1200,2000,222);
      return {ratio:result.lines[0].ratio,wordY:result.words[0].yStartRatio,
        partX:result.lines[0].parts[0].xStartRatio,canvasHeight:result.height};
    }""")
    assert abs(measured['ratio']-.80)<1e-6, measured
    assert abs(measured['wordY']-.80)<1e-6, measured
    assert abs(measured['partX']-.10)<1e-6, measured
    assert measured['canvasHeight']==2000,measured
    checks=4
    for page_no,ratio in [(2,.12),(28,.245),(220,.8),(222,1605/1844),(223,.2),(229,.66),(251,.9)]:
        result=page.evaluate('''([p,r])=>{
          const frame=continuousPageNodes.get(p).frame;
          const surface=continuousPageNodes.get(p).surface;
          // Simulate stale/estimated offsets while preserving the real layout.
          primaryCanvasWrap.scrollTop=Math.max(0,frame.offsetTop + surface.offsetHeight*r - 200);
          const before=primaryCanvasWrap.scrollTop;
          alignReaderNavigationToSurface(p,r,80);
          const rect=surface.getBoundingClientRect(),wrap=primaryCanvasWrap.getBoundingClientRect();
          return {page:p,ratio:r,before,scrollTop:primaryCanvasWrap.scrollTop,actual:rect.top+rect.height*r-wrap.top,
            valid:Math.abs(rect.top+rect.height*r-wrap.top-80)<2};
        }''',[page_no,ratio])
        assert result['valid'], f'inaccurate target after layout alignment: {result}'
        checks+=1
    # Browser zoom / changed page geometry should not reintroduce drift.
    page.evaluate('''()=>{for(const {surface} of continuousPageNodes.values())
      surface.style.height=`${Math.round(parseFloat(surface.style.height)*1.3)}px`;}''')
    for page_no,ratio in [(28,.85),(222,1605/1844),(230,.5)]:
        result=page.evaluate('''([p,r])=>{ const f=continuousPageNodes.get(p).frame;
          primaryCanvasWrap.scrollTop=Math.max(0,f.offsetTop + f.offsetHeight*r - 200);
          alignReaderNavigationToSurface(p,r,80);
          const rect=continuousPageNodes.get(p).surface.getBoundingClientRect();
          const wrap=primaryCanvasWrap.getBoundingClientRect();
          return {page:p,actual:rect.top+rect.height*r-wrap.top};}''',[page_no,ratio])
        assert abs(result['actual']-80)<2, f'zoomed page drift: {result}'
        checks+=1
    # Execute the real asynchronous goToLocation() body against the 253-page
    # DOM skeleton, not just the alignment helper, to detect regressions where
    # post-render state / frame correction overwrites the requested target.
    actual_nav=re.search(r'async function goToLocation\([\s\S]*?\n\}(?=\n)',nav)
    assert actual_nav, 'real navigation implementation must exist'
    page.add_script_tag(content='''
      const pdfDoc={numPages:253};
      let suppressReadingHistory=true;
      const generalPrefs={recordReadingTrail:true};
      let continuousGeneration=1;
      let continuousSavedAnchor=null;
      let readerNavigationSerial=0;
      const scrollByPage={};let canvas=null;
      const navigationTargetLeadPx=()=>80;
      function hideSelectionToolbar(){}
      function updateNavigationState(){}
      function persistDocumentState(){}
      async function renderContinuousPage(){return true;}
      async function buildContinuousDocument(){return;}
      function nextFrame(){return new Promise(resolve=>requestAnimationFrame(resolve));}
      async function renderCurrentPage(){return;}
    '''+actual_nav.group(0))
    for page_no,ratio in [(28,.245),(222,1605/1844),(229,.68)]:
        observed=page.evaluate("""async ([p,r])=>{
          await goToLocation(p,r,{contextLead:true});
          const rect=continuousPageNodes.get(p).surface.getBoundingClientRect();
          const wrap=primaryCanvasWrap.getBoundingClientRect();
          return {page:currentPage,target:rect.top+rect.height*r-wrap.top};
        }""",[page_no,ratio])
        assert observed['page']==page_no and abs(observed['target']-80)<2,observed
        checks+=1
    # Single-page reading uses the same normalized PDF coordinates but a
    # different scroll container layout; neither mode may gain vertical drift.
    page.evaluate("""()=>{
      readingFlow='single';currentPage=222;
      primaryCanvasWrap.classList.remove('continuous-mode');
      primaryCanvasWrap.replaceChildren();
      primaryPageSurface=document.createElement('div');
      primaryPageSurface.className='page-surface';
      primaryPageSurface.style.cssText='height:1300px;width:640px';
      primaryCanvasWrap.append(primaryPageSurface);
    }""")
    for ratio in [.50,.75]:
        observed=page.evaluate("""r=>{
          primaryCanvasWrap.scrollTop=240;
          alignReaderNavigationToSurface(222,r,80);
          const rect=primaryPageSurface.getBoundingClientRect();
          const wrap=primaryCanvasWrap.getBoundingClientRect();
          return rect.top+rect.height*r-wrap.top;
        }""",ratio)
        # Near the bottom of a single page, the container reaches its end;
        # the correct condition is that the target remains visible, not pinned
        # to the impossible 80px top anchor.
        assert (abs(observed-80)<2 if ratio<=.50 else 0<observed<700), ('single mode',ratio,observed)
        checks+=1
    print(f'PASS: {checks} Chromium equation landing / hOCR frame checks (simulated pages, real DOM geometry)')
    browser.close()
