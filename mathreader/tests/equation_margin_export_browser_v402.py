#!/usr/bin/env python3
"""Chromium executes actual source export/persistence functions using an isolated
in-memory meta-store and mocked PDF text extraction. It does NOT test IndexedDB,
PDF.js, worker recognition, production reload, or accuracy.
"""
import re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
core=(root/'js/00-core.js').read_text(encoding='utf-8')
export=(root/'js/60-notes-bookmarks-data.js').read_text(encoding='utf-8')
def get(name,src=core):
    m=re.search(r'(?:async )?function '+re.escape(name)+r'\([\s\S]*?\n\}(?=\n)',src,re.M)
    assert m,name
    return m.group(0)
names=('jsonClone','equationMarginEvidenceCacheKey','equationMarginPagePrefix',
       'equationMarginPageKey','validEquationMarginLines','equationMarginEvidenceRecords',
       'validEquationMarginPageRecord','boundedEquationMarginDbOperation','warnEquationMarginStorageFailure',
       'writeEquationMarginPageRecord','persistEquationMarginOcrPage','persistEquationMarginOcrEvidence',
       'loadEquationMarginOcrEvidence')
src='\n'.join(get(name) for name in names)+'\n'+get('readingDataRawDetectionSnapshot',export)
html='''<html><head><meta charset="utf-8"></head><body><script>
const EQUATION_MARGIN_EVIDENCE_CACHE_VERSION=1, EQUATION_MARGIN_PAGE_CACHE_VERSION=2;
let pdfDoc=null, currentFileKey=null, equationSupplementalOcrCache=new Map();
let equationMarginPersistedPageRefs=new Map(),equationMarginStorageWarningKey=null,
    equationMarginStorageBlockedKey=null;
let manualIndexOcrPages=new Map(),documentOcrPages=new Map(),documentOcrActive=false;
const metadata=new Map();
async function dbMetaSet(k,v){metadata.set(k,structuredClone(v))}
async function dbMetaGet(k){return structuredClone(metadata.get(k)??null)}
async function dbMetaEntriesByPrefix(prefix){return [...metadata.entries()].filter(([k])=>k.startsWith(prefix)).map(([key,value])=>({key,value}))}
function showNotice(){} function t(en){return en}
async function nativePageTextData(doc,page){return {page:{view:[0,0,1,1]},content:{items:[],styles:{}}}}
async function pageTextLines(){return []}
'''+src+'''
const api={
 enter(k,n){pdfDoc={numPages:n};currentFileKey=k;equationSupplementalOcrCache=new Map();equationMarginPersistedPageRefs=new Map();equationMarginStorageBlockedKey=null},
 add(side,p,lines){equationSupplementalOcrCache.set(`${currentFileKey}|${side}|${p}`,lines)},
 async save(){return persistEquationMarginOcrEvidence(pdfDoc,currentFileKey)},
 async export(){return readingDataRawDetectionSnapshot(pdfDoc,currentFileKey)},
 async corrupt(x){metadata.set(equationMarginPageKey(currentFileKey,'right',81),x)},
 async forget(){const prefix=equationMarginPagePrefix(currentFileKey);for(const key of [...metadata.keys()])if(key.startsWith(prefix))metadata.delete(key);metadata.delete(equationMarginEvidenceCacheKey())},
 clear(){equationSupplementalOcrCache=new Map();equationMarginPersistedPageRefs=new Map()},
 size(){return equationSupplementalOcrCache.size}
};
window.api=api;
</script></body></html>'''
checks=0
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
    page=browser.new_page();page.set_content(html)
    actual=page.evaluate('''async()=>{
      api.enter('sha256:ahlfors',172);
      api.add('right',81,[{text:'(4-12)',ratio:0.557,xStartRatio:.83,xEndRatio:.93,parts:[]}]);
      if(!await api.save())throw Error('save');
      const initial=await api.export();
      api.enter('sha256:ahlfors',172);const reopen=await api.export();
      const preserved=reopen.pages[80].equationMarginOcr[0].lines[0];
      api.enter('sha256:other-pdf',172);const other=await api.export();
      api.enter('sha256:ahlfors',172);
      api.add('right',90,[{text:'(5-1)',ratio:.2,parts:[]}]);await api.save();api.clear();
      const partial=await api.export();
      await api.corrupt({version:2,pageCount:172,documentId:'sha256:foreign',page:81,side:'right',lines:[]});api.clear();
      const corrupt=await api.export();
      await api.forget();api.clear();const forgotten=await api.export();
      return {initial:initial.equationMarginOcrCoverage.pagesWithEvidence,preserved,
        firstDurability:initial.equationMarginOcrCoverage.persistence,
        reopenDurability:reopen.equationMarginOcrCoverage.persistence,
        reopen:reopen.equationMarginOcrCoverage.pagesWithEvidence,
        other:other.equationMarginOcrCoverage.pagesWithEvidence,
        partial:partial.equationMarginOcrCoverage.pagesWithEvidence,
        corrupt:corrupt.equationMarginOcrCoverage.pagesWithEvidence,
        forgotten:forgotten.equationMarginOcrCoverage.pagesWithEvidence}
    }''')
    assert actual['initial']==1,actual;checks+=1
    assert actual['firstDurability']=='verified' and actual['reopenDurability']=='verified',actual;checks+=1
    assert actual['reopen']==1 and actual['preserved']['ratio']==.557 and actual['preserved']['text']=='(4-12)',actual;checks+=1
    assert actual['other']==0,actual;checks+=1
    assert actual['partial']==2,actual;checks+=1
    assert actual['corrupt']==1,actual;checks+=1
    assert actual['forgotten']==0,actual;checks+=1
    browser.close()
print(f'PASS | Chromium v403 page-journal export/reopen simulation | {checks} assertions')
print('LIMIT | in-memory IndexedDB mock, PDF.js mock, no live OCR or production navigation')
