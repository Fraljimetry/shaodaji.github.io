#!/usr/bin/env python3
"""Settings v434–v436: Chromium integration with exact production preference functions and event handlers.
Offline harness: real source functions, real HTML/CSS and real DOM events, mocked PDF/model only.
Not a real PDF.js navigation or Texify accuracy certification.
"""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT/'index.html').read_text(encoding='utf-8')
css = (ROOT/'mathreader.css').read_text(encoding='utf-8')
core = (ROOT/'js/00-core.js').read_text(encoding='utf-8')
ui = (ROOT/'js/70-command-ui-runtime.js').read_text(encoding='utf-8')
events = (ROOT/'js/60-notes-bookmarks-data.js').read_text(encoding='utf-8')
ocr = (ROOT/'js/10-formula-ocr.js').read_text(encoding='utf-8')
detector = (ROOT/'js/41-equations-bibliography.js').read_text(encoding='utf-8')
rendering = (ROOT/'js/30-rendering-navigation.js').read_text(encoding='utf-8')
tutorial = (ROOT/'tutorial.html').read_text(encoding='utf-8')

def function(source, name):
    start = source.index('function ' + name + '(')
    if source[max(0, start-6):start] == 'async ': start -= 6
    end = source.index('\n}', start)+2
    return source[start:end]

methods = '\n'.join(function(core, name) for name in (
    'loadDetectionViewPreferences', 'updateDetectionViewControls', 'persistDetectionViewPreferences',
    'resetDetectionViewPreferences', 'loadFormulaOcrPreferences', 'persistFormulaOcrPreferences',
    'loadExportPreferences','persistExportPreferences', 'savedDisplayNumber','loadDisplayPreferences',
    'persistDisplayPreferences', 'resolvedPageTone', 'updateDisplayControls',
    'applyPageDisplay', 'flushExternalDisplayPreferences', 'applyExternalDisplayPreferences', 'onExternalSettingsStorage', 'setReadingFlow', 'resetDisplayPreferences', 'saveSettingsPreference'))
methods += '\n' + function(rendering, 'runDisplayTransition')
methods += '\n' + function(ocr, 'updateOcrInteractionAvailability')
methods += '\n' + function(ocr, 'normalizedOcrEngineMode') + '\n' + function(ocr, 'currentOcrPlan')
methods += '\n' + function(detector, 'refreshEquationForceOcrButton')
settings_events = ui[ui.index("detectionResultsFilterSelect?.addEventListener('change'"):ui.index("mathOcrButton?.addEventListener('click'")]
settings_events += '\n' + ui[ui.index('exportDetectionOption?.addEventListener('):ui.index('importReadingDataButton?.addEventListener(')]
settings_events += '\n' + events[events.index("zoomIn.addEventListener('click'"):events.index("zoomLabel.addEventListener('click'")]
settings_events += '\n' + events[events.index('flowButton?.addEventListener('):events.index('\nfunction formatCompactDate(', events.index('flowButton?.addEventListener('))]
settings_markup = html[html.index('<section class="workspace-section settings-section"'):html.index('<section class="workspace-section shortcuts"')]

harness = '''
const root=document.documentElement;
const el=id=>document.getElementById(id);
const t=(en,zh)=>root.dataset.lang==='zh'?zh:en;
const storage={};
Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=String(v);},removeItem:k=>delete storage[k]}});
const safeGet=(key,fallback=null)=>localStorage.getItem(key)??fallback;
const safeSet=(key,value)=>localStorage.setItem(key,value);
let settingsStorageWarningShown=false;
let externalDisplayRefreshPending=false;
const notices=[];const showNotice=message=>notices.push(message);const showError=message=>notices.push('ERROR: '+message);
const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;};
const DISPLAY_PREFS_KEY='mathreader-display-v3', DETECTION_VIEW_PREFS_KEY='mathreader-detection-view-v1';
const FORMULA_OCR_PREFS_KEY='mathreader-formula-advanced-v1',EXPORT_PREFS_KEY='mathreader-export-v1';
const LEGACY_DISPLAY_PREFS_KEYS=['mathreader-display-v2','mathreader-display-v1'];
const flowButton=el('flow-button'),flowContinuous=el('flow-continuous'),flowSingle=el('flow-single');
const resetDisplay=el('reset-display'),pageToneSelect=el('page-tone'),brightnessRange=el('brightness-range'),brightnessValue=el('brightness-value'),contrastRange=el('contrast-range'),contrastValue=el('contrast-value'),gapRange=el('gap-range'),gapValue=el('gap-value'),pageShadow=el('page-shadow'),displayZoomStepSelect=el('display-zoom-step');
const detectionResultsFilterSelect=el('detection-results-filter'),detectionEquationConfidenceSelect=el('detection-equation-confidence'),detectionProofRelationsToggle=el('detection-proof-relations'),resetDetectionDisplayButton=el('reset-detection-display'),detectionRebuildIndexButton=el('detection-rebuild-index'),detectionScanMarginsButton=el('detection-scan-margins');
const ocrCropPaddingSelect=el('ocr-crop-padding'),ocrSevereRetryToggle=el('ocr-severe-retry'),formulaExtractionSelect=el('formula-extraction-mode'),ocrEngineSelect=el('ocr-engine-mode'),ocrRetryButton=el('ocr-retry');
const exportDetectionOption=el('export-include-detection'),exportFullTextOption=el('export-include-full-text');
const mathOcrButton=el('math-ocr');
const primaryCanvasWrap=el('primary-canvas-wrap'),primaryPageSurface=el('primary-page-surface'),continuousStack=el('continuous-stack');
const canvas={};
const zoomIn=el('zoom-in'),zoomOut=el('zoom-out');
let displayTransitionSerial=0,displayFlowTransitionActive=false,displayDeferredReflowDocument=null,currentFileKey=null,continuousRebuilding=false,failNextPageRender=false;
let holdSameModeRender=false,releaseSameModeRender=null;
let readingFlow='continuous',pageTone='auto',displayBrightness=100,displayContrast=100,displayGap=20,displayShadow=true,zoomStep=.15;
let detectionResultsFilter='all',equationConfidenceFilter='all',showProofRelations=true,formulaOcrCropPadding='tight',formulaOcrSevereRetryEnabled=true;
let exportPreferences={includeDetection:true,includeFullDocumentText:false};
let formulaExtractionMode='image',mathOcrEngineMode='official',mathOcrLoading=false,mathOcrInitializationFailed=false,mathOcrDisposing=false,mathOcrDisposalFailed=false;
let pdfDoc=null,currentPage=4,continuousScrollTop=0,continuousSavedAnchor=null,displayTransitionActive=false,zoomMode='fit-width';
let equationLabelIndex=new Map(),structureIndexBuilding=false,equationIndexBuildPromise=null,equationImageAssistPromise=null,documentOcrActive=false,documentOcrBusy=false;
let indexBuilds=0,scanCount=0,structureDraws=0,equationDraws=0,continuousBuilds=0,primaryRenders=0,currentRenders=0,disposals=0,ocrMode=false;
let disposeMode='ok',resolveDisposal=null;const ocrStatuses=[];
const renderStructureIndex=()=>structureDraws++;
const renderEquationIndex=()=>equationDraws++;
const buildStructureIndex=async()=>{indexBuilds++;};
const forceEquationImageOcr=async()=>{scanCount++;};
const documentTextFeaturesAvailable=()=>true;
const captureContinuousAnchor=()=>({page:currentPage,ratio:.35});
const clearContinuousObserver=()=>{};
const applyOcrModeToSurfaces=()=>{};
const renderCurrentPage=async()=>{currentRenders++;if(failNextPageRender){failNextPageRender=false;throw new Error('synthetic page reflow failure');}if(holdSameModeRender){await new Promise(resolve=>{releaseSameModeRender=resolve});holdSameModeRender=false;}};
const renderReferencePage=async()=>{};
const snapshotDisplayAnchor=()=>null;
let buildResolve=null,buildReject=null;
const buildContinuousDocument=async()=>{continuousBuilds++;await new Promise((resolve,reject)=>{buildResolve=resolve;buildReject=reject;});};
const renderPage=async()=>{primaryRenders++;};
const persistDocumentState=()=>{};
const setOcrStatus=(msg)=>ocrStatuses.push(msg);
const updateOcrCapability=()=>{};
const resetOcrBoxes=()=>{};
const setOcrMode=(value)=>{ocrMode=value;};
const disposeMathOcrPipeline=async()=>{
 disposals++;
 if(disposeMode==='defer') {await new Promise(resolve=>{resolveDisposal=resolve;});disposeMode='ok';}
 if(disposeMode==='fail') {mathOcrDisposalFailed=true;setOcrStatus('OCR engine could not be unloaded safely. Reload MathReader.');showNotice('OCR engine could not be unloaded safely.');return false;}
 return true;
};
const changeZoom=async(delta)=>{window.lastZoomDelta=delta;};
const equationForceOcrButton=el('equation-force');
window.storage=storage;window.notices=notices;
'''

init = '''
loadDisplayPreferences();loadDetectionViewPreferences();loadFormulaOcrPreferences();loadExportPreferences();
applyPageDisplay({persist:false});setReadingFlow(readingFlow,{persist:false,render:false});
window.snapshot=()=>({readingFlow,pageTone,displayBrightness,displayContrast,displayGap,displayShadow,zoomStep,
 detectionResultsFilter,equationConfidenceFilter,showProofRelations,formulaOcrCropPadding,formulaOcrSevereRetryEnabled,
 exportPreferences:{...exportPreferences},formulaExtractionMode,mathOcrEngineMode,mathOcrLoading,ocrMode,
 indexBuilds,scanCount,structureDraws,equationDraws,continuousBuilds,primaryRenders,currentRenders,disposals,
 pageToneDOM:root.dataset.pageTone,shadowDOM:root.dataset.pageShadow,brightnessCSS:root.style.getPropertyValue('--pdf-brightness'),gapCSS:root.style.getPropertyValue('--continuous-gap')});
window.testResetFromSingle=()=>{continuousBuilds=0;readingFlow='single';pdfDoc={numPages:8};currentPage=4;primaryPageSurface.classList.remove('is-hidden');continuousStack.classList.add('is-hidden');buildResolve=null;};
window.resolveBuild=()=>{if(buildResolve){buildResolve();buildResolve=null;buildReject=null;}};
window.rejectBuild=()=>{if(buildReject){buildReject(new Error('synthetic render failure'));buildResolve=null;buildReject=null;}};
window.reloadPrefs=()=>{readingFlow='single';pageTone='original';displayBrightness=70;displayContrast=80;displayGap=8;displayShadow=false;zoomStep=.10;
 detectionResultsFilter='all';equationConfidenceFilter='all';showProofRelations=true;
 formulaOcrCropPadding='tight';formulaOcrSevereRetryEnabled=true;
 exportPreferences={includeDetection:true,includeFullDocumentText:false};
 loadDisplayPreferences();loadDetectionViewPreferences();loadFormulaOcrPreferences();loadExportPreferences();applyPageDisplay({persist:false});};
window.ocrPlan=mode=>{mathOcrEngineMode=mode;return currentOcrPlan().map(b=>({device:b.device,dtype:b.dtype,label:b.label}));};
window.busyScan=active=>{equationIndexBuildPromise=active?Promise.resolve():null;refreshEquationForceOcrButton();};
window.withPDF=()=>{pdfDoc={numPages:8};};
window.failDisplayReflow=()=>{failNextPageRender=true;};
window.holdSameMode=()=>{holdSameModeRender=true;};
window.finishSameMode=()=>{releaseSameModeRender?.();releaseSameModeRender=null;};
window.startSlowDisposal=()=>{disposeMode='defer';};
window.finishSlowDisposal=()=>{if(resolveDisposal){resolveDisposal();resolveDisposal=null;}};
window.failDisposal=()=>{disposeMode='fail';};
window.ocrStatuses=ocrStatuses;
'''
markup = f'''<html lang="en" data-lang="en" data-theme="light"><head><meta charset="utf-8"><style>{css}</style></head>
<body><button id="zoom-in"></button><button id="zoom-out"></button><button id="flow-button"></button><button id="math-ocr"></button><button id="equation-force"></button>
<div id="primary-canvas-wrap"><div id="primary-page-surface"></div><div id="continuous-stack" class="is-hidden"></div></div>
<aside class="sidebar sidebar-right" style="width:270px;padding:12px;position:relative;display:block;">{settings_markup}</aside>
</body></html>'''
script = harness + '\n' + methods + '\n' + settings_events + '\n' + init
checks = 0

def verify(cond, reason):
    global checks
    assert cond, reason
    checks += 1

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1024,'height':920})
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(markup)
    page.add_script_tag(content=script)
    verify(not errors, f'initial script errors: {errors}')
    for group in page.locator('.settings-group').all():group.evaluate('(e)=>e.open=true')
    verify(page.locator('.settings-group').count()==4,'four settings sections present')
    verify(page.locator('#flow-button').is_disabled(), 'toolbar reading-flow toggle remains disabled without a PDF')
    verify(not page.locator('#flow-single').is_disabled() and not page.locator('#flow-continuous').is_disabled(), 'Settings can choose future reading-flow default without an open PDF')
    verify(page.evaluate('snapshot().exportPreferences')=={'includeDetection':True,'includeFullDocumentText':False},'export defaults')
    verify(page.evaluate('ocrPlan("official")')[0]['label']=='Texify · CPU','default CPU is explicit')
    verify(len(page.evaluate('ocrPlan("webgpu")'))==1,'WebGPU cannot silently fall back to CPU')
    verify(page.evaluate('ocrPlan("webgpu")')[0]['device']=='webgpu','WebGPU plan stays selected')
    verify(len(page.evaluate('ocrPlan("wasm")'))==1 and page.evaluate('ocrPlan("wasm")')[0]['dtype']=='q8','WASM selected backend remains q8')
    page.locator('#display-zoom-step').select_option('0.20')
    page.locator('#page-tone').select_option('warm')
    page.locator('#brightness-range').evaluate('(e)=>{e.value="89";e.dispatchEvent(new Event("input",{bubbles:true}));}')
    page.locator('#contrast-range').evaluate('(e)=>{e.value="113";e.dispatchEvent(new Event("input",{bubbles:true}));}')
    page.locator('#gap-range').evaluate('(e)=>{e.value="32";e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}')
    page.locator('#page-shadow').uncheck()
    a=page.evaluate('snapshot()')
    verify((a['zoomStep'],a['pageTone'],a['displayBrightness'],a['displayContrast'],a['displayGap'],a['displayShadow'])==(.20,'warm',89,113,32,False),'all numeric/tone/shadow settings wire to live state')
    verify((a['pageToneDOM'],a['shadowDOM'],a['brightnessCSS'],a['gapCSS'])==('warm','off','0.89','32px'),'display state affects CSS')
    verify(page.locator('#brightness-value').inner_text()=='89%' and page.locator('#contrast-value').inner_text()=='113%','slider values update')
    page.locator('#zoom-in').click()
    verify(page.evaluate('window.lastZoomDelta')==.20, 'zoom in uses selected step')
    page.locator('#zoom-out').click()
    verify(page.evaluate('window.lastZoomDelta')==-.20, 'zoom out uses selected step')
    page.locator('#detection-results-filter').select_option('numbered')
    page.locator('#detection-equation-confidence').select_option('review')
    page.locator('#detection-proof-relations').uncheck()
    page.locator('#ocr-crop-padding').select_option('relaxed')
    page.locator('#ocr-severe-retry').uncheck()
    page.locator('#export-include-detection').uncheck()
    page.locator('#export-include-full-text').check()
    a=page.evaluate('snapshot()')
    verify((a['detectionResultsFilter'],a['equationConfidenceFilter'],a['showProofRelations'])==('numbered','review',False),'detection controls update state')
    verify((a['formulaOcrCropPadding'],a['formulaOcrSevereRetryEnabled'])==('relaxed',False),'crop and retry controls update state')
    verify(a['exportPreferences']=={'includeDetection':False,'includeFullDocumentText':True},'export checkboxes update settings')
    verify(page.evaluate('storage["mathreader-detection-view-v1"]!==undefined && storage["mathreader-formula-advanced-v1"]!==undefined'),'detection and OCR prefs persisted')
    page.evaluate('reloadPrefs()')
    a=page.evaluate('snapshot()')
    verify((a['zoomStep'],a['pageTone'],a['displayBrightness'],a['displayContrast'],a['displayGap'],a['displayShadow'])==(.20,'warm',89,113,32,False),'display preferences restore from localStorage')
    verify((a['detectionResultsFilter'],a['equationConfidenceFilter'],a['showProofRelations'])==('numbered','review',False),'detection preferences restore')
    verify((a['formulaOcrCropPadding'],a['formulaOcrSevereRetryEnabled'])==('relaxed',False),'OCR preferences restore')
    verify(a['exportPreferences']=={'includeDetection':False,'includeFullDocumentText':True},'export preferences restore')
    page.locator('#reset-detection-display').click()
    a=page.evaluate('snapshot()')
    verify((a['detectionResultsFilter'],a['equationConfidenceFilter'],a['showProofRelations'])==('all','all',True),'reset filters restores all controls')
    verify(a['structureDraws']>=3 and a['equationDraws']>=2,'filter changes re-render both indexes')
    verify(page.locator('#detection-rebuild-index').is_disabled() and page.locator('#detection-scan-margins').is_disabled(),'detection actions disabled before PDF')
    page.evaluate('withPDF()')
    page.locator('#detection-rebuild-index').evaluate('(e)=>e.disabled=false')
    page.locator('#detection-scan-margins').evaluate('(e)=>e.disabled=false')
    page.locator('#detection-rebuild-index').click()
    page.locator('#detection-scan-margins').click()
    verify(page.evaluate('snapshot().indexBuilds')==1 and page.evaluate('snapshot().scanCount')==1,'actions require explicit click, invoke exactly once')
    page.evaluate('busyScan(true)')
    verify(page.locator('#detection-scan-margins').is_disabled() and page.locator('#equation-force').is_disabled(),'duplicate scan actions disabled during busy operation')
    page.evaluate('busyScan(false)')
    verify(not page.locator('#detection-scan-margins').is_disabled(),'scan action recovers when idle')
    page.locator('#flow-single').click()
    page.wait_for_timeout(80)
    verify(page.evaluate('snapshot().readingFlow')=='single' and page.evaluate('snapshot().primaryRenders')==1,'single-page button renders single surface')
    verify(page.evaluate('JSON.parse(storage["mathreader-display-v3"]).flow')=='single','single-page flow persisted')
    page.locator('#flow-continuous').click()
    verify(page.evaluate('snapshot().continuousBuilds')==1,'continuous button prepares rebuilt stack')
    page.evaluate('resolveBuild()')
    page.wait_for_timeout(80)
    verify(page.evaluate('snapshot().readingFlow')=='continuous','continuous button completes transition')
    page.locator('#formula-extraction-mode').select_option('vector')
    verify(page.evaluate('snapshot().formulaExtractionMode')=='vector' and page.evaluate('storage["mathreader-formula-method-v1"]')=='vector','extraction method persisted')
    page.locator('#ocr-engine-mode').select_option('webgpu')
    verify(page.evaluate('snapshot().mathOcrEngineMode')=='webgpu' and page.evaluate('storage["mathreader-ocr-engine-v8"]')=='webgpu', 'WebGPU choice saved')
    page.locator('#ocr-engine-mode').select_option('wasm')
    verify(page.evaluate('snapshot().mathOcrEngineMode')=='wasm' and page.evaluate('storage["mathreader-ocr-engine-v8"]')=='wasm','engine mode persisted')
    verify(page.evaluate('snapshot().disposals')==2,'each engine change disposes loaded pipeline')
    page.locator('.ocr-troubleshooting').evaluate('(e)=>e.open=true')
    page.locator('#ocr-retry').click()
    verify(page.evaluate('snapshot().disposals')==3,'reset OCR disposes engine without inference')
    # A same-mode Reset can still render, reject or go stale; it must never
    # become an unhandled promise rejection or announce a successful reset.
    page.evaluate("readingFlow='continuous';pdfDoc={numPages:8};currentFileKey='reset-doc';")
    page.evaluate('failDisplayReflow()')
    page.locator('#reset-display').click()
    page.wait_for_timeout(80)
    verify(any('Could not refresh the PDF' in message for message in page.evaluate('notices')),
           'same-mode Reset reports failed PDF re-render')
    verify(not page.evaluate('displayTransitionActive'), 'same-mode failed Reset releases controls')
    verify(not errors, f'same-mode Reset creates no unhandled page errors: {errors}')

    # A reset running against an old PDF must not commit to the newly opened
    # document after its delayed same-mode refresh finishes.
    page.evaluate("pdfDoc={numPages:8};currentFileKey='old-document';readingFlow='continuous';holdSameMode()")
    page.locator('#reset-display').click()
    page.wait_for_function('displayTransitionActive === true && !!releaseSameModeRender')
    verify(page.locator('#reset-display').is_disabled(),'same-mode Reset locks controls during slow PDF refresh')
    page.evaluate("pdfDoc={numPages:12};currentFileKey='new-document';finishSameMode()")
    page.wait_for_timeout(90)
    verify(not page.evaluate('displayTransitionActive'), 'same-mode stale PDF completion releases controls')
    verify(not errors, f'no stale same-mode PDF errors: {errors}')

    # An asynchronous engine-unload can outlive the change event. Settings
    # must lock OCR controls, reject overlapping requests and avoid loading a
    # second engine before the first pipeline is fully disposed.
    page.evaluate('startSlowDisposal()')
    page.locator('#ocr-engine-mode').select_option('official')
    verify(page.locator('#ocr-engine-mode').is_disabled() and page.locator('#ocr-retry').is_disabled(),'slow engine disposal locks OCR Settings controls')
    previousDisposals=page.evaluate('snapshot().disposals')
    page.evaluate('() => {const e=document.getElementById("ocr-engine-mode");e.value="webgpu";e.dispatchEvent(new Event("change",{bubbles:true}));}')
    verify(page.evaluate('snapshot().disposals')==previousDisposals and page.locator('#ocr-engine-mode').input_value()=='official','overlapping engine changes cannot race or silently replace selection')
    page.evaluate('finishSlowDisposal()')
    page.wait_for_timeout(80)
    verify(not page.locator('#ocr-engine-mode').is_disabled() and not page.locator('#ocr-retry').is_disabled(),'successful disposal unlocks engine controls')
    # An unload error must not be reported as a successful reset.
    page.evaluate('failDisposal()')
    page.locator('#ocr-retry').click()
    page.wait_for_timeout(50)
    verify(page.evaluate('mathOcrDisposalFailed') and page.locator('#ocr-engine-mode').is_disabled(),'failed engine unload locks unsafe image-engine reuse')
    verify(not any('OCR reset · loads' in s for s in page.evaluate('ocrStatuses.slice(-1)')),'failed unload does not display a success message')
    # Reset display from single page must call the transition builder and not
    # reveal the empty continuous surface until it has completed.
    page.evaluate('testResetFromSingle()')
    page.locator('#reset-display').click()
    a=page.evaluate('snapshot()')
    verify(a['continuousBuilds']==1,'display reset invokes safe single-to-continuous rebuild')
    verify(page.locator('#reset-display').is_disabled() and page.locator('#flow-single').is_disabled() and page.locator('#flow-continuous').is_disabled() and page.locator('#flow-button').is_disabled(), 'flow and reset controls lock while transition destination is unready')
    verify(page.evaluate('setReadingFlow("single")') is False,'overlapping mode transition refused rather than replacing pending render')
    verify(page.evaluate('snapshot().readingFlow')=='continuous','second mode request cannot overwrite in-flight destination')
    verify(not page.locator('#primary-page-surface').evaluate('(e)=>e.classList.contains("is-hidden")'),'old reading surface retained while rebuilding')
    verify(page.locator('#continuous-stack').evaluate('(e)=>e.classList.contains("is-hidden")'),'continuous stack not exposed prematurely')
    page.evaluate('resolveBuild()')
    page.wait_for_timeout(100)
    a=page.evaluate('snapshot()')
    verify(a['readingFlow']=='continuous' and page.locator('#primary-page-surface').evaluate('(e)=>e.classList.contains("is-hidden")'),'reset finishes in continuous reading')
    verify(not page.locator('#flow-single').is_disabled() and not page.locator('#reset-display').is_disabled(),'flow controls unlock after completed transition')
    verify((a['zoomStep'],a['pageTone'],a['displayBrightness'],a['displayContrast'],a['displayGap'],a['displayShadow'])==(.15,'auto',100,100,20,True),'display reset restores six defaults')
    # Sidebar/page-width reflows can arrive while the opposite reading-mode
    # surface is still being prepared. Never let a second serial invalidate the
    # destination switch; apply the mutation then rerender once after commit.
    page.evaluate('testResetFromSingle()')
    page.locator('#reset-display').click()
    page.evaluate('runDisplayTransition(() => {displayGap=34;applyPageDisplay();})')
    verify(page.evaluate('snapshot().displayGap')==34 and page.evaluate('snapshot().continuousBuilds')==1,'concurrent display change updates settings without canceling active mode render')
    verify(page.locator('#continuous-stack').evaluate('(e)=>e.classList.contains("is-hidden")'),'in-flight mode destination remains hidden after concurrent display edit')
    page.evaluate('resolveBuild()')
    page.wait_for_timeout(100)
    verify(page.evaluate('snapshot().readingFlow')=='continuous' and page.locator('#primary-page-surface').evaluate('(e)=>e.classList.contains("is-hidden")'),'mode transition commits correctly after deferred display mutation')
    verify(page.evaluate('snapshot().continuousBuilds')==2,'concurrent layout changes coalesce into one follow-up reflow')
    page.evaluate('resolveBuild()')
    page.wait_for_timeout(100)
    verify(not page.locator('#reset-display').is_disabled() and page.evaluate('snapshot().displayGap')==34,'deferred reflow finishes and releases display controls')
    for lang in ('en','zh'):
        page.evaluate('''lang=>{document.documentElement.dataset.lang=lang;document.querySelectorAll('[data-en][data-zh]').forEach(e=>{if(e.children.length===0)e.textContent=e.getAttribute('data-'+lang)})}''',lang)
        verify(('显示' in page.locator('#settings-display-group').inner_text()) if lang=='zh' else ('Display' in page.locator('#settings-display-group').inner_text()), f'{lang} settings titles translated')
        for width in (204,240,270,330):
            page.locator('.sidebar-right').evaluate('(e,w)=>e.style.width=w+"px"',width)
            verify(page.locator('.sidebar-right').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),f'no horizontal overflow at {lang} {width}px')
            verify(all(e.evaluate('(el)=>el.scrollWidth<=el.clientWidth+3') for e in page.locator('.settings-group-body').all()),f'all group content fits at {lang} {width}px')
    # Reject malformed/migrated numeric fields rather than interpreting null,
    # empty strings or booleans as zero and clamping them to minima.
    page.evaluate('storage["mathreader-display-v3"]=JSON.stringify({flow:"single", brightness:null,contrast:"",gap:false,zoomStep:.15});loadDisplayPreferences()')
    verify(page.evaluate('snapshot().displayBrightness')==100 and page.evaluate('snapshot().displayContrast')==100 and page.evaluate('snapshot().displayGap')==20,'null/empty/boolean display fields recover standard defaults')
    page.evaluate('storage["mathreader-display-v3"]=JSON.stringify({brightness:"112",contrast:"117",gap:"40"});loadDisplayPreferences()')
    verify(page.evaluate('snapshot().displayBrightness')==112 and page.evaluate('snapshot().displayContrast')==117 and page.evaluate('snapshot().displayGap')==40,'valid numeric-string migrated display fields remain accepted')
    # A failed destination render must restore the old surface, display state
    # and persisted flow instead of leaving the user in a ghost state.
    page.evaluate('testResetFromSingle()')
    page.locator('#reset-display').click()
    verify(page.evaluate('snapshot().continuousBuilds')==1,'failure case is exercising a real pending destination build')
    page.evaluate('rejectBuild()')
    page.wait_for_timeout(100)
    verify(page.evaluate('snapshot().readingFlow')=='single' and not page.locator('#primary-page-surface').evaluate('(e)=>e.classList.contains("is-hidden")'),'render rejection restores the original single-page surface')
    verify(not page.locator('#reset-display').is_disabled() and page.evaluate('JSON.parse(storage["mathreader-display-v3"]).flow')=='single','failed reset unlocks Settings and saves truthful flow with restored appearance')
    verify(any('Could not switch reading mode' in msg or '无法切换阅读方式' in msg for msg in page.evaluate('notices')),'failed transition reports a visible error')
    # Completion of an old PDF's build must never change the new document's
    # mode or replace its visible surface.
    page.evaluate('testResetFromSingle()')
    page.locator('#reset-display').click()
    page.evaluate('() => {pdfDoc={numPages:9};currentFileKey="new-pdf";readingFlow="single";}')
    page.evaluate('resolveBuild()')
    page.wait_for_timeout(100)
    verify(page.evaluate('snapshot().readingFlow')=='single' and not page.locator('#primary-page-surface').evaluate('(e)=>e.classList.contains("is-hidden")'),'stale previous-PDF transition cannot flip newly opened PDF')
    verify(not page.locator('#reset-display').is_disabled(),'stale transition eventually releases its busy lock')
    # A failed page-spacing reflow must show an error and release the same
    # Settings controls. This exercises the production helper, not a mock.
    page.evaluate('failDisplayReflow()')
    page.locator('#flow-single').click()
    page.wait_for_timeout(100)
    page.evaluate('() => {const x=document.getElementById("gap-range");x.value="36";x.dispatchEvent(new Event("input",{bubbles:true}));x.dispatchEvent(new Event("change",{bubbles:true}));}')
    page.wait_for_timeout(100)
    verify(not page.locator('#reset-display').is_disabled() and not page.locator('#flow-continuous').is_disabled(),'reflow failure releases Settings controls')
    verify(any('Could not refresh the PDF' in msg or '无法刷新 PDF' in msg for msg in page.evaluate('notices')),'reflow failure is visibly reported')
    # Malformed preferences should restore documented defaults, not leak stale values.
    page.evaluate('storage["mathreader-detection-view-v1"]="{bad json"; loadDetectionViewPreferences()')
    verify(page.evaluate('snapshot().detectionResultsFilter')=='all' and page.evaluate('snapshot().equationConfidenceFilter')=='all', 'corrupt detection settings use safe defaults')
    page.evaluate('storage["mathreader-display-v3"]=JSON.stringify({flow:"weird",tone:"unknown",brightness:1000,contrast:-5,gap:100,zoomStep:.33});loadDisplayPreferences()')
    verify(page.evaluate('snapshot().displayBrightness')==115 and page.evaluate('snapshot().displayContrast')==80 and page.evaluate('snapshot().displayGap')==44 and page.evaluate('snapshot().zoomStep')==.15, 'out-of-range numeric preferences are validated and clamped')
    # Storage failure must be visibly disclosed, not silently swallowed.
    page.evaluate('notices.length=0')
    page.evaluate('() => {localStorage.setItem = () => {throw new Error("storage quota")}; return true;}')
    page.locator('#display-zoom-step').select_option('0.10')
    verify(page.evaluate('notices.length')==1 and ('cannot be saved' in page.evaluate('notices[0]') or '无法在此浏览器保存设置' in page.evaluate('notices[0]')), 'blocked browser storage produces a user-visible warning')
    page.locator('#display-zoom-step').select_option('0.15')
    verify(page.evaluate('notices.length')==1,'repeated storage failures do not spam notices')
    verify('WebGPU q4f16' in tutorial and 'Default · Texify CPU' in tutorial and '识别引擎不会暗中切换' in tutorial,'tutorial documents engine selection EN/ZH')
    verify(not errors, f'page errors: {errors}')
    browser.close()
print(f'PASS | v436 Settings Chromium + lifecycle edge cases | {checks} checks; 4 sections, 22 controls/actions, 8 EN/ZH widths; mocked PDF/model explicitly')
