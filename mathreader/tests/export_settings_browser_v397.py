#!/usr/bin/env python3
"""Real Chromium Settings click/reload/theming test; mock PDF state not required.
Does not test live OCR or PDF.js extraction.
"""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'mathreader.css').read_text(encoding='utf-8')
core=(root/'js/00-core.js').read_text(encoding='utf-8')
ui=(root/'js/70-command-ui-runtime.js').read_text(encoding='utf-8')
setting=html[html.index('<section class="workspace-section settings-section"'):html.index('<section class="workspace-section shortcuts"')]
# Use the real Settings HTML, real CSS, real settings functions and event hooks.
functions=[]
for name in ('saveSettingsPreference','loadExportPreferences','persistExportPreferences'):
    match=re.search(r'function '+name+r'\([\s\S]*?\n\}(?=\n)',core)
    assert match,name
    functions.append(match.group(0))
assert 'exportDetectionOption?.addEventListener' in ui
markup='<!doctype html><html data-theme="light" data-lang="en"><head><meta charset="utf-8"><style>'+css+'</style></head><body><aside style="width:320px;max-width:100%;padding:12px;">'+setting+'</aside><script>'
markup+='''
window.__exportStore = window.__exportStore || {};
Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__exportStore[k]??null,setItem:(k,v)=>{window.__exportStore[k]=String(v)}}});
const exportDetectionOption=document.getElementById('export-include-detection');
const exportFullTextOption=document.getElementById('export-include-full-text');
const EXPORT_PREFS_KEY='mathreader-export-v1';
let exportPreferences={includeDetection:true,includeFullDocumentText:false};
const safeGet=(key,fallback=null)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback}};
const safeSet=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
const t=(en)=>en;const showNotice=()=>{};let settingsStorageWarningShown=false;
'''+ '\n'.join(functions)+'''
exportDetectionOption?.addEventListener('change',persistExportPreferences);
exportFullTextOption?.addEventListener('change',persistExportPreferences);
loadExportPreferences();
window.exportState=()=>({...exportPreferences});
</script></body></html>'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':900,'height':790})
    page=context.new_page()
    page.set_content(markup)
    details=page.locator('#settings-export-group')
    assert details.count()==1
    details.locator('summary').click()
    a=page.locator('#export-include-detection')
    b=page.locator('#export-include-full-text')
    assert a.is_checked() and not b.is_checked()
    assert page.evaluate('window.exportState()')=={'includeDetection':True,'includeFullDocumentText':False}
    # Both options independently selectable; reset in-memory settings, restore from local store.
    a.uncheck();b.check()
    assert not a.is_checked() and b.is_checked()
    assert page.evaluate('window.exportState()')=={'includeDetection':False,'includeFullDocumentText':True}
    page.evaluate('exportPreferences={includeDetection:true,includeFullDocumentText:false};loadExportPreferences()')
    assert not page.locator('#export-include-detection').is_checked()
    assert page.locator('#export-include-full-text').is_checked()
    # Check all on and all off, including reloading persisted state.
    page.locator('#export-include-detection').check()
    page.evaluate('exportPreferences={includeDetection:true,includeFullDocumentText:false};loadExportPreferences()')
    assert page.locator('#export-include-detection').is_checked()
    assert page.locator('#export-include-full-text').is_checked()
    page.locator('#export-include-detection').uncheck()
    page.locator('#export-include-full-text').uncheck()
    page.evaluate('exportPreferences={includeDetection:true,includeFullDocumentText:false};loadExportPreferences()')
    assert not page.locator('#export-include-detection').is_checked()
    assert not page.locator('#export-include-full-text').is_checked()
    # Theme and narrow width: section remains in pane and both labels clickable.
    page.evaluate("document.documentElement.dataset.theme='dark'")
    dark=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink')")
    page.evaluate("document.documentElement.dataset.theme='light'")
    light=page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ink')")
    assert dark!=light,(dark,light)
    page.set_viewport_size({'width':375,'height':740})
    for item in (a,b):
        bounds=item.bounding_box()
        assert bounds and 0<=bounds['x']<375 and bounds['x']+bounds['width']<=375, bounds
        item.check()
    assert a.is_checked() and b.is_checked()
    assert 'Reading data is always included.' not in details.inner_text() and 'Export never starts OCR.' not in details.inner_text()
    browser.close()
print('PASS | Chromium v397 export settings | defaults, four states, preference restore, dark/light, mobile, localization markup')
