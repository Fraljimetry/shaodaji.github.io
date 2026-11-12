#!/usr/bin/env python3
"""Two Chromium pages using manually mirrored storage events.
Production Settings functions, production handlers, actual Settings HTML/CSS;
PDF/model and shared-origin storage event transport are mocked.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil

# Reuse the extraction harness, not its tests. The production implementation
# is read from the current source files by the existing harness.
source = (Path(__file__).parent/'settings_full_sweep_v434.py').read_text(encoding='utf-8')
prefix = source.split('with sync_playwright() as p:',1)[0]
ns = {'__file__': str(Path(__file__).parent/'settings_full_sweep_v434.py')}
exec(compile(prefix,'settings_full_sweep_v434.py','exec'),ns)
markup = ns['markup']
script = ns['script']
script += "\nwindow.addEventListener('storage',onExternalSettingsStorage);"

count=0
def verify(condition,message):
    global count
    assert condition,message
    count+=1

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1100,'height':920})
    a=context.new_page();b=context.new_page()
    a.set_default_timeout(4000); b.set_default_timeout(4000)
    failures=[]
    a.on('pageerror',lambda exc: failures.append('A: '+str(exc)))
    b.on('pageerror',lambda exc: failures.append('B: '+str(exc)))
    for page in (a,b):
        page.set_content(markup)
        page.add_script_tag(content=script)
        page.locator('.settings-group').evaluate_all('(items)=>items.forEach(e=>e.open=true)')
    def mirror(source,dest,key):
        value=source.evaluate('(key)=>storage[key]??null',key)
        dest.evaluate('''(payload)=>{
            const [key,value]=payload;
            if(value === null) delete storage[key]; else storage[key]=value;
            window.dispatchEvent(new StorageEvent('storage',{key,newValue:value}));
        }''',[key,value])
    verify(a.evaluate('typeof onExternalSettingsStorage')=='function' and
           b.evaluate('typeof onExternalSettingsStorage')=='function',
           'both pages load production external-change handler')

    a.locator('#export-include-detection').uncheck()
    mirror(a,b,'mathreader-export-v1')
    b.wait_for_function('exportPreferences.includeDetection === false')
    verify(not b.locator('#export-include-detection').is_checked(),'export choice synchronizes checkbox')
    a.locator('#export-include-full-text').check()
    mirror(a,b,'mathreader-export-v1')
    b.wait_for_function('exportPreferences.includeFullDocumentText === true')
    verify(b.locator('#export-include-full-text').is_checked(),'full-text export checkbox synchronizes')
    b.locator('#export-include-detection').check()
    mirror(b,a,'mathreader-export-v1')
    a.wait_for_function('exportPreferences.includeDetection === true')
    verify(a.evaluate('exportPreferences.includeFullDocumentText'),'second tab write does not lose full-text choice')

    a.locator('#detection-results-filter').select_option('numbered')
    mirror(a,b,'mathreader-detection-view-v1')
    b.wait_for_function("detectionResultsFilter === 'numbered'")
    verify(b.locator('#detection-results-filter').input_value()=='numbered', 'detection filter synchronizes')
    b.locator('#detection-equation-confidence').select_option('medium')
    mirror(b,a,'mathreader-detection-view-v1')
    a.wait_for_function("equationConfidenceFilter === 'medium'")
    verify(a.evaluate("detectionResultsFilter==='numbered'"),'independent detection changes not clobbered')
    a.locator('#detection-proof-relations').uncheck()
    mirror(a,b,'mathreader-detection-view-v1')
    b.wait_for_function('showProofRelations === false')
    verify(b.evaluate('structureDraws')>0,'remote proof toggle rerenders index')

    a.locator('#ocr-crop-padding').select_option('relaxed')
    mirror(a,b,'mathreader-formula-advanced-v1')
    b.wait_for_function("formulaOcrCropPadding === 'relaxed'")
    verify(b.locator('#ocr-crop-padding').input_value()=='relaxed','remote crop selection shown')
    b.locator('#ocr-severe-retry').uncheck()
    mirror(b,a,'mathreader-formula-advanced-v1')
    a.wait_for_function('formulaOcrSevereRetryEnabled === false')
    verify(a.evaluate("formulaOcrCropPadding==='relaxed'"),'remote OCR retry preserves crop value')

    a.locator('#page-tone').select_option('warm')
    mirror(a,b,'mathreader-display-v3')
    b.wait_for_function("pageTone === 'warm'")
    verify(b.evaluate("root.dataset.pageTone === 'warm'"),'remote tone affects CSS')
    a.locator('#brightness-range').evaluate('(e)=>{e.value="88";e.dispatchEvent(new Event("input",{bubbles:true}));}')
    mirror(a,b,'mathreader-display-v3')
    b.wait_for_function('displayBrightness === 88')
    verify(b.locator('#brightness-value').inner_text()=='88%','remote brightness label matches')
    a.locator('#gap-range').evaluate('(e)=>{e.value="30";e.dispatchEvent(new Event("input",{bubbles:true}));}')
    mirror(a,b,'mathreader-display-v3')
    b.wait_for_function('displayGap === 30')
    verify(b.evaluate("root.style.getPropertyValue('--continuous-gap') === '30px'"),'remote spacing CSS matches')
    # A remote mode change is safe even if a different PDF is open in B.
    b.evaluate("pdfDoc={numPages:8};currentFileKey='tab-b-pdf';updateDisplayControls()")
    a.locator('#flow-single').click()
    mirror(a,b,'mathreader-display-v3')
    b.wait_for_function("readingFlow === 'single' && primaryRenders >= 1")
    verify(not b.locator('#primary-page-surface').evaluate('(e)=>e.classList.contains("is-hidden")'),'remote mode commits actual surface')

    # A remote edit while B renders a pending new mode should be retained.
    b.locator('#flow-continuous').click()
    b.wait_for_function('displayTransitionActive === true && continuousBuilds >= 1')
    a.locator('#brightness-range').evaluate('(e)=>{e.value="92";e.dispatchEvent(new Event("input",{bubbles:true}));}')
    mirror(a,b,'mathreader-display-v3')
    b.wait_for_function('externalDisplayRefreshPending === true')
    b.evaluate('resolveBuild()')
    b.wait_for_function('displayTransitionActive === false && displayBrightness === 92')
    verify(b.evaluate("root.style.getPropertyValue('--pdf-brightness')==='0.92'"),'deferred cross-tab display edit applied')

    # Selecting a different engine in A cannot dispose/swap B's pipeline.
    b.evaluate("mathOcrEngineMode='official'")
    a.locator('#ocr-engine-mode').select_option('webgpu')
    mirror(a,b,'mathreader-ocr-engine-v8')
    b.wait_for_function("notices.some(x => x.includes('another tab'))")
    verify(b.evaluate("mathOcrEngineMode==='official'"),'OCR engine remains unchanged until explicit reload')
    verify(b.evaluate("notices.some(x => x.includes('Reload this tab'))"),'OCR setting change gives actionable notice')

    # Storage deletion / malformed record must restore *every* display default.
    b.evaluate('pdfDoc=null;currentFileKey=null;readingFlow="continuous";displayTransitionActive=false;')
    a.evaluate('localStorage.setItem("mathreader-display-v3", "null")')
    mirror(a,b,'mathreader-display-v3')
    b.wait_for_function("pageTone==='auto' && displayBrightness===100 && displayGap===20 && displayShadow===true")
    verify(b.locator('#page-tone').input_value()=='auto','invalidated record clears stale tone')
    verify(b.locator('#gap-range').input_value()=='20','invalidated record clears stale spacing')
    verify(not failures, f'no browser errors: {failures}')
    browser.close()
print(f'PASS | v436 two-page simulated storage events | {count} assertions; storage transport/PDF/model mocked')
