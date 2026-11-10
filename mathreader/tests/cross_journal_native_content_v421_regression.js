#!/usr/bin/env node
'use strict';
// One complete, user-exported 12-page PDF.js native-text document. This is a
// source-level integration test, not an assertion that 36 other journal PDFs ran.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');
const content = JSON.parse(source('regression/fixtures/stoc25_content_lines_v421.json'));
const native = JSON.parse(source('regression/fixtures/stoc25_native_equations_v420.json'));
assert.equal(content.document.id.replace(/^sha256:/, ''), native.pdfSha256, 'full-source geometry and native item fixture must have same PDF SHA-256');
const textPages = new Map(content.pages.map(p => [p.page,p.lines]));
const pdfPages = new Map(native.nativePdfPages.map(p => [p.page,p]));
const outlineSource = source('js/40-outline-structure.js');
const resultsSource = source('js/41-equations-bibliography.js');
const referenceMatch = outlineSource.match(/const STRUCTURE_REFERENCE_RE = ([^;]+);/);
assert.ok(referenceMatch, 'real Structure reference expression exists');
const quiet = {log(){},info(){},warn(){},error:console.error};
const context = vm.createContext({
 console:quiet,Map,Set,Date,Promise,setTimeout,
 document:{addEventListener(){}},pdfDoc:{numPages:12},
 currentFileKey:'native-stoc-2025',documentOcrActive:false,documentOcrPages:new Map(),
 sourceDocumentUsesOcr:()=>false,documentTextFeaturesAvailable:()=>true,
 MAX_INFERRED_OUTLINE_ENTRIES:1200,
 nativePageTextData:async(_,n)=>({page:{getViewport:()=>({width:pdfPages.get(n).view[2],height:pdfPages.get(n).view[3]})},content:{items:pdfPages.get(n).items}}),
 async *orderedPrefetch(items,fn){for(const item of items)yield {item,value:await fn(item)};},
 async suppliedTextLines(n){return textPages.get(n)||[];},
 structureIndex:{},structureIndexBuilding:false,structureIndexBuildToken:0,
 structureEntries:[],bibliographyEntries:[],structureIndexVersion:0,
 buildStructureIndexButton:{disabled:false},structureEmpty:{classList:{remove(){}},textContent:''},
 bibliographyEmpty:{classList:{remove(){}},textContent:''},
 textCache:new Map(),lineCache:new Map(),pendingOutlineReselectKey:null,
 STRUCTURE_INDEX_VERSION:57,STRUCTURE_REFERENCE_RE:vm.runInNewContext(referenceMatch[1]),
 backlinkSnippet:t=>t.slice(0,40),persistDocumentState(){},rerenderReferenceLinks(){},t:s=>s,
 findFirstRowInYBuckets(buckets,y,tol=2){for(const rows of buckets.values())for(const row of rows)if(Math.abs(row.y-y)<=tol)return row;return null;},
 addRowToYBuckets(buckets,row,bin=4){const k=Math.floor(row.y/bin),xs=buckets.get(k)||[];xs.push(row);buckets.set(k,xs);},
});
vm.runInContext(outlineSource,context,{filename:'40-outline-structure.js',timeout:12000});
vm.runInContext(resultsSource,context,{filename:'41-equations-bibliography.js',timeout:12000});
vm.runInContext('pageTextLines=suppliedTextLines;renderStructureIndex=()=>{};renderBibliographyIndex=()=>{};rerenderReferenceLinks=()=>{};',context);
(async()=>{
 const outline=await context.detectOutlineFromTypography();
 assert.equal(outline.length,14,'do not lose existing 14 detected Structure headings');
 const page4=outline.filter(x=>x.page===4).map(x=>x.title.match(/^2\.\d+/)?.[0]);
 assert.deepEqual(Array.from(page4),['2.1','2.2','2.3','2.4'],'two-column contents follow left column then right column');
 assert.ok(outline.findIndex(x=>x.title.startsWith('2.5'))<outline.findIndex(x=>x.title.startsWith('3 Characterization')),'column order across a page');
 await context.buildStructureIndex({force:true});
 const results=context.structureEntries;
 assert.equal(results.length,29,'29 mathematically located Results declarations, not 23');
 const labels=results.map(r=>r.label);
 for(const name of ['Theorem 1.3','Lemma 2.4','Claim 2.7','Lemma 2.8','Definition 2.14','Lemma 3.9','Lemma 4.3','Claim 4.1']){
  assert.ok(labels.includes(name),`${name} printed declaration must not be lost`);
 }
 for(const r of results){
  assert.ok(r.page>=1&&r.page<=12 && r.ratio>=0 && r.ratio<=1,`navigation range: ${r.label}`);
  assert.ok(!(/Lemma 2\.9/.test(r.title)&&/Definition 2\.14/.test(r.title)),'separate-column Results titles must not merge');
 }
 const selected=results.filter(r=>r.page===4).map(r=>r.label);
 assert.deepEqual(Array.from(selected.slice(0,4)),['Lemma 2.1','Definition 2.2','Lemma 2.4','Definition 2.5'],'page 4 Result ordering is column-major');
 const bib=context.bibliographyEntries;
 assert.equal(bib.length,41,'all printed numbered references [1]-[41] present');
 assert.deepEqual(Array.from(bib,b=>b.label),Array.from({length:41},(_,i)=>`[${i+1}]`),'complete bibliography order even when right column top precedes left heading');
 assert.ok(bib[20].ratio < bib[0].ratio,'right column bibliography continuation starts above left-column References heading');
 assert.ok(bib[25].title.length>20 && bib[26].title.length>20,'affiliation inside [26] cannot terminate bibliography ahead of [27]');
 const c1=bib[0].citations.map(c=>c.raw);
 assert.ok(c1.some(t=>t.includes('Lemma 4.5')),'legitimate labelled prose cross-reference preserved');
 assert.ok(c1.every(t=>!/\[\s*1\s*,\s*1\s*\]/.test(t)),'matrix indexes must not count as citations');
 assert.ok(bib[0].citations.length<=8,'suppress false matrix-index backlinks for [1]');
 assert.ok(bib[1].citations.length<=3,'suppress false matrix-index backlinks for [2]');
 console.log('PASS v421 genuine PDF.js corpus: Structure 14 ordered, Results 29, Bibliography 41, matrix-index reference exclusion');
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
