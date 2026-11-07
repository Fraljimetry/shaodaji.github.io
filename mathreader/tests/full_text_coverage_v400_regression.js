'use strict';
// A full-text export covers every PDF page in the extraction pass, but a page
// without native text is not thereby OCR-transcribed or certified blank.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(path.join(__dirname,'../js/60-notes-bookmarks-data.js'),'utf8');
const re=/(?:async )?function readingDataRawDetectionSnapshot\([^]*?\n\}(?=\n)/m;
const m=src.match(re);assert.ok(m,'snapshot must exist');
const clone=(v,fb=null)=>{try{return JSON.parse(JSON.stringify(v));}catch{return fb}};
const d={numPages:4};let current=d;let key='sha256:fourpages';let checkCount=0;
const check=(val,msg)=>{assert.ok(val,msg);checkCount++};
const pages=[
  {str:'Theorem A\nEquation (1.1)'},
  {str:''},
  {str:'  \n  '},
  {str:'References\n[1] Book'}
];
const ctx={pdfDoc:d,currentFileKey:key,Map,JSON,String,Number,setTimeout,
  jsonClone:clone,
  manualIndexOcrPages:new Map(),
  documentOcrActive:false,documentOcrPages:new Map(),
  equationSupplementalOcrCache:new Map(),
  nativePageTextData:async (doc,n)=>({page:{view:[0,0,300,400]},content:{items:[{str:pages[n-1].str,hasEOL:true,transform:[1,0,0,1,2,2]}],styles:{}}}),
  pageTextLines:async(n)=>n===1?[{text:'Theorem A',ratio:0.1}]:[],
};
const run=vm.runInNewContext('('+m[0]+')',ctx);
(async()=>{
 const out=await run(d,key);
 check(out.pageCount===4&&out.pages.length===4&&out.complete===true,'all pages extracted without errors');
 check(out.nativeTextCoverage.pagesWithText===2,'native text count correct');
 check(JSON.stringify(out.nativeTextCoverage.pagesWithoutText)==='[2,3]','two native-textless pages reported');
 check(out.nativeTextCoverage.source==='pdf-text-layer','source provenance is native, not OCR');
 check(out.pages[0].nativePdf.rawText.includes('Theorem A'),'actual original text present');
 check(out.pages[1].nativePdf.rawText.length===1,'empty-page raw item retained faithfully');
 check(out.fullDocumentOcrStoredAt===null,'no fabricated full-document OCR');
 check(!src.match(/async function readingDataRawDetectionSnapshot\([^]*?\n\}/m)?.[0].includes('recognize('),'export does not run image OCR');
 // Failed extraction is not a successful transcription. Error page remains
 // indexed for troubleshooting and counts as missing native text.
 const original=ctx.nativePageTextData;
 ctx.nativePageTextData=(doc,n)=>n===4?Promise.reject(Error('native extraction failed')):original(doc,n);
 const partial=await run(d,key);
 check(partial.complete===false&&partial.errors.length===1,'failed extraction is explicitly partial');
 check(partial.nativeTextCoverage.pagesWithText===1,'errored native page never counted as text');
 check(JSON.stringify(partial.nativeTextCoverage.pagesWithoutText)==='[2,3,4]','failed page in missing-text coverage');
 // Never publish a stale export after switching PDFs.
 let unblock;
 ctx.nativePageTextData=()=>new Promise(res=>unblock=res);
 const pending=run(d,key);
 ctx.pdfDoc={numPages:4};ctx.currentFileKey='sha256:other';
 unblock({page:{view:[]},content:{items:[],styles:{}}});
 check(await pending===null,'late PDF read cannot be attributed to another document');
 console.log('PASS | v400 real export coverage regression | '+checkCount+' assertions');
})().catch(err=>{console.error(err);process.exitCode=1});
