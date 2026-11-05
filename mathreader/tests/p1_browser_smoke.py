#!/usr/bin/env python3
"""Isolated Chromium P1 UI smoke; real MathReader JS, simulated PDF backend.

Not production PDF.js, real OCR, or full cross-document content verification.
"""
from pathlib import Path
import json
import re
import shutil
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'js'
TEST_PROBE = r'''
const sourceId = 'sha256:'+'a'.repeat(64);
const targetId = 'sha256:'+'b'.repeat(64);
const testEntry = {number:17,label:'[17]',title:'A known paper',page:6,ratio:.5,citations:[]};
const localRecords = [
  {id:sourceId,name:'Source.pdf',localAvailable:true},
  {id:targetId,name:'Target.pdf',localAvailable:true}
];
const storage = new Map();
storage.set('files:'+sourceId,{blob:{}});
storage.set('files:'+targetId,{blob:{}});
const testNavigation=[];
const testFlushed=[];
window.__mathreaderP1 = Object.freeze({
  setup() {
    pdfDoc = {numPages:12};
    currentFileKey=sourceId; currentFileName='Source.pdf'; currentPage=4;
    cacheEnabledForCurrent=true;
    localLibrary=localRecords;
    confirmedBibliographyLinks=new Map();
    bibliographyEntries=[testEntry];
    structureIndexBuilding=false;
    bibliographyExpanded=new Set();
    crossDocumentReturnStack=[];crossDocumentBusy=false;
    // Simulate backend/document switching only; actual MathReader controls and
    // production bibliography rendering are still executed in real Chromium.
    dbGet=async(table,key)=>storage.get(`${table}:${key}`);
    dbMetaSet=async(key,value)=>{storage.set('meta:'+key,value);};
    dbMetaGet=async(key)=>storage.get('meta:'+key);
    flushCurrentDocumentSession=async()=>{testFlushed.push(currentFileKey);};
    snapshotDisplayAnchor=()=>({page:4,ratio:.625});
    openCachedDocument=async(id)=>{
      if (!storage.get('files:'+id)?.blob) return false;
      currentFileKey=id;currentFileName=id===sourceId?'Source.pdf':'Target.pdf';
      currentPage=id===sourceId?4:1;
      pdfDoc={numPages:12};
      bibliographyEntries=id===sourceId?[testEntry]:[];
      await loadConfirmedBibliographyLinks(id);
      renderBibliographyIndex();
      return true;
    };
    goToLocation=async(page,ratio,opts)=>{currentPage=page;testNavigation.push({page,ratio,opts});};
    showNavigationLandingCue=()=>{};
    document.getElementById('pdf-workspace')?.classList.remove('is-hidden');
    shell.classList.remove('left-collapsed');
    document.getElementById('contents-bibliography-section')?.classList.remove('is-collapsed');
    renderBibliographyIndex();
    updateCrossDocumentReturnButton();
  },
  state() {return {
    key:currentFileKey, link:confirmedBibliographyLinks.get(bibliographyLinkKey(testEntry))||null,
    returnDepth:crossDocumentReturnStack.length,busy:crossDocumentBusy,
    flushed:[...testFlushed],navigation:[...testNavigation],
    ocrLoading:mathOcrLoading,
    buttonHidden:crossDocumentReturnButton.classList.contains('is-hidden')
  };},
  invalidateTarget() {localRecords[1].localAvailable=false;renderBibliographyIndex();},
  removeTargetCache() {storage.delete('files:'+targetId);},
  async manualSwitchAwayAndBack() {
    // This is an isolated DOM test of the *actual* return-control update;
    // only the PDF backend is simulated.
    currentFileKey=sourceId;
    updateCrossDocumentReturnButton();
    currentFileKey=targetId;
    updateCrossDocumentReturnButton();
    currentFileKey=sourceId;
    await loadConfirmedBibliographyLinks(sourceId);
    bibliographyEntries=[testEntry];
    renderBibliographyIndex();
    updateCrossDocumentReturnButton();
  },
});
'''

def main():
    html=(ROOT/'index.html').read_text()
    html=re.sub(r'<script defer src="https://cdn\.jsdelivr\.net/npm/mathjax@3/es5/tex-chtml\.js"></script>', '', html)
    html=re.sub(r'<script type="module" src="mathreader\.js\?v=\d+"></script>', '', html)
    html=re.sub(r'<link rel="stylesheet" href="mathreader\.css\?v=\d+">', '', html)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('chromium-browser'),args=['--no-sandbox'])
        try:
            page=browser.new_page(viewport={'width':1024,'height':768})
            page.set_content(html)
            page.add_style_tag(content=(ROOT/'mathreader.css').read_text())
            manifest=re.findall(r"'(js/[^']+\.js)'",(ROOT/'mathreader.js').read_text())
            assert len(manifest)==10, len(manifest)
            body='\n'.join((ROOT/item).read_text() for item in manifest)+TEST_PROBE
            page.evaluate("""async (src) => {
                const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
                try {await import(url);} finally {URL.revokeObjectURL(url);}
            }""",body)
            page.evaluate('window.__mathreaderP1.setup()')
            checks=[]
            def check(name,condition):
                assert condition,name
                checks.append(name)
            check('no inline P1 buttons',page.locator('.bibliography-actions .bibliography-local-button').count()==0)
            main=page.locator('#bibliography-index .bibliography-jump').first
            check('no context menu on initial render',page.locator('.bibliography-context-menu').count()==0)
            main.click(force=True)
            check('ordinary click expands citations',main.get_attribute('aria-expanded')=='true')
            check('ordinary click leaves no context menu',page.locator('.bibliography-context-menu').count()==0)
            main.click(force=True)
            check('ordinary click collapses citations',main.get_attribute('aria-expanded')=='false')
            # Keyboard accessibility: the reference's own focusable button
            # supports the conventional context-menu shortcut.
            main.focus()
            page.keyboard.press('Shift+F10')
            check('Shift+F10 opens context menu',page.locator('.bibliography-context-action').count()==1)
            page.keyboard.press('Escape')
            check('Escape closes context menu',page.locator('.bibliography-context-menu').count()==0)
            check('Escape restores reference focus',main.evaluate('(e)=>e===document.activeElement'))
            main.focus()
            page.keyboard.press('ContextMenu')
            check('ContextMenu key opens actions',page.locator('.bibliography-context-action').count()==1)
            page.locator('#theme-button').click()
            check('outside click closes menu',page.locator('.bibliography-context-menu').count()==0)
            nodes_before=page.evaluate('document.querySelectorAll("*").length')
            for _ in range(20):
                main.click(button='right',force=True)
                page.keyboard.press('Escape')
            check('20 context-menu cycles leave no orphan DOM',
                  page.evaluate('document.querySelectorAll("*").length')==nodes_before)
            # Fixed-position menu is portaled to body; it must fit even if
            # the reference row is inside an overflow-clipped sidebar.
            page.evaluate('''() => document.querySelector('.bibliography-jump').dispatchEvent(
              new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:2000,clientY:1800}))''')
            box=page.locator('.bibliography-context-menu').bounding_box()
            check('context menu stays inside viewport at extreme coordinates',
                  box is not None and box['x'] >= 0 and box['y'] >= 0 and
                  box['x']+box['width'] <= 1024 and box['y']+box['height'] <= 768)
            page.keyboard.press('Escape')
            # Touch long press is the non-permanent mobile access route.
            page.evaluate('''() => document.querySelector('.bibliography-jump').dispatchEvent(
              new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',button:0,clientX:45,clientY:80}))''')
            page.wait_for_timeout(600)
            check('long-press opens context menu',page.locator('.bibliography-context-menu').count()==1)
            page.evaluate('''() => document.querySelector('.bibliography-jump').dispatchEvent(
              new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',button:0,clientX:45,clientY:80}))''')
            page.keyboard.press('Escape')
            page.locator('.bibliography-jump').click(button='right',force=True)
            check('right click does not expand citations',main.get_attribute('aria-expanded')=='false')
            check('local link offered in context menu',page.locator('.bibliography-context-action').filter(has_text='Link PDF').count()==1)
            check('no automatic linked paper',page.evaluate('window.__mathreaderP1.state().link') is None)
            # Click production Link PDF button then confirm from the actual DOM picker.
            page.locator('.bibliography-context-action').filter(has_text='Link PDF').click()
            picker=page.locator('.bibliography-link-picker')
            check('local chooser appears',picker.count()==1)
            check('only exact target offered',picker.locator('option').count()==2)
            check('confirm disabled until choice',picker.locator('button').filter(has_text='Link').is_disabled())
            picker.locator('select').select_option('sha256:'+'b'*64)
            picker.locator('button').filter(has_text='Link').click(force=True)
            page.wait_for_function("window.__mathreaderP1.state().link !== null")
            check('confirmed link durable',page.evaluate('window.__mathreaderP1.state().link')=='sha256:'+'b'*64)
            page.locator('.bibliography-jump').click(button='right',force=True)
            check('open enabled after confirmation',page.locator('.bibliography-context-action').filter(has_text='Open PDF').count()==1)
            check('linked menu offers relink and unlink',
                  page.locator('.bibliography-context-action').filter(has_text='Relink PDF').count()==1 and
                  page.locator('.bibliography-context-action').filter(has_text='Unlink').count()==1)
            page.locator('.bibliography-context-action').filter(has_text='Relink PDF').click()
            check('relink opens chooser',picker.count()==1)
            picker.locator('button').filter(has_text='Cancel').click()
            check('cancel relink preserves association',page.evaluate('window.__mathreaderP1.state().link')=='sha256:'+'b'*64)
            page.locator('.bibliography-jump').click(button='right',force=True)
            page.locator('.bibliography-context-action').filter(has_text='Unlink').click()
            page.wait_for_function('window.__mathreaderP1.state().link === null')
            check('explicit unlink persists',page.evaluate('window.__mathreaderP1.state().link') is None)
            page.locator('.bibliography-jump').click(button='right',force=True)
            page.locator('.bibliography-context-action').filter(has_text='Link PDF').click()
            picker.locator('select').select_option('sha256:'+'b'*64)
            picker.locator('button').filter(has_text='Link').click(force=True)
            page.wait_for_function('window.__mathreaderP1.state().link !== null')
            page.locator('.bibliography-jump').click(button='right',force=True)
            page.locator('.bibliography-context-action').filter(has_text='Open PDF').click()
            page.wait_for_function("window.__mathreaderP1.state().returnDepth===1")
            check('target exact identity',page.evaluate('window.__mathreaderP1.state().key')=='sha256:'+'b'*64)
            check('return control visible',not page.evaluate('window.__mathreaderP1.state().buttonHidden'))
            check('source flushed',page.evaluate('window.__mathreaderP1.state().flushed[0]')=='sha256:'+'a'*64)
            page.locator('#crossdoc-return').click(force=True)
            page.wait_for_function("window.__mathreaderP1.state().returnDepth===0")
            check('returns to source',page.evaluate('window.__mathreaderP1.state().key')=='sha256:'+'a'*64)
            check('exact ratio restored',page.evaluate('window.__mathreaderP1.state().navigation.at(-1).ratio')==.625)
            check('transient button hidden',page.evaluate('window.__mathreaderP1.state().buttonHidden'))
            check('no eager formula OCR',not page.evaluate('window.__mathreaderP1.state().ocrLoading'))
            page.locator('.bibliography-jump').click(button='right',force=True)
            page.locator('.bibliography-context-action').filter(has_text='Open PDF').click()
            page.wait_for_function('window.__mathreaderP1.state().returnDepth===1')
            page.evaluate('window.__mathreaderP1.manualSwitchAwayAndBack()')
            check('manual opening invalidates transient return stack',page.evaluate('window.__mathreaderP1.state().returnDepth')==0)
            check('obsolete Return remains hidden',page.evaluate('window.__mathreaderP1.state().buttonHidden'))
            page.evaluate('window.__mathreaderP1.invalidateTarget()')
            page.locator('.bibliography-jump').click(button='right',force=True)
            check('evicted target not openable',page.locator('.bibliography-context-action').filter(has_text='Open PDF').count()==0)
            check('relink instead',page.locator('.bibliography-context-action').filter(has_text='Relink PDF').count()==1)
            print(json.dumps({'status':'PASS','scope':'isolated Chromium UI; simulated PDF backend','assertions':len(checks),'checks':checks},indent=2))
        finally:
            browser.close()

if __name__=='__main__':main()
