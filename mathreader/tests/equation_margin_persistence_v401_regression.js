'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const exportSource = fs.readFileSync(path.join(root, 'js/60-notes-bookmarks-data.js'), 'utf8');
const eqSource = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
function fn(name, src=core) {const m=src.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`,'m'));assert.ok(m, name);return m[0];}
const helperNames=['equationMarginEvidenceCacheKey', 'equationMarginEvidenceRecords', 'persistEquationMarginOcrEvidence', 'loadEquationMarginOcrEvidence'];
const source=`const EQUATION_MARGIN_EVIDENCE_CACHE_VERSION=1;\n${helperNames.map(n=>fn(n)).join('\n')}\n({${helperNames.join(',')}})`;
let checks=0;function check(cond,msg){assert.ok(cond,msg);checks++}
function fixture() {
  const doc={numPages:3};const stored=new Map();
  const ctx={pdfDoc:doc,currentFileKey:'sha256:a',
    equationSupplementalOcrCache:new Map([['sha256:a|left|1',[{text:'(1.1)',ratio:0.2}]],['sha256:a|right|2',[{text:'(2.1)',ratio:0.8}]],['sha256:b|left|1',[{text:'FOREIGN'}]], ['sha256:a|left|99',[{text:'INVALID'}]],['sha256:a|left|3',Promise.resolve([])]]),
    dbMetaSet:async(k,v)=>{stored.set(k, JSON.parse(JSON.stringify(v)));},
    dbMetaGet:async(k)=>stored.get(k),console,Map,Number,JSON};
  return {doc,ctx,stored,api:vm.runInNewContext(source,ctx)};
}
(async()=>{
  {
    const {ctx,doc,stored,api}=fixture();
    check(api.equationMarginEvidenceCacheKey('sha256:a').endsWith(':sha256:a'),'exact PDF keyed cache');
    check(api.equationMarginEvidenceRecords('sha256:a',3).length===2,'only completed, in-range lines selected');
    check(await api.persistEquationMarginOcrEvidence(doc,'sha256:a'),'save completed evidence');
    const value=stored.get(api.equationMarginEvidenceCacheKey('sha256:a'));
    check(value.version===1&&value.pageCount===3&&value.records.length===2,'versioned, page-count checked evidence');
    check(!JSON.stringify(value).includes('FOREIGN')&&!JSON.stringify(value).includes('INVALID'),'foreign/out-of-range data absent');
    ctx.equationSupplementalOcrCache=new Map();
    check(await api.loadEquationMarginOcrEvidence(doc,'sha256:a'),'reopen restores stored margin OCR');
    check(ctx.equationSupplementalOcrCache.get('sha256:a|left|1')[0].text==='(1.1)','original observed text restored');
    check(ctx.equationSupplementalOcrCache.get('sha256:a|right|2')[0].text==='(2.1)','side and page retained');
    check(ctx.equationSupplementalOcrCache.size===2,'no inferred or extra rows created');
    ctx.equationSupplementalOcrCache.set('sha256:a|left|1',Promise.resolve([]));
    await api.loadEquationMarginOcrEvidence(doc,'sha256:a');
    check(typeof ctx.equationSupplementalOcrCache.get('sha256:a|left|1').then==='function','live in-progress OCR never overwritten');
    ctx.equationSupplementalOcrCache=new Map([['sha256:a|right|3',[{text:'(3.1)',ratio:0.7}]]]);
    check(await api.persistEquationMarginOcrEvidence(doc,'sha256:a'),'second partial OCR batch persists');
    const merged=stored.get(api.equationMarginEvidenceCacheKey('sha256:a'));
    check(merged.records.length===3,'later partial batch retains previously stored page evidence');
    check(merged.records.some(r=>r.page===1&&r.side==='left'&&r.lines[0].text==='(1.1)'),'old page evidence retained');
    check(merged.records.some(r=>r.page===3&&r.lines[0].text==='(3.1)'),'new page evidence persisted');
  }
  {
    const {ctx,doc,api,stored}=fixture();
    await api.persistEquationMarginOcrEvidence(doc,'sha256:a');
    ctx.equationSupplementalOcrCache=new Map();
    const original=ctx.dbMetaGet;let release;
    ctx.dbMetaGet=()=>new Promise(r=>{release=r});
    const pending=api.loadEquationMarginOcrEvidence(doc,'sha256:a');
    ctx.currentFileKey='sha256:b';ctx.pdfDoc={numPages:3};release(await original(api.equationMarginEvidenceCacheKey('sha256:a')));
    check(await pending===false,'late IndexedDB reply cannot cross documents');
    check(ctx.equationSupplementalOcrCache.size===0,'wrong-document evidence not published');
    const newDoc=ctx.pdfDoc;
    ctx.dbMetaGet=original; ctx.currentFileKey='sha256:a';
    check(await api.loadEquationMarginOcrEvidence(newDoc,'sha256:a'),'same document key + compatible identity accepted for current PDF');
  }
  {
    const {ctx,doc,api,stored}=fixture();await api.persistEquationMarginOcrEvidence(doc,'sha256:a');
    const key=api.equationMarginEvidenceCacheKey('sha256:a');const original=stored.get(key);
    for(const bad of [
      {...original,pageCount:2}, {...original,version:99},
      {...original,records:[{page:4,side:'left',lines:[]}]},
      {...original,records:[{page:1,side:'unknown',lines:[]}]},
      {...original,records:[{page:1,side:'left',lines:[{value:'missing text'}]}]},
      {...original,records:[{page:1,side:'left',lines:[]},{page:1,side:'left',lines:[]}]}
    ]) {
      stored.set(key,bad);ctx.equationSupplementalOcrCache=new Map();
      check(await api.loadEquationMarginOcrEvidence(doc,'sha256:a')===false,'malformed cache rejected');
      check(ctx.equationSupplementalOcrCache.size===0,'malformed cache fails closed without partial mutations');
    }
  }
  check(exportSource.includes('await loadEquationMarginOcrEvidence(sourceDoc, sourceKey)'), 'full-text export reads persisted evidence');
  check(exportSource.includes('if (pdfDoc !== sourceDoc || currentFileKey !== sourceKey) return null'), 'export validates identity after async read');
  check(eqSource.includes('await persistEquationMarginOcrEvidence(sourceDoc, sourceKey)'), 'OCR completion persists page observations');
  check(core.includes("dbDelete('meta', equationMarginEvidenceCacheKey(record.id))"), 'Forget deletes private margin evidence');
  check(!fn('loadEquationMarginOcrEvidence').includes('recognize('),'restoring observations never invokes image OCR');
  console.log('PASS | v401 margin OCR evidence persistence | '+checks+' assertions');
})().catch(e=>{console.error(e);process.exit(1)});
