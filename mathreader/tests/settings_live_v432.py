#!/usr/bin/env python3
"""Offline Chromium Settings actions/preferences test using production DOM, CSS,
actual extracted preference functions and event listeners. Does not imply live PDF.js.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
css=(root/'mathreader.css').read_text()
core=(root/'js/00-core.js').read_text()
ui=(root/'js/70-command-ui-runtime.js').read_text()
start=html.index('<section class="workspace-section settings-section"')
end=html.index('<section class="workspace-section shortcuts"',start)
settings=html[start:end]
def fn(source,name):
 start=source.index('function '+name+'(')
 end=source.index('\n}',start)+2
 return source[start:end]
methods='\n'.join(fn(core,n) for n in ['loadDetectionViewPreferences','updateDetectionViewControls',
 'persistDetectionViewPreferences','resetDetectionViewPreferences','loadFormulaOcrPreferences',
 'persistFormulaOcrPreferences'])
start=ui.index("detectionResultsFilterSelect?.addEventListener('change'")
end=ui.index("formulaExtractionSelect?.addEventListener('change'",start)
handlers=ui[start:end]
js='''
const t=(en,zh)=>en;
const mockStore={};
Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mockStore[k]??null,setItem:(k,v)=>{mockStore[k]=String(v)}}});
const DETECTION_VIEW_PREFS_KEY='mathreader-detection-view-v1';
const FORMULA_OCR_PREFS_KEY='mathreader-formula-advanced-v1';
const safeGet=(k,def=null)=>localStorage.getItem(k)??def;
const safeSet=(k,v)=>localStorage.setItem(k,v);
const detectionResultsFilterSelect=document.getElementById('detection-results-filter');
const detectionEquationConfidenceSelect=document.getElementById('detection-equation-confidence');
const detectionProofRelationsToggle=document.getElementById('detection-proof-relations');
const resetDetectionDisplayButton=document.getElementById('reset-detection-display');
const detectionRebuildIndexButton=document.getElementById('detection-rebuild-index');
const detectionScanMarginsButton=document.getElementById('detection-scan-margins');
const ocrCropPaddingSelect=document.getElementById('ocr-crop-padding');
const ocrSevereRetryToggle=document.getElementById('ocr-severe-retry');
let detectionResultsFilter='all',equationConfidenceFilter='all',showProofRelations=true;
let formulaOcrCropPadding='tight',formulaOcrSevereRetryEnabled=true;
let pdfDoc=null,structureIndexBuilding=false,equationLabelIndex=new Map();
let rebuilds=0, scans=0,redraws=0;
const renderStructureIndex=()=>redraws++;
const renderEquationIndex=()=>redraws++;
const buildStructureIndex=()=>rebuilds++;
const forceEquationImageOcr=()=>scans++;
const documentTextFeaturesAvailable=()=>true;
'''+methods+'\n'+handlers+'''
loadDetectionViewPreferences();loadFormulaOcrPreferences();
window.auditState=()=>({detectionResultsFilter,equationConfidenceFilter,showProofRelations,
 formulaOcrCropPadding,formulaOcrSevereRetryEnabled,rebuilds,scans,redraws});
'''
markup='<html data-theme="light" data-lang="en"><head><meta charset="utf-8"><style>'+css+'</style></head><body><aside class="sidebar-right" style="width:270px;padding:12px">'+settings+'</aside><script>'+js+'</script></body></html>'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':500,'height':850})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(markup)
 assert not errors,errors
 assert page.locator('.settings-group').count()==4
 for item in page.locator('.settings-group').all():item.evaluate('(e)=>e.open=true')
 page.locator('#detection-results-filter').select_option('numbered')
 page.locator('#detection-equation-confidence').select_option('review')
 page.locator('#detection-proof-relations').uncheck()
 page.locator('#ocr-crop-padding').select_option('relaxed')
 page.locator('#ocr-severe-retry').uncheck()
 state=page.evaluate('auditState()')
 assert (state['detectionResultsFilter'],state['equationConfidenceFilter'],state['showProofRelations'])==('numbered','review',False),state
 assert (state['formulaOcrCropPadding'],state['formulaOcrSevereRetryEnabled'])==('relaxed',False),state
 assert state['redraws']==3,state
 persisted=page.evaluate("JSON.parse(localStorage.getItem('mathreader-detection-view-v1'))")
 assert persisted=={'results':'numbered','confidence':'review','proofRelations':False},persisted
 page.evaluate("detectionResultsFilter='all';equationConfidenceFilter='high';showProofRelations=true;formulaOcrCropPadding='tight';formulaOcrSevereRetryEnabled=true;loadDetectionViewPreferences();loadFormulaOcrPreferences()")
 assert page.locator('#detection-results-filter').input_value()=='numbered'
 assert page.locator('#detection-equation-confidence').input_value()=='review'
 assert not page.locator('#detection-proof-relations').is_checked()
 assert page.locator('#ocr-crop-padding').input_value()=='relaxed'
 assert not page.locator('#ocr-severe-retry').is_checked()
 page.locator('#reset-detection-display').click()
 assert page.locator('#detection-results-filter').input_value()=='all'
 assert page.locator('#detection-equation-confidence').input_value()=='all'
 assert page.locator('#detection-proof-relations').is_checked()
 assert page.locator('#detection-rebuild-index').is_disabled()
 assert page.locator('#detection-scan-margins').is_disabled()
 state=page.evaluate('auditState()');assert state['rebuilds']==0 and state['scans']==0,state
 # Active PDF: explicit click invokes actions once, no auto run.
 page.evaluate('pdfDoc={numPages:5}')
 page.locator('#detection-rebuild-index').evaluate('(e)=>e.disabled=false')
 page.locator('#detection-scan-margins').evaluate('(e)=>e.disabled=false')
 page.locator('#detection-rebuild-index').click();page.locator('#detection-scan-margins').click()
 state=page.evaluate('auditState()');assert state['rebuilds']==1 and state['scans']==1,state
 assert not errors,errors
 for theme in ['light','dark']:
  page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
  for width in [204,240,270,330]:
   page.locator('.sidebar-right').evaluate('(e,w)=>e.style.width=w+"px"',width)
   assert page.locator('.sidebar-right').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),(theme,width)
 b.close()
print('PASS | v432 offline Chromium Settings | production markup/functions/events, 4 groups, persistence, reset, detection actions, narrow widths')
