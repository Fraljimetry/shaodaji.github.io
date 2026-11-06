#!/usr/bin/env python3
"""Chromium DOMParser and canvas geometry regression, no external model downloads.
This is NOT a Texify/real PDF.js engine acceptance test.
"""
from pathlib import Path
import re, json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
core=(root/'js/00-core.js').read_text()
eq=(root/'js/41-equations-bibliography.js').read_text()
def extract(src,name):
    match=re.search(r'(?:async )?function '+re.escape(name)+r'\([^\0]*?\n}\n',src)
    assert match,name
    return match.group(0)
functions='\n'.join([extract(core,n) for n in ('parseHocrBbox','parseHocrConfidence','pageRecordFromHocr','mergePageIndexOcrEvidence')])
assertions=0
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=browser.new_page()
    page.set_content('<!doctype html><html><body><div id="root"></div></body></html>')
    page.add_script_tag(content=functions)
    hocr='''<html><body><div class="ocr_page" title="bbox 0 0 1000 1200">
      <span class="ocr_line" title="bbox 750 240 970 275">
        <span class="ocrx_word" title="bbox 750 240 970 275; x_wconf 93">(17.23)</span></span>
      <span class="ocr_line" title="bbox 750 660 970 700">
        <span class="ocrx_word" title="bbox 750 660 970 700; x_wconf 98">(17.24)</span></span>
    </div></body></html>'''
    record=page.evaluate('''hocr => pageRecordFromHocr(hocr,'',1000,1200,229)''',hocr)
    assert record['page']==229; assertions+=1
    assert len(record['lines'])==2; assertions+=1
    assert abs(record['lines'][0]['ratio']-.2)<1e-8; assertions+=1
    assert abs(record['lines'][1]['ratio']-.55)<1e-8; assertions+=1
    assert record['lines'][0]['xStartRatio']==.75; assertions+=1
    assert record['lines'][1]['confidence']==98; assertions+=1
    assert len(record['words'])==2 and record['words'][1]['yEndRatio']>.58; assertions+=1
    # Real DOMParser output goes through exact same additive geometry repair.
    old=dict(record)
    old['lines']=[{**rec,'ratio':1} for rec in record['lines']]
    old['words']=record['words']
    new=page.evaluate('''([old,record])=>mergePageIndexOcrEvidence(old,record)''',[old,record])
    assert len(new['lines'])==2 and new['lines'][1]['ratio']==.55; assertions+=1
    assert len(new['words'])==2; assertions+=1
    # A crop inherited from a rendered page must not lose its parent canvas.
    margin_fn=extract(eq,'equationMarginOcrLines')
    page.add_script_tag(content='''function equationDetectionNowMs(){return performance.now()}
function remapEquationMarginOcrLine(line,side,fraction) {const x=side==='right'?1-fraction:0;return {...line,xStartRatio:x+line.xStartRatio*fraction,xEndRatio:x+line.xEndRatio*fraction}}
'''+margin_fn)
    result=page.evaluate('''async()=>{
      const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1200;
      const worker={recognize:async()=>({data:{hocr:`<div class="ocr_line" title="bbox 100 660 220 700"><span class="ocrx_word" title="bbox 100 660 220 700; x_wconf 95">(17.24)</span></div>`}})};
      const output=await equationMarginOcrLines({},229,'right',worker,{existingCanvas:canvas,marginFraction:.28});
      return {height:canvas.height,width:canvas.width,ratio:output[0].ratio,x:output[0].xStartRatio};
    }''')
    assert result['height']==1200 and result['width']==1000; assertions+=1
    assert abs(result['ratio']-.55)<1e-8; assertions+=1
    assert result['x']>.72; assertions+=1
    fallback=page.evaluate('''async()=>{
      const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1200;
      const worker={recognize:async()=>({data:{hocr:'',text:'(17.24)'}})};
      return await equationMarginOcrLines({},229,'right',worker,{existingCanvas:canvas});
    }''')
    assert fallback==[], 'no position may be published from text-only OCR without hOCR geometry'; assertions+=1
    browser.close()
print(json.dumps({'status':'PASS','assertions':assertions,'scope':'real Chromium DOMParser/canvas; OCR worker mocked, not Texify or PDF.js'}))
