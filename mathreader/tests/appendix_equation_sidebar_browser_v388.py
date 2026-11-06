"""Browser DOM regression for appendix labels beyond the former 500-row cap.

Uses the actual MathReader renderEquationIndex() function, fake index data,
real Chromium DOM/scroll geometry. Does not run Tesseract/Texify or PDF.js.
"""
import re
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
source=(root/'js'/'41-equations-bibliography.js').read_text()
match=re.search(r'function renderEquationIndex\(\) \{[\s\S]*?\n\}(?=\n)',source)
assert match, 'renderEquationIndex function exists'
code=match.group(0)
html='''<!doctype html><html><head><style>
#equation-index{overflow:auto;height:240px;width:280px;display:grid;gap:2px}
.equation-edit-row{height:34px;min-height:34px;display:grid;grid-template-columns:1fr auto}
.map-filter-hidden{display:none!important}
</style></head><body>
<input id="map-filter-equations" data-map-target="equation-index" />
<div id="equation-index-count"></div>
<div id="equation-index"></div><div id="equation-index-empty"></div>
</body></html>'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':850})
    page.set_content(html)
    page.evaluate('''(code) => {
      window.el=id=>document.getElementById(id);
      window.equationIndex=el('equation-index');window.equationIndexCount=el('equation-index-count');
      window.equationIndexEmpty=el('equation-index-empty');
      window.equationDetectionProgress={phase:'saved'};
      window.equationConfidenceFilter='all';window.equationEdits=[];
      window.equationIndexKnownCount=null;window.equationAutomaticLabelIndex=null;
      window.equationSourceLabelForDisplayed=s=>s;
      window.t=(en,zh)=>en;
      window.equationConfidenceTier=()=> 'high confidence';
      window.equationRowOrderKey=e=>e.label;
      window.reconcileEquationManualOrder=rows=>rows;
      window.updateDocumentMapCurrentLocation=()=>{};
      window.applyDocumentMapFilter=(input)=>{let query=(input?.value||'').trim().toLowerCase();for(let child of equationIndex.children){child.classList.toggle('map-filter-hidden', !!query&&!child.textContent.toLowerCase().includes(query));}};
      window.equationLabelIndex=new Map();
      for(let n=1;n<=610;n++){const page=20+Math.floor(n/12);equationLabelIndex.set('(17.'+n+')',[{page,ratio:(n%12)/12,text:'f_n = x + y',confidence:24}]);}
      for(let n=1;n<=12;n++){const page=200+Math.floor(n/6);equationLabelIndex.set('(A.'+n+')',[{page,ratio:(n%6)/6,text:'g_n = x + z',confidence:24}]);}
      // Parser only needed to exercise document/page sorting; exact grammar has
      // its own Node VM regression, which executes MathReader's real parser.
      window.parsedEquationNumber=label=> {const x=label.match(/^\\(([A-Za-z0-9]+)\\.(\\d+)\\)$/);return x?{prefix:x[1],last:Number(x[2]),suffix:''}:null};
      window.compareEquationIndexRows=(a,b)=>{const d=a.page-b.page;if(d)return d;const x=parsedEquationNumber(a.label),y=parsedEquationNumber(b.label);if(x&&y&&x.prefix===y.prefix)return x.last-y.last;return a.ratio-b.ratio};
      window.verifiedEquationNavigationTarget=x=>x;
      window.goToMatchedLocation=async()=>{};window.updateBacklinksForTarget=()=>{};
      (0,eval)(code);
      window.renderEquationIndex=renderEquationIndex;
    }''',code)
    page.evaluate('renderEquationIndex()')
    count=page.evaluate("document.querySelectorAll('.equation-edit-row').length")
    assert count==500, f'first batch should be 500, got {count}'
    assert page.evaluate("document.getElementById('equation-index-count').textContent")=='622'
    page.evaluate('''() => {const index=document.getElementById('equation-index');index.scrollTop=index.scrollHeight;}''')
    page.wait_for_function("document.querySelectorAll('.equation-edit-row').length===622",timeout=6000)
    labels=page.locator('.equation-edit-row strong').all_text_contents()
    assert '(A.1)' in labels and '(A.12)' in labels
    assert labels.index('(A.1)')>labels.index('(17.610)'), 'appendix should follow final main-text equation'
    page.evaluate('''() => {const input=document.getElementById('map-filter-equations');input.value='A.';renderEquationIndex();}''')
    filtered=page.locator('.equation-edit-row strong').all_text_contents()
    assert len(filtered)==12, f'appendix search should include all results, got {len(filtered)}'
    assert filtered[0]=='(A.1)' and filtered[-1]=='(A.12)'
    assert page.locator('.map-filter-hidden.equation-edit-row').count()==0
    print('PASS: Chromium rendered 500 initial rows, incrementally loaded all 622, and found all 12 appendix equations using filter')
    browser.close()
