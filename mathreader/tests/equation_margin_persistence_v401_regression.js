'use strict';
// Compatibility gate: snapshots stored by v401/v402 must remain readable in
// v403, while a valid per-page journal entry wins over an older bulk record.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),core=fs.readFileSync(path.join(root,'js/00-core.js'),'utf8');
function fn(n){const m=core.match(new RegExp(`(?:async )?function ${n}\\([^]*?\\n\\}(?=\\n)`));assert.ok(m,n);return m[0]}
const names=['equationMarginEvidenceCacheKey','equationMarginPagePrefix','equationMarginPageKey',
'validEquationMarginLines','validEquationMarginPageRecord','boundedEquationMarginDbOperation','loadEquationMarginOcrEvidence'];
const source=`const EQUATION_MARGIN_EVIDENCE_CACHE_VERSION=1;const EQUATION_MARGIN_PAGE_CACHE_VERSION=2;\n`+
 names.map(fn).join('\n')+'\n({'+names.join(',')+'})';
let checks=0;const check=(val,msg)=>{assert.ok(val,msg);checks++};
(async()=>{
 const doc={numPages:3},key='sha256:a',store=new Map();
 const ctx={pdfDoc:doc,currentFileKey:key,equationSupplementalOcrCache:new Map(),
 equationMarginPersistedPageRefs:new Map(),Map,JSON,Number,Array,console,Promise,setTimeout,clearTimeout};
 ctx.dbMetaGet=async(k)=>store.get(k)??null;
 ctx.dbMetaEntriesByPrefix=async(prefix)=>[...store.entries()].filter(([k])=>k.startsWith(prefix)).map(([k,v])=>({key:k,value:v}));
 const api=vm.runInNewContext(source,ctx),legacyKey=api.equationMarginEvidenceCacheKey(key);
 check(legacyKey.endsWith(':sha256:a'),'v401 key unchanged');
 const rows=[{page:1,side:'left',lines:[{text:'(1.1)',ratio:.2}]},{page:2,side:'right',lines:[{text:'(1.2)',ratio:.4}]}];
 store.set(legacyKey,{version:1,pageCount:3,records:rows});
 check(await api.loadEquationMarginOcrEvidence(doc,key),'valid legacy records loaded');
 check(ctx.equationSupplementalOcrCache.size===2,'legacy page/side retained');
 check(ctx.equationSupplementalOcrCache.get(`${key}|left|1`)[0].text==='(1.1)','legacy OCR text recovered');
 // v2 wins on duplicate (same pdf identity, same side and page).
 const pageKey=api.equationMarginPageKey(key,'left',1);
 store.set(pageKey,{version:2,documentId:key,pageCount:3,page:1,side:'left',lines:[{text:'newer',ratio:.3}]});
 ctx.equationSupplementalOcrCache=new Map();
 check(await api.loadEquationMarginOcrEvidence(doc,key),'legacy and journal merge');
 check(ctx.equationSupplementalOcrCache.get(`${key}|left|1`)[0].text==='newer','v2 overrides stale legacy');
 check(ctx.equationSupplementalOcrCache.get(`${key}|right|2`)[0].text==='(1.2)','v1 fills missing journal page');
 ctx.equationSupplementalOcrCache=new Map();ctx.currentFileKey='sha256:b';ctx.pdfDoc={numPages:3};
 check(!await api.loadEquationMarginOcrEvidence(doc,key),'foreign doc blocked');
 check(ctx.equationSupplementalOcrCache.size===0,'foreign OCR never published');
 ctx.currentFileKey=key;ctx.pdfDoc=doc;store.delete(pageKey);
 for(const bad of [
 {version:1,pageCount:4,records:rows},
 {version:1,pageCount:3,records:[{page:2,side:'left',lines:[{}]}]},
 {version:1,pageCount:3,records:[rows[0],rows[0]]},
 {version:99,pageCount:3,records:rows},
 ]){
  store.set(legacyKey,bad);ctx.equationSupplementalOcrCache=new Map();
  check(!await api.loadEquationMarginOcrEvidence(doc,key),'malformed legacy cache rejected');
  check(ctx.equationSupplementalOcrCache.size===0,'no partial publication of malformed data');
 }
 console.log(`PASS | v401/v402 bulk OCR cache compatibility | ${checks} assertions`);
})().catch(e=>{console.error(e);process.exit(1)});
