#!/usr/bin/env python3
"""Offline Chromium/real IndexedDB round trip through production cache/export functions.
PDF.js and OCR worker are deliberately simulated; this is NOT a production
PDF open, live Tesseract-browser scan, or mathematical accuracy certification.
Optional env MATHREADER_AHLFORS_PDF validates real original PDF SHA/page count.
"""
from __future__ import annotations
import hashlib, http.server, json, os, re, shutil, socketserver, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
core=(root/'js/00-core.js').read_text(encoding='utf-8')
export=(root/'js/60-notes-bookmarks-data.js').read_text(encoding='utf-8')
def get(name, src=core):
    match=re.search(r'(?:async )?function '+re.escape(name)+r'\([\s\S]*?\n\}(?=\n)',src,re.M)
    assert match, f'cannot locate source function {name}'
    return match.group()
funcs=['jsonClone','idbRequest','openLocalDb','dbGet','dbPut','dbDelete','dbMetaGet','dbMetaSet',
       'equationMarginEvidenceCacheKey','equationMarginEvidenceRecords','persistEquationMarginOcrEvidence','loadEquationMarginOcrEvidence']
functions='\n'.join(get(name) for name in funcs)+'\n'+get('readingDataRawDetectionSnapshot',export)
ahlfors_pdf=os.getenv('MATHREADER_AHLFORS_PDF')
ahlfors_sha='970cda290270daa397d0bd5a06da4e423bb548d1556e71c1135f54fd637ac949'
ahlfors_key='sha256:'+ahlfors_sha
if ahlfors_pdf:
    import fitz
    with open(ahlfors_pdf,'rb') as f:
        assert hashlib.sha256(f.read()).hexdigest()==ahlfors_sha
    with fitz.open(ahlfors_pdf) as doc:
        assert len(doc)==172
# Actual observed Tesseract crop: original Ahlfors PDF p81 (4-12), right
# margin, approximate ratio from PDF source bbox. This is a local OCR proxy,
# NOT a result of the browser Tesseract.js worker.
setup=f'''<!doctype html><html><head><meta charset="utf-8"></head><body><script>
const LOCAL_DB_NAME='mathreader-local-v1', LOCAL_DB_VERSION=1, EQUATION_MARGIN_EVIDENCE_CACHE_VERSION=1;
let dbPromise=null, pdfDoc=null, currentFileKey=null;
let equationSupplementalOcrCache=new Map();
let manualIndexOcrPages=new Map(), documentOcrPages=new Map(), documentOcrActive=false;
const fakePage=(n)=>({{view:[0,0,1,1],getTextContent:()=>Promise.resolve({{items:[],styles:{{}}}})}});
async function nativePageTextData(sourceDoc, pageNum) {{return {{page:fakePage(pageNum), content:{{items:[],styles:{{}}}}}};}}
async function pageTextLines() {{return [];}}
{functions}
window.__test = {{
 enter(key,pages){{pdfDoc={{numPages:pages}};currentFileKey=key;equationSupplementalOcrCache=new Map();}},
 add(side,page,lines){{equationSupplementalOcrCache.set(`${{currentFileKey}}|${{side}}|${{page}}`,lines);}},
 getCacheSize(){{return equationSupplementalOcrCache.size}},
 clearMemory(){{equationSupplementalOcrCache=new Map()}},
 async persist(){{return persistEquationMarginOcrEvidence(pdfDoc,currentFileKey)}},
 async export(){{return readingDataRawDetectionSnapshot(pdfDoc,currentFileKey)}},
 async rawCache(){{return dbMetaGet(equationMarginEvidenceCacheKey())}},
 async corrupt(value){{return dbMetaSet(equationMarginEvidenceCacheKey(),value)}},
 async forget(){{return dbDelete('meta',equationMarginEvidenceCacheKey())}},
 async restore(){{return loadEquationMarginOcrEvidence(pdfDoc,currentFileKey)}},
 async dbNames(){{return (await openLocalDb()).objectStoreNames.length}},
}};
</script></body></html>'''
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body=setup.encode('utf-8')
        self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def log_message(self,*args): pass
class Server(socketserver.ThreadingTCPServer): allow_reuse_address=True
server=Server(('127.0.0.1',0),Handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
url=f'http://127.0.0.1:{server.server_address[1]}/'
measure={};checks=0
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
        context=browser.new_context();page=context.new_page();page.goto(url)
        page.evaluate('''async ([key])=>{__test.enter(key,172);__test.add('right',81,[{text:'(4-12)',ratio:0.557, xStartRatio:0.83,xEndRatio:0.93, parts:[]}]);
          __test.add('right',82,[{text:'TEST-SYNTHETIC-PAGE-82',ratio:0.42,xStartRatio:0.82,xEndRatio:0.92,parts:[]}]);
          if (!await __test.persist()) throw Error('Initial persist failed') }''',[ahlfors_key]);checks+=1
        first=page.evaluate('''async()=>{const t=performance.now();const e=await __test.export();return {ms:performance.now()-t,coverage:e.equationMarginOcrCoverage,count:e.pageCount,lines:e.pages[80].equationMarginOcr[0].lines}}''')
        assert first['coverage']['pagesWithEvidence']==2 and first['lines'][0]['ratio']==.557 and first['lines'][0]['text']=='(4-12)',first
        measure['ahlfors_export_ms']=round(first['ms'],1);checks+=1
        # Same-origin real tab reload preserves IndexedDB; no OCR code invoked.
        page.reload();page.evaluate('([key])=>__test.enter(key,172)',[ahlfors_key]);checks+=1
        second=page.evaluate('''async()=>{const e=await __test.export();return {count:e.equationMarginOcrCoverage.pagesWithEvidence,line:e.pages[80].equationMarginOcr[0].lines[0],memory:__test.getCacheSize()}}''')
        assert second['count']==2 and second['line']==first['lines'][0] and second['memory']==2,second;checks+=1
        # A different PDF with same page count is not allowed to inherit records.
        page.evaluate("__test.enter('sha256:another',172)")
        cross=page.evaluate('''async()=>{const e=await __test.export();return {count:e.equationMarginOcrCoverage.pagesWithEvidence,memory:__test.getCacheSize()}}''')
        assert cross=={'count':0,'memory':0},cross;checks+=1
        # A partial later pass cannot erase earlier observations.
        page.evaluate('([key])=>__test.enter(key,172)',[ahlfors_key])
        page.evaluate('''async()=>{__test.add('right',90,[{text:'TEST-SYNTHETIC-RESCAN',ratio:.22,xStartRatio:.82,xEndRatio:.94,parts:[]}]);
           if(!await __test.persist()) throw Error('partial persist failed');__test.clearMemory()}''')
        third=page.evaluate('''async()=>{const e=await __test.export();return [e.equationMarginOcrCoverage.pagesWithEvidence,e.pages[80].equationMarginOcr[0].lines[0].text,e.pages[89].equationMarginOcr[0].lines[0].text]}''')
        assert third==[3,'(4-12)','TEST-SYNTHETIC-RESCAN'],third;checks+=1
        original=page.evaluate('async()=>__test.rawCache()')
        # Invalid page and invalid duplicate identities fail atomically.
        for corruption in ({**original,'pageCount':171},{**original,'records':[{'page':300,'side':'right','lines':[]}]},
                           {**original,'records':[original['records'][0],original['records'][0]]}):
            result=page.evaluate('''async(v)=>{await __test.corrupt(v);__test.clearMemory();return [await __test.restore(),__test.getCacheSize()]}''',corruption)
            assert result==[False,0],result;checks+=1
        page.evaluate('async(v)=>{await __test.corrupt(v);await __test.forget();__test.clearMemory()}',original)
        result=page.evaluate('''async()=>[await __test.restore(),__test.getCacheSize()]''')
        assert result==[False,0],result;checks+=1
        measure['stored_records']=len(original['records'])
        measure['stored_json_bytes']=len(json.dumps(original,separators=(',',':')).encode('utf-8'))
        measure['full_export_peak_pages']=172
        browser.close()
finally:
    server.shutdown();server.server_close()
print(f'PASS | Chromium actual IndexedDB / production cache+export functions | {checks} assertions | {json.dumps(measure,sort_keys=True)}')
print('LIMIT | PDF.js and Tesseract.js browser workers mocked; actual original PDF not opened inside Chromium; formula accuracy not tested')
