'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(root,'js/00-core.js'),'utf8');
const eq = fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const exp = fs.readFileSync(path.join(root,'js/60-notes-bookmarks-data.js'),'utf8');
function extract(name) {
  const m = core.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}(?=\\n)`, 'm'));
  assert.ok(m, `Function missing: ${name}`);return m[0];
}
const names=['equationMarginEvidenceCacheKey','equationMarginPagePrefix','equationMarginPageKey',
'validEquationMarginLines','equationMarginEvidenceRecords','validEquationMarginPageRecord','boundedEquationMarginDbOperation','warnEquationMarginStorageFailure',
'writeEquationMarginPageRecord','persistEquationMarginOcrPage','persistEquationMarginOcrEvidence',
'loadEquationMarginOcrEvidence','importedEquationMarginRecords','restoreImportedEquationMarginEvidence'];
const code=`const EQUATION_MARGIN_EVIDENCE_CACHE_VERSION=1; const EQUATION_MARGIN_PAGE_CACHE_VERSION=2;\n`+
  names.map(extract).join('\n')+'\n({'+names.join(',')+'})';
let passed=0;
function check(condition, message){assert.ok(condition,message);passed++;}
function fixture(){
  const doc={numPages:172};
  const id='sha256:970cda290270daa397d0bd5a06da4e423bb548d1556e71c1135f54fd637ac949';
  const store = new Map(), log=[];
  const context={pdfDoc:doc,currentFileKey:id,equationSupplementalOcrCache:new Map(),
    equationMarginPersistedPageRefs:new Map(),equationMarginStorageWarningKey:null,equationMarginStorageBlockedKey:null,
    console:{warn(...items){log.push(items)}},showNotice(s){log.push(['NOTICE',s])},
    t:(en)=>en,Map,Number,JSON,Array,String,Promise,setTimeout,clearTimeout};
  context.dbMetaSet=async(k,v)=>store.set(k,{key:k,value:structuredClone(v)});
  context.dbMetaGet=async(k)=>structuredClone(store.get(k)?.value??store.get(k)??null);
  context.dbMetaEntriesByPrefix=async(prefix)=>[...store.entries()].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>value);
  const api=vm.runInNewContext(code,context);
  return {id,doc,context,store,log,api};
}
function record(page,side,text){return {page,side,lines:[{text,ratio:0.557,xStartRatio:0.80,xEndRatio:0.92,parts:[{start:0,end:text.length,xStartRatio:0.80,xEndRatio:0.92}]}]};}
(async()=>{
  const {id,doc,context,store,log,api}=fixture();
  const old=record(1,'right','JANTS');
  const exam=record(81,'right','(4-12)');
  const last=record(172,'right','');
  context.equationSupplementalOcrCache.set(`${id}|right|1`,old.lines);
  context.equationSupplementalOcrCache.set(`${id}|right|81`,exam.lines);
  context.equationSupplementalOcrCache.set(`${id}|right|172`,last.lines);
  check(await api.persistEquationMarginOcrPage(doc,id,1,'right',old.lines),'first page committed');
  check(await api.persistEquationMarginOcrPage(doc,id,81,'right',exam.lines),'target page committed');
  check(await api.persistEquationMarginOcrPage(doc,id,172,'right',last.lines),'last page committed');
  check(store.size===3,'three independent IndexedDB records, not one bulk snapshot');
  check(!store.has(api.equationMarginEvidenceCacheKey(id)),'v401 monolithic snapshot not written');
  check(store.get(api.equationMarginPageKey(id,'right',81)).value.lines[0].text==='(4-12)','page text and geometry persisted');
  context.equationSupplementalOcrCache=new Map(); context.equationMarginPersistedPageRefs=new Map();
  check(await api.loadEquationMarginOcrEvidence(doc,id),'reloaded from per-page storage');
  check(context.equationSupplementalOcrCache.size===3,'all complete records survive simulated reopen');
  check(context.equationSupplementalOcrCache.get(`${id}|right|81`)[0].xStartRatio===0.8,'original coordinates retained');
  check(context.equationMarginPersistedPageRefs.size===3,'reloaded pages already acknowledged: no redundant rewrite');
  const noWrites=context.dbMetaSet;
  context.dbMetaSet=async()=>{throw Error('Unexpected rewrite')};
  check(await api.persistEquationMarginOcrEvidence(doc,id),'same observed references do not rewrite recovered evidence');
  context.dbMetaSet=noWrites;
  const newer=record(82,'right','(4-13)');
  context.equationSupplementalOcrCache.set(`${id}|right|82`,newer.lines);
  check(await api.persistEquationMarginOcrPage(doc,id,82,'right',newer.lines),'interrupted new scan has immediately durable page');
  context.equationSupplementalOcrCache=new Map(); context.equationMarginPersistedPageRefs=new Map();
  check(await api.loadEquationMarginOcrEvidence(doc,id),'restores after interrupted scan');
  check(context.equationSupplementalOcrCache.size===4,'previous and current page retained');
  // Simulate real silent v402 write failure. A page must not be acknowledged or
  // described as durable, and the user must receive one nonblocking warning.
  const failed=record(83,'right','(4-14)');
  context.dbMetaSet=async()=>{throw new Error('QuotaExceededError')};
  check(!await api.persistEquationMarginOcrPage(doc,id,83,'right',failed.lines),'failed write surfaces false');
  check(!context.equationMarginPersistedPageRefs.has(`${id}|right|83`),'failed record is not acknowledged');
  check(log.some(x=>x[0]==='NOTICE'),'user-visible storage failure reported');
  const warningCount=log.filter(x=>x[0]==='NOTICE').length;
  check(!await api.persistEquationMarginOcrPage(doc,id,84,'right',failed.lines),'later failure still detected');
  check(log.filter(x=>x[0]==='NOTICE').length===warningCount,'avoid repetitive storage warning');
  context.dbMetaSet=noWrites;
  context.equationMarginStorageBlockedKey=null;
  // Verify read-after-write: a store that silently discards writes must fail.
  context.dbMetaSet=async()=>{};
  check(!await api.persistEquationMarginOcrPage(doc,id,85,'right',failed.lines),'discarded write not considered durable');
  context.dbMetaSet=noWrites;
  context.equationMarginStorageBlockedKey=null;
  // Legacy v401/402 snapshot remains readable even when v2 journal is partial.
  const legacy=record(10,'left','(2.3)');
  store.set(api.equationMarginEvidenceCacheKey(id),{key:api.equationMarginEvidenceCacheKey(id),
      value:{version:1,pageCount:172,records:[legacy]}});
  context.equationSupplementalOcrCache=new Map();context.equationMarginPersistedPageRefs=new Map();
  check(await api.loadEquationMarginOcrEvidence(doc,id),'legacy snapshot can fill missing v2 pages');
  check(context.equationSupplementalOcrCache.has(`${id}|left|10`),'legacy evidence preserved');
  // Corrupt page does not discard valid pages; cannot contaminate a different PDF.
  store.set(api.equationMarginPageKey(id,'left',42), {key:api.equationMarginPageKey(id,'left',42),
    value:{version:2,pageCount:172,documentId:'sha256:foreign',page:42,side:'left',lines:[{text:'FOREIGN'}]}});
  context.equationSupplementalOcrCache=new Map();context.equationMarginPersistedPageRefs=new Map();
  check(await api.loadEquationMarginOcrEvidence(doc,id),'corrupted page ignored while healthy ones survive');
  check(!context.equationSupplementalOcrCache.has(`${id}|left|42`),'corrupt foreign payload rejected');
  context.currentFileKey='sha256:another';context.pdfDoc={numPages:172};context.equationSupplementalOcrCache=new Map();
  check(!await api.loadEquationMarginOcrEvidence(doc,id),'late different-document load rejected');
  check(context.equationSupplementalOcrCache.size===0,'no foreign-document contamination');
  context.pdfDoc=doc; context.currentFileKey=id;
  // Recover first user export via exact SHA, then reload without recognizing OCR.
  const pages=Array.from({length:172},(_,i)=>({page:i+1}));
  pages[79].equationMarginOcr=[record(80,'right','(4-11)')].map(({side,lines})=>({side,lines}));
  const payload={document:{id,name:'Ahlfors-Conformal-Invariants.pdf',pages:172},
    fullDocumentText:{pageCount:172,pages}};
  check(api.importedEquationMarginRecords(payload,id,172).length===1,'exported 172-page data parsed');
  check(api.importedEquationMarginRecords({document:{id:'old-legacy'},
    fullDocumentText:{pageCount:172,pages:Array.from({length:172},(_,i)=>({page:i+1}))}},id,172).length===0,
    'older full-text import with no margin evidence remains compatible');
  check((await api.restoreImportedEquationMarginEvidence(payload,id,172)).ok,'exact original export restores unseen evidence');
  check(store.has(api.equationMarginPageKey(id,'right',80)),'new imported observation stored');
  const different={...payload,document:{...payload.document,id:'sha256:foreign'}};
  check(api.importedEquationMarginRecords(different,id,172)===null,'matching filename/pages cannot bypass exact SHA identity');
  const corrupt={...payload,fullDocumentText:{...payload.fullDocumentText,
    pages:pages.map((x,i)=>i===79?{page:80,equationMarginOcr:[{side:'right',lines:[{junk:1}]}]}:x)}};
  check(api.importedEquationMarginRecords(corrupt,id,172)===null,'malformed imported OCR text refused');
  const original=store.get(api.equationMarginPageKey(id,'right',81));
  const replace=JSON.parse(JSON.stringify(payload));
  replace.fullDocumentText.pages[80].equationMarginOcr=[{side:'right',lines:record(81,'right','INCORRECT OVERRIDE').lines}];
  check((await api.restoreImportedEquationMarginEvidence(replace,id,172)).ok,'import succeeds without erasing current evidence');
  check(JSON.stringify(store.get(api.equationMarginPageKey(id,'right',81)))===JSON.stringify(original),'previous verified page wins over older import');
  // Source integration: export must verify durability; stop/forget/worker existing semantics preserved.
  check(eq.includes('await persistEquationMarginOcrPage(sourceDoc, sourceKey, pageNum, side, lines)'), 'OCR commits each completed page');
  check(exp.includes("persistence: evidencePersistence"),'export states persistence verification');
  check(exp.includes('await restoreImportedEquationMarginEvidence(payload, sourceKey, sourceDoc.numPages)'), 'existing-document import restores OCR evidence');
  check(exp.includes('await restoreImportedEquationMarginEvidence(payload, importedId, Number(payload.document?.pages || 0))'), 'history import also restores evidence');
  check(core.includes('await dbMetaDeleteByPrefix(equationMarginPagePrefix(record.id))'), 'Forget removes page records');
  check(exp.includes('await loadEquationMarginOcrEvidence(pdfDoc, currentFileKey);'),'normal open reads persistent pages');
  console.log(`PASS | v403 per-page OCR journal + import recovery | ${passed} assertions`);
})().catch(e=>{console.error(e);process.exit(1)});
