// MathReader v358: confirmed local-PDF references and cross-document return.
// Node VM behavioral tests, not actual PDF.js/browser end-to-end acceptance.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'js/00-core.js'), 'utf8');
const source = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const reader = fs.readFileSync(path.join(root, 'js/60-notes-bookmarks-data.js'), 'utf8');
let checks = 0;
function check(ok, name) { assert.ok(ok, name); checks++; }
function extract(s, start, end) {
  const a=s.indexOf(start), b=s.indexOf(end,a);
  assert.ok(a>=0 && b>a, `missing code block ${start}`);
  return s.slice(a,b);
}
const uiCode=extract(source,'// v356 — Confirmed cross-paper links.','function renderBibliographyIndex() {');
const keyA='sha256:'+'a'.repeat(64), keyB='sha256:'+'b'.repeat(64), keyC='sha256:'+'c'.repeat(64);
const entry={label:'[17]', title:'A Historical Theorem (1988)', page:13};
const refB={label:'[3]', title:'Further Work', page:4};
const store=new Map();
const notices=[], errors=[], visited=[], opens=[], flushed=[];
let targetFailure=false, navigationFailure=false, pendingOpen=null, renderCalls=0, saveFailure=false;
const linkRows=[{id:keyA,name:'Paper A.pdf',localAvailable:true}, {id:keyB,name:'Paper B.pdf',localAvailable:true}, {id:keyC,name:'Paper C.pdf',localAvailable:true}];
for (const r of linkRows) store.set(`files:${r.id}`, {blob:{}});
const button={disabled:false,title:'',attrs:{},classList:{hidden:false,toggle(name,yes){if(name==='is-hidden')this.hidden=yes;}},setAttribute(k,v){this.attrs[k]=v;}};
const ctx=vm.createContext({
  Map, pdfDoc:{numPages:30},currentFileKey:keyA,currentFileName:'Paper A.pdf',
  cacheEnabledForCurrent:true, confirmedBibliographyLinks:new Map(),crossDocumentReturnStack:[],
  crossDocumentBusy:false, confirmedBibliographyWriteInFlight:false, localLibrary:linkRows,crossDocumentReturnButton:button,
  primaryCanvasWrap:{scrollTop:19},primaryPageSurface:{offsetHeight:200},currentPage:4,
  t:(en)=>en, showError:(x)=>errors.push(x), showNotice:(x)=>notices.push(x),
  dbGet:async(table,k)=>store.get(`${table}:${k}`),
  dbMetaGet:async(k)=>store.get(`meta:${k}`),
  dbMetaSet:async(k,v)=>{if(saveFailure) throw new Error('blocked IndexedDB'); store.set(`meta:${k}`,v);},
  renderBibliographyIndex:()=>{renderCalls++;},
  snapshotDisplayAnchor:()=>({page:4,ratio:0.625}),
  flushCurrentDocumentSession:async()=>{flushed.push(ctx.currentFileKey);},
  openCachedDocument:async(id)=>{
    opens.push(id);
    if(pendingOpen) await pendingOpen;
    if(targetFailure && id===keyB) return false;
    ctx.currentFileKey=id;
    ctx.currentFileName=linkRows.find(r=>r.id===id)?.name;
    ctx.pdfDoc={numPages:20};
    // Model the linked document loading its own saved map from IndexedDB.
    await vm.runInContext(`loadConfirmedBibliographyLinks(${JSON.stringify(id)})`,ctx);
    return true;
  },
  suppressReadingHistory:false,
  goToLocation:async(page,ratio,options)=>{if (navigationFailure) throw new Error("navigation failed"); visited.push({page,ratio,options});},
  showNavigationLandingCue:()=>{},
});
vm.runInContext(uiCode,ctx,{timeout:4000});
const run=(s)=>vm.runInContext(s,ctx,{timeout:4000});
async function main() {
  check(run('bibliographyLinkKey({label:" [17]  ",title:" A   Historical Theorem (1988) ",page:13})') === run('bibliographyLinkKey('+JSON.stringify(entry)+')'),'NFC and spaces normalized');
  check(run('bibliographyLinkKey({label:"",title:"title",page:1})')==='','unnumbered/ambiguous bibliography not linked');
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+')')===null,'no automatic bibliography-to-paper guesses');
  check(run('bibliographyLinkKey({label:"[1]",title:"",page:7})')!=="",'titleless OCR bibliography entry can be manually linked');
  check(run('bibliographyLinkKey({label:"[17]",title:"A Historical Theorem (1988)",page:14})')!==run('bibliographyLinkKey('+JSON.stringify(entry)+')'),'page disambiguates duplicate reference labels');
  check(run('normalizeConfirmedBibliographyLinks(null).size')===0,'malformed link metadata is ignored');
  check(run('normalizeConfirmedBibliographyLinks({version:2,links:[{key:"x",targetId:"y"}]}).size')===0,'unknown schema fails closed');
  check(run('normalizeConfirmedBibliographyLinks({version:1,links:[{key:"x",targetId:"y"},null,{key:"",targetId:"y"}]}).size')===1,'bad records filtered');
  const missing=await run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+',"sha256:missing")');
  check(missing===false && errors.length===1,'missing linked PDF rejected');
  store.delete(`files:${keyB}`);
  check(await run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+','+JSON.stringify(keyB)+')')===false,'missing cached bytes rejected');
  store.set(`files:${keyB}`,{blob:{}});
  check(await run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+','+JSON.stringify(keyB)+')')===true,'explicit confirmation persists');
  // A source-scoped IndexedDB write can finish after a manual document
  // switch. The write has committed and must not be reported as cancelled;
  // it must also never replace the active paper's in-memory link map.
  const previousSet=ctx.dbMetaSet;
  let finishCommit;
  ctx.dbMetaSet=async(k,v)=>{
    await new Promise(resolve=>{finishCommit=resolve;});
    store.set(`meta:${k}`,v);
  };
  const delayedCommit=run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+','+JSON.stringify(keyB)+')');
  for(let i=0;i<8 && !finishCommit;i++) await Promise.resolve();
  check(typeof finishCommit==='function','link write reached the pending IndexedDB commit');
  ctx.currentFileKey=keyB;
  ctx.confirmedBibliographyLinks=new Map();
  finishCommit();
  check(await delayedCommit===true,'a completed source-scoped link write reports committed, not cancelled');
  check(ctx.confirmedBibliographyLinks.size===0,'late source write does not mutate the active target paper');
  check(store.get(`meta:crossdoc-links:v1:${keyA}`).links[0].targetId===keyB,'late write persists only under source identity');
  ctx.currentFileKey=keyA;
  ctx.dbMetaSet=previousSet;
  await run('loadConfirmedBibliographyLinks('+JSON.stringify(keyA)+')');
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+').id')===keyB,'reopening source reloads the committed link');
  // An IndexedDB lookup that finishes after a manual PDF switch must not
  // mutate the old paper's confirmed map or persist stale link metadata.
  let resumeLookup;
  const previousGet = ctx.dbGet;
  ctx.dbGet=async(table,id)=>{
    if (table==='files' && id===keyC) await new Promise(resolve=>{resumeLookup=resolve;});
    return previousGet(table,id);
  };
  const pendingLink=run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+','+JSON.stringify(keyC)+')');
  check(run('confirmedBibliographyWriteInFlight')===true,'link save takes async lock immediately');
  check(await run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+',null)')===false,'simultaneous link edit refused');
  ctx.currentFileKey=keyB;
  resumeLookup();
  check(await pendingLink===false,'stale link lookup fails closed after paper change');
  check(run('confirmedBibliographyWriteInFlight')===false,'link save lock always released');
  check(!store.has(`meta:crossdoc-links:v1:${keyB}`),'stale edit never saved in target');
  ctx.currentFileKey=keyA;
  ctx.dbGet=previousGet;
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+').id')===keyB,'stale update preserves earlier confirmed target');
  // Leaving an in-memory cross-paper journey by opening an unrelated PDF
  // must not later resurrect an obsolete return button.
  ctx.crossDocumentReturnStack.push({sourceId:keyA,sourceName:'Paper A',targetId:keyB,page:2,ratio:.2});
  ctx.currentFileKey=keyC;
  run('updateCrossDocumentReturnButton()');
  check(ctx.crossDocumentReturnStack.length===0 && button.classList.hidden,'manual PDF switch drops stale return journey');
  ctx.currentFileKey=keyB;
  run('updateCrossDocumentReturnButton()');
  check(button.classList.hidden,'reopening old target does not resurrect stale return');
  ctx.currentFileKey=keyA;
  check(store.has(`meta:crossdoc-links:v1:${keyA}`),'stored under source identity only');
  check(!store.has(`meta:crossdoc-links:v1:${keyB}`),'link not written into target session');
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+').id')===keyB,'confirmed target exactly matches ID');
  check(run('bibliographyLinkTarget({label:"[17]",title:"Different paper",page:13})')===null,'title drift never resolves to wrong paper');
  check(renderCalls===1,'bibliography row refreshed after linking');
  saveFailure=true;
  check(await run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+',null)')===false,'persistence failure returns false');
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+').id')===keyB,'failed unlink preserves in-memory link');
  saveFailure=false;
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')')===true,'confirmed paper opened');
  check(ctx.currentFileKey===keyB,'current paper is target');
  check(ctx.crossDocumentReturnStack.length===1,'return path recorded');
  check(ctx.crossDocumentReturnStack[0].sourceId===keyA,'exact source identity retained');
  check(ctx.crossDocumentReturnStack[0].page===4 && ctx.crossDocumentReturnStack[0].ratio===.625,'exact source position retained');
  check(button.classList.hidden===false && button.disabled===false,'temporary Return control visible');
  check(flushed[0]===keyA,'source flushed before PDF switch');
  check(await run('returnToCrossDocumentSource()')===true,'return to original paper succeeds');
  check(ctx.currentFileKey===keyA && ctx.crossDocumentReturnStack.length===0,'return stack popped on success');
  check(visited.length===1 && visited[0].page===4 && visited[0].ratio===.625,'return restores exact page/ratio');
  check(visited[0].options.contextLead===false,'no artificial context offset on return');
  check(ctx.suppressReadingHistory===false,'reading trail suppression releases');
  check(button.classList.hidden===true,'temporary button hidden after return');
  // A failed anchor restoration must preserve the return path; otherwise the
  // reader would strand the user on the target without a reliable retry.
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')')===true,'retry regression opens target');
  navigationFailure=true;
  check(await run('returnToCrossDocumentSource()')===false,'failed anchor restoration detected');
  check(ctx.currentFileKey===keyB && ctx.crossDocumentReturnStack.length===1,'failed anchor keeps target and return history');
  check(ctx.suppressReadingHistory===false && ctx.crossDocumentBusy===false,'failed anchor releases temporary navigation flags');
  navigationFailure=false;
  check(await run('returnToCrossDocumentSource()')===true,'return can retry after anchor failure');
  check(ctx.currentFileKey===keyA && ctx.crossDocumentReturnStack.length===0,'successful retry consumes history');
  // Failed target loading keeps the confirmed link but does not invent a path.
  targetFailure=true;
  const before=ctx.crossDocumentReturnStack.length;
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')')===false,'unavailable target fails closed');
  check(ctx.currentFileKey===keyA && ctx.crossDocumentReturnStack.length===before,'failed jump leaves source and history intact');
  targetFailure=false;
  ctx.cacheEnabledForCurrent=false;
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')')===false,'uncached source refuses unsafe jump');
  ctx.cacheEnabledForCurrent=true;
  ctx.localLibrary=linkRows.map(r=>r.id===keyB?{...r,localAvailable:false}:r);
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+')')===null,'evicted target cannot be opened');
  ctx.localLibrary=linkRows;
  // Nested A -> B -> C and return C -> B -> A, with no speculative references.
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')')===true,'first nested switch');
  check(await run('updateConfirmedBibliographyLink('+JSON.stringify(refB)+','+JSON.stringify(keyC)+')')===true,'link second source independently');
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(refB)+')')===true,'second nested switch');
  check(ctx.crossDocumentReturnStack.length===2,'two-level return history');
  check(await run('returnToCrossDocumentSource()')===true && ctx.currentFileKey===keyB,'C -> B');
  check(await run('returnToCrossDocumentSource()')===true && ctx.currentFileKey===keyA,'B -> A');
  check(ctx.crossDocumentReturnStack.length===0,'all history consumed');
  // Concurrent triggers must not cause racing paper changes.
  let resume;
  pendingOpen = new Promise(resolve=>{resume=resolve;});
  const first=run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')');
  // The method becomes busy before awaiting the session flush / opener.
  check(await run('openConfirmedBibliographyTarget('+JSON.stringify(entry)+')')===false,'concurrent jump refused');
  resume();pendingOpen=null;
  check(await first===true,'original jump completes');
  check(await run('returnToCrossDocumentSource()')===true,'concurrency leaves functional return');
  // Unlink is explicit, local and reversible.
  check(await run('updateConfirmedBibliographyLink('+JSON.stringify(entry)+',null)')===true,'unlink confirmed');
  check(run('bibliographyLinkTarget('+JSON.stringify(entry)+')')===null,'removed links do not navigate');
  check(run('confirmedBibliographyLinks.size')===0,'source link map is empty after unlink');

  check(core.includes("dbDelete('meta', bibliographyLinkStorageKey(record.id))"),'forgetting a PDF also clears its confirmed source links');
  // Debounced session saves may never write the active document's data to an
  // unrelated destination after switching mid-timer or mid-IndexedDB read.
  const schedules=extract(core,'function scheduleDbSessionSave() {','\nfunction formatHistoryTime(timestamp) {');
  let currentTimer=null, gen=0, recordCalls=[], resolveGet;
  const db={A:{id:'A',session:{page:1},lastPage:1},B:{id:'B',session:{page:7},lastPage:7}};
  const mem=vm.createContext({
    cacheEnabledForCurrent:true,currentFileKey:'A',currentPage:6,pdfDoc:{numPages:10},
    sessionSaveTimer:null,sessionSaveInFlight:null,sessionWriteGeneration:0,
    snapshotSession:()=>({page:mem.currentPage,source:mem.currentFileKey}),
    setTimeout:(fn)=>{currentTimer=fn;return ++gen;},clearTimeout:()=>{currentTimer=null;},
    dbGet:async(_t,id)=>{recordCalls.push(id);return {...db[id]};},
    dbPut:async(_t,record)=>{db[record.id]=record;},
    refreshLocalLibrary:async()=>{},console,
    persistDocumentState:()=>vm.runInContext('scheduleDbSessionSave()',mem),
  });
  vm.runInContext(schedules,mem);
  vm.runInContext('scheduleDbSessionSave()',mem);
  check(typeof currentTimer==='function','debounced save scheduled');
  mem.currentFileKey='B';currentTimer();await Promise.resolve();await Promise.resolve();
  check(recordCalls.length===0,'timer cannot write to a different active document');
  mem.currentFileKey='A';mem.currentPage=8;
  vm.runInContext('scheduleDbSessionSave()',mem);
  await vm.runInContext('flushCurrentDocumentSession()',mem);
  check(db.A.session.page===8 && db.A.lastPage===8,'flush saves exact current state');
  check(db.B.session.page===7 && db.B.lastPage===7,'other document untouched');
  check(mem.sessionSaveTimer===null,'no delayed save remains after flush');
  // A delayed recovery snapshot must also be scoped to its source.
  const recoveryCode=extract(core,'function scheduleRecoverySnapshot() {','\nfunction pushUndo(');
  let recoveryWrites=0, fireRecovery=null;
  const recovery=vm.createContext({currentFileKey:'A',restoringSession:false,recoveryRestoreActive:false,
    recoverySnapshotTimer:null, clearTimeout:()=>{},setTimeout:(fn)=>{fireRecovery=fn;return 1;},
    recoveryStorageKey:()=>`key:${recovery.currentFileKey}`,
    durableRecoveryData:()=>({page:3}),recoveryFingerprint:()=> 'x',lastRecoveryFingerprint:'',
    recoverySnapshots:[],safeSet:()=>{recoveryWrites++;},renderRecoverySnapshots:()=>{},Date});
  vm.runInContext(recoveryCode,recovery);
  vm.runInContext('scheduleRecoverySnapshot()',recovery);
  recovery.currentFileKey='B';fireRecovery();
  check(recoveryWrites===0,'delayed recovery snapshots cannot leak to next document');
  console.log(`OK: ${checks} MathReader v358 cross-document and persistence assertions`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
