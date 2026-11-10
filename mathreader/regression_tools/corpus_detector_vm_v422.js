#!/usr/bin/env node
'use strict';
// Native MathReader detector replay over page-span geometry extracted from an actual PDF.
// Source spans are extracted using PyMuPDF, NOT pdfjs-dist: compare actual PDF.js separately.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'..');
const file=process.argv[2]; if(!file)throw new Error('usage: node corpus_detector_vm_v422.js extracted.json');
const fixture=JSON.parse(fs.readFileSync(file,'utf8'));
const pdfPages=new Map(fixture.pages.map(p=>[p.page,p]));
const outlineSource=fs.readFileSync(path.join(dir,'js/40-outline-structure.js'),'utf8');
const resultsSource=fs.readFileSync(path.join(dir,'js/41-equations-bibliography.js'),'utf8');
const referenceMatch=outlineSource.match(/const STRUCTURE_REFERENCE_RE = ([^;]+);/);
const t0=Date.now();
const ctx={
 console:{log(){},info(){},warn(){},error(){}}, Map,Set,Date,Promise,setTimeout,
 document:{addEventListener(){}},pdfDoc:{numPages:fixture.pages.length}, currentFileKey:fixture.sha256,
 documentOcrActive:false,documentOcrPages:new Map(),manualIndexOcrPages:new Map(),equationSupplementalOcrCache:new Map(),
 sourceDocumentUsesOcr:()=>false,documentTextFeaturesAvailable:()=>true,
 MAX_INFERRED_OUTLINE_ENTRIES:1200,
 structureIndex:{},structureIndexBuilding:false,structureIndexBuildToken:0,
 structureEntries:[],bibliographyEntries:[],structureIndexVersion:0,
 buildStructureIndexButton:{disabled:false},structureEmpty:{classList:{remove(){}},textContent:''},
 bibliographyEmpty:{classList:{remove(){}},textContent:''},
 textCache:new Map(),lineCache:new Map(),pendingOutlineReselectKey:null,
 STRUCTURE_INDEX_VERSION:57,STRUCTURE_REFERENCE_RE:vm.runInNewContext(referenceMatch[1]),
 backlinkSnippet:t=>String(t).slice(0,40),persistDocumentState(){},rerenderReferenceLinks(){},t:s=>s,
 equationLabelIndex:null,equationAutomaticLabelIndex:null,equationImageAssistPromise:null,
 equationNumberingSide:'right',equationDetectionGeneration:1,
 equationDetectionProgress:{phase:'native'},equationIndexKnownCount:null,equationEdits:[],
 equationOcrPageConfidence:()=>null,equationDetectionNowMs:()=>Date.now(),
 updateEquationDetectionProgress(){},logEquationDetectionTiming(){},
 renderEquationIndex(){},applyEquationEdits:en=>en,
 renderStructureIndex(){},renderBibliographyIndex(){},
 refreshSelectionUI(){},
 nativePageTextData:async(_,n)=>({page:{view:pdfPages.get(n).view,getViewport:()=>({width:pdfPages.get(n).view[2],height:pdfPages.get(n).view[3]})},content:{items:pdfPages.get(n).items}}),
 async *orderedPrefetch(items,fn){for(const item of items)yield {item,value:await fn(item)};},
 findFirstRowInYBuckets(buckets,y,tol=2.2){for(const rows of buckets.values())for(const row of rows)if(Math.abs(row.y-y)<=tol)return row;return null;},
 addRowToYBuckets(buckets,row,bin=2.2){const k=Math.floor(row.y/bin),xs=buckets.get(k)||[];xs.push(row);buckets.set(k,xs);}
};
const sandbox=vm.createContext(ctx);
vm.runInContext(outlineSource,sandbox,{filename:'40-outline-structure.js',timeout:10000});
vm.runInContext(resultsSource,sandbox,{filename:'41-equations-bibliography.js',timeout:10000});
vm.runInContext('globalThis.getEq=buildEquationLabelIndex;globalThis.getOutline=detectOutlineFromTypography;globalThis.getResults=buildStructureIndex;renderEquationIndex=()=>{};renderStructureIndex=()=>{};renderBibliographyIndex=()=>{};rerenderReferenceLinks=()=>{};updateEquationDetectionProgress=()=>{};logEquationDetectionTiming=()=>{};',sandbox);
(async()=>{
 const stages={};
 let inferred=[];let eq=[];
 for(const [stage,fun] of [['structure',async()=>{inferred=await sandbox.getOutline();}],['results_and_bibliography',async()=>{await sandbox.getResults({force:true});}],['equations',async()=>{const index=await sandbox.getEq();eq=[...index.entries()].flatMap(([label,rows])=>rows.map(row=>({label,page:row.page,ratio:row.ratio,confidence:row.confidence})));}]]){
  const start=Date.now();try{await fun();stages[stage]={status:'PASS',duration_ms:Date.now()-start};}catch(e){stages[stage]={status:'ERROR',duration_ms:Date.now()-start,error:String(e.stack||e).slice(0,1600)};}
 }
 const res=sandbox.structureEntries||[],bib=sandbox.bibliographyEntries||[];
 let known=[];
 for(const p of fixture.pages){const txt=p.items.map(x=>x.str).join(' ');if(/\b(?:bibliography|references)\b/i.test(txt))known.push(p.page);}
 const output={filename:fixture.filename,sha256:fixture.sha256,pages:fixture.pages.length,native_chars:fixture.pages.reduce((n,p)=>n+p.items.reduce((x,z)=>x+z.str.length,0),0),stages,summary:{inferred_outline:inferred.length,results:res.length,bibliography:bib.length,equation_occurrences:eq.length,equation_labels:new Set(eq.map(x=>x.label)).size,bibliography_heading_pages:known,elapsed_ms:Date.now()-t0},
  outline:inferred.slice(0,200).map(x=>({page:x.page,title:x.title,ratio:x.ratio})),
  results:res.slice(0,300).map(x=>({page:x.page,label:x.label,ratio:x.ratio})),
  bibliography:bib.slice(0,300).map(x=>({page:x.page,label:x.label,number:x.number,ratio:x.ratio,title:String(x.title||'').slice(0,120)})),
  equations:eq.slice(0,500)};
 process.stdout.write(JSON.stringify(output)+'\n');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
