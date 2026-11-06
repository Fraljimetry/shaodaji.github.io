// v374: cross-entry document-open exclusion and accurate failure result.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname,'../js/60-notes-bookmarks-data.js'),'utf8');
const begin=src.indexOf('let documentOpenBusy = false;');
const end=src.indexOf('// The History list is the only multi-document switcher.',begin);
assert.ok(begin>=0 && end>begin);
let readResolve;
let readCount=0;
let cachedReads=0;
let errors=[];
const file={name:'A.pdf',size:3,type:'application/pdf',lastModified:0,arrayBuffer(){readCount++;return new Promise(resolve=>{readResolve=resolve;});},slice(){return {}}};
const ctx=vm.createContext({
 console:{error(){}},t:(en)=>en,setLoading(){},showError:(s)=>errors.push(s),
 ensurePdfJs:async()=>({}),makeFileKey:()=>'',exactDocumentKey:async()=> 'key',
 dbGet:async()=>{cachedReads++;return null;},openPdfSource:async()=>{},
 fileInput:{value:''},documentOcrInteractionLocked:()=>false,
 renderLocalLibrary(){},
});
vm.runInContext(src.slice(begin,end),ctx);
const run=(code)=>vm.runInContext(code,ctx);
(async()=>{
 ctx.file=file;
 const first=run('openPdfFile(file)');
 assert.equal(readCount,1);
 assert.equal(await run('openCachedDocument("cached")'),false,'cached History blocked during active file read');
 assert.equal(await run('openPdfFile(file)'),false,'second file opener blocked');
 assert.equal(cachedReads,0,'blocked cached opener performs no IndexedDB read');
 readResolve(new Uint8Array([1,2,3]).buffer);
 assert.equal(await first,true,'success is reported accurately');
 assert.equal(run('documentOpenBusy'),false,'lock released on success');
 const rejectFile={...file,arrayBuffer:async()=>{throw Error('read failed')}};
 ctx.rejectFile=rejectFile;
 assert.equal(await run('openPdfFile(rejectFile)'),false,'file read failure reports false');
 assert.equal(run('documentOpenBusy'),false,'lock released on failure');
 assert.ok(errors.some(s=>s.includes('read failed')),'failure is visible');
 // Cached open failure must release the lock for the next attempt.
 assert.equal(await run('openCachedDocument("missing")'),false);
 assert.equal(run('documentOpenBusy'),false);
 console.log('OK: 11 concurrent-open and failure-return assertions');
})().catch(e=>{console.error(e);process.exitCode=1});
