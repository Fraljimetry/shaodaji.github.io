#!/usr/bin/env node
'use strict';
// Offline native-layer replay of production MathReader equation labeling.
// Selected genuine PDF.js native pages from the user-provided Leon Simon PDE export
// The selected pages are frozen so the test runs without private user files.
// This is a source-text proxy, NOT a reproduction of visual/OCR recognition.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../regression/fixtures/simon_pde_native_pages_v418.json'), 'utf8'));
const expected = data.source_document;
const total = expected.pages;
const pages = new Map((data.pages || [])
  .filter(p => p?.nativePdf?.view && Array.isArray(p.nativePdf?.items))
  .map(p => [p.page, p.nativePdf]));

const source = fs.readFileSync(path.join(__dirname, '../js/41-equations-bibliography.js'), 'utf8');
const context = {
  console: {log:()=>{},info:()=>{},warn:()=>{},error:console.error}, Map,Set,Promise,Date,setTimeout,
  EQUATION_TAG_SYMBOL_CLASS:'*†‡',equationNumberingSide:'right',equationDetectionGeneration:1,
  currentFileKey:'offline-export',pdfDoc:{numPages:total},
  equationLabelIndex:null,equationAutomaticLabelIndex:null,equationImageAssistPromise:null,
  equationDetectionProgress:{phase:'native'},equationIndexKnownCount:null,equationEdits:[],
  manualIndexOcrPages:new Map(),documentOcrPages:new Map(),equationSupplementalOcrCache:new Map(),
  sourceDocumentUsesOcr:()=>false,documentTextFeaturesAvailable:()=>true,
  equationOcrPageConfidence:()=>null,equationDetectionNowMs:()=>Date.now(),
  lineCache:new Map(),textCache:new Map(),document:{addEventListener:()=>{}},
  updateEquationDetectionProgress:()=>{},logEquationDetectionTiming:()=>{},
  persistDocumentState:()=>{},renderEquationIndex:()=>{},applyEquationEdits:m=>m,t:en=>en,
};
context.orderedPrefetch = async function*(items, fetch) {
  for (const item of items) yield {item,value:await fetch(item)};
};
context.nativePageTextData = async (_doc,page) => ({
  page:{view:(pages.get(page)||{view:[0,0,792,612]}).view},content:{items:(pages.get(page)||{items:[]}).items}
});
context.findFirstRowInYBuckets = (buckets,y) => {
  for (const rows of buckets.values()) for (const row of rows) if (Math.abs(row.y-y)<=2.2) return row;
  return null;
};
context.addRowToYBuckets = (buckets,row) => {
  const k=Math.floor(row.y/2.2),arr=buckets.get(k)||[];arr.push(row);buckets.set(k,arr);
};
const ctx = vm.createContext(context);
vm.runInContext(source,ctx,{filename:'41-equations-bibliography.js'});
vm.runInContext('updateEquationDetectionProgress=()=>{};renderEquationIndex=()=>{};globalThis.run=buildEquationLabelIndex;',ctx);
ctx.run().then(index => {
  const assert = require('node:assert/strict');
  const at=(label,page)=> (index.get(label)||[]).some(r=>r.page===page);
  for (const [label,page] of [['(2)',14],['(2)',125],['(3)',125],['(4)',125],['(5)',125],['(6)',125],['(7)',125],['(8)',125],['(9)',129],['(10)',129],['(11)',129],['(12)',129],['(10)',172],['(11)',172],['(12)',172],['(13)',172]]) assert.ok(at(label,page), `Missing source-native ${label} on PDF p.${page}`);
  for (const label of ['(1)','(2)','(3)']) assert.ok(at(label,95), `genuine displayed boundary problem ${label} p95`);
  assert.ok(!at('(2)',61),'broken prose reference \'in view of (2))\' is not a printed equation');
  const p172=index.get('(12)').filter(x=>x.page===172);
  assert.equal(p172.length,1,'reference to (12) on page 172 must not become a second printed equation');
  assert.ok(p172[0].ratio<0.70,'(12) must navigate to equation, not later inline reference');
  assert.equal((index.get('(2)')||[]).filter(r=>[14,125].includes(r.page)).length,2,'repeated equations need occurrence identity');
  const rows = [...index.entries()].flatMap(([label,items])=>items.map(item=>({
    label,page:item.page,ratio:item.ratio,colonEncoded:!!item.confirmedColonMargin
  })));
  const labels = new Set(rows.map(r=>r.label));
  console.log(JSON.stringify({document:expected.name,pages:total,
    labels:labels.size,occurrences:rows.length,
    colonOccurrences:rows.filter(r=>r.colonEncoded).length,
    example1_1:rows.filter(r=>r.label==='(1.1)'),
    page7_singleDigits:rows.filter(r=>r.page===7 && /^\([1-3]\)$/.test(r.label)),
    samePageDuplicateLabels: rows.filter((r,i)=>rows.findIndex(q=>q.label===r.label && q.page===r.page)!==i)},null,2));
}).catch(error => { console.error(error.stack); process.exitCode=1; });
