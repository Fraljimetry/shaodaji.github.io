#!/usr/bin/env python3
"""Real Chromium mouse-hit regression for MathReader manual Equation Add.

Uses actual production click handlers and editing functions, controlled PDF.js
line geometry rather than a deployed PDF worker. Giusti page 20 x/y anchors
are grounded in the matching original PDF and the reported screenshot.
"""
from pathlib import Path
import re
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
source=(root/'js/20-selection-annotations.js').read_text('utf-8')
geometry=(root/'js/41-equations-bibliography.js').read_text('utf-8')
def extract(text,name):
    match=re.search(r'(?:async )?function '+re.escape(name)+r'\([\s\S]*?\n\}(?=\n)',text)
    assert match,name
    return match.group()
functions = ['equationLabelsInTextLine','equationLabelNearPagePoint',
 'manualEquationLabelAlreadyIndexed','showDuplicateManualEquationLabel',
 'equationPointFromClick','equationEditTargetFromPending','equationSourceLabelForDisplayed',
 'pendingEquationDisplayedLabel','equationOrderKeyFromRef','insertEquationManualOrderAfter',
 'applyEquationEdits','applyEquationPointCorrection','applyEquationLinkCorrection']
head='''<!doctype html><html><head><style>
body{margin:0} #primary{position:absolute;left:40px;top:40px;width:700px;height:700px;background:#ddd}
#stack{position:absolute;left:840px;top:40px;width:700px;height:700px;}
.continuous-page-frame{height:700px;width:700px} .continuous-page-surface{width:700px;height:700px;background:#ddd}
.label{position:absolute;left:8.5%;top:26.5%;pointer-events:none}
</style></head><body><div id="primary"><span class="label">(1.4)</span></div>
<div id="stack"><div class="continuous-page-frame" data-page="20"><div class="continuous-page-surface"><div class="textLayer" data-page="20"></div><span class="label">(1.4)</span></div></div></div></body></html>'''
boot=r'''
const primaryPageSurface=document.getElementById('primary');
const continuousStack=document.getElementById('stack');
let currentPage=20;
let pendingEquationAddKey='(1.3)', pendingEquationReselectKey=null, pendingOutlineReselectKey=null;
let pdfDoc={id:'giusti'};
let equationNumberingSide='left';
let equationEdits=[], equationManualOrder=['label:(1.3)','label:(1.2)'];
let equationAutomaticLabelIndex=new Map([['(1.2)',[{page:20,ratio:.229,text:'original (1.2)'}]]]);
let equationLabelIndex=new Map(equationAutomaticLabelIndex);
let errors=[], prompts=0, saved=0;
const normalizedEquationLabel=s=>String(s||'').trim();
const normalizeEquationTagCommands=s=>s;
const equationLabelFromSelectionText=s=>/^\(\d+(?:\.\d+)+\)$/.test(s) ? s : null;
const equationLabelCandidatesInLine=text=>[...String(text).matchAll(/\(\d+(?:\.\d+)+\)/g)].map(m=>({label:m[0],index:m.index,end:m.index+m[0].length}));
const t=s=>s;
const showError=s=>errors.push(s);
const persistDocumentState=()=>saved++;
const refreshEquationIndexAfterManualEdit=async()=>{equationLabelIndex=applyEquationEdits(equationAutomaticLabelIndex)};
const refreshSelectionUI=()=>{};
window.prompt=()=>{prompts++;return '(1.4)'};
let line={text:'Now using (1.3) we may write (1.2) as',ratio:.229,heightRatio:.022,
  xStartRatio:.10,xEndRatio:.49, parts:[
   {start:0,end:10,xStartRatio:.10,xEndRatio:.22},
   {start:10,end:15,xStartRatio:.23,xEndRatio:.275},
   {start:15,end:30,xStartRatio:.28,xEndRatio:.425},
   {start:30,end:35,xStartRatio:.43,xEndRatio:.475},
   {start:35,end:38,xStartRatio:.48,xEndRatio:.49}
  ]};
let pageTextLines=async()=>[line];
'''
handlers=source[source.index("primaryPageSurface?.addEventListener('click',"):source.index('\nfunction addOrReplaceSelectionStructureItem()')]
probe='''
window.__probe={
  reset:()=>{pendingEquationAddKey='(1.3)';pendingEquationReselectKey=null;equationEdits=[];
    equationManualOrder=['label:(1.3)','label:(1.2)'];saved=0;prompts=0;errors=[];equationLabelIndex=new Map(equationAutomaticLabelIndex)},
  get:()=>({edits:equationEdits.map(x=>({label:x.label,page:x.page,ratio:x.ratio})),
   original:equationLabelIndex.get('(1.2)')?.[0]?.ratio, added:equationLabelIndex.get('(1.4)')?.[0]?.ratio,
   errors:errors.length,prompts,saved,pending:pendingEquationAddKey}),
  setPrompt:s=>{window.prompt=()=>{prompts++;return s}},
};
'''
js='\n'.join([boot,extract(geometry,'equationCandidateTokenGeometry'),
 *[extract(source,f) for f in functions],handlers,probe])
with sync_playwright() as play:
    browser=play.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    try:
        page=browser.new_page(viewport={'width':1600,'height':900})
        page.set_content(head)
        page.add_script_tag(content=js)
        checks=0
        # Cursor lies on the actual 1.4 printed at the left edge.
        page.mouse.click(40+700*.085,40+700*.265)
        page.wait_for_function("window.__probe.get().saved===1")
        result=page.evaluate('window.__probe.get()')
        assert result['edits'][0]['label']=='(1.4)' and result['original']==.229 and result['prompts']==1,result
        assert abs(result['added']-.265)<.003,result
        checks+=2
        # Same action in continuous reading uses that page's surface, not the stack.
        page.evaluate('window.__probe.reset()')
        page.mouse.click(840+700*.085,40+700*.265)
        page.wait_for_function('window.__probe.get().saved===1')
        result=page.evaluate('window.__probe.get()')
        assert result['edits'][0]['label']=='(1.4)' and result['original']==.229 and result['prompts']==1,result
        checks+=1
        # A direct click on 1.2 itself cannot use Add to replace 1.2.
        page.evaluate('window.__probe.reset()')
        page.mouse.click(40+700*.45,40+700*.225)
        page.wait_for_function('window.__probe.get().errors>0')
        result=page.evaluate('window.__probe.get()')
        assert result['saved']==0 and result['edits']==[] and result['original']==.229,result
        checks+=1
        # Even typing 1.2 at an unrecognized location never replaces it.
        page.evaluate('window.__probe.reset(); window.__probe.setPrompt("(1.2)")')
        page.mouse.click(40+700*.085,40+700*.265)
        page.wait_for_function('window.__probe.get().errors>0')
        result=page.evaluate('window.__probe.get()')
        assert result['saved']==0 and result['edits']==[] and result['original']==.229,result
        checks+=1
        print(f'PASS: {checks} production DOM click scenarios, single-page and continuous, original 1.2 preserved')
    finally:
        browser.close()
