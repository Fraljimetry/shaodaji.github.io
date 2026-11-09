#!/usr/bin/env node
'use strict';
// Offline native-layer replay of production MathReader equation labeling.
// Usage: node mathreader/regression_tools/replay_equation_index_from_export.js export.json
// Requires the MathReader full-document-text export with nativePdf.items geometry.
// This is a source-text proxy, NOT a reproduction of visual/OCR recognition.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const input = process.argv[2];
if (!input) { console.error('Usage: node replay_equation_index_from_export.js export.json'); process.exit(2); }
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const pages = new Map((data.fullDocumentText?.pages || [])
  .filter(p => p?.nativePdf?.view && Array.isArray(p.nativePdf?.items))
  .map(p => [p.page, p.nativePdf]));
const total = Number(data.document?.pages);
if (!Number.isInteger(total) || total < 1 || pages.size !== total) {
  throw new Error('Expected a complete fullDocumentText.pages array with nativePdf geometry for every PDF page');
}
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
  page:{view:pages.get(page).view},content:{items:pages.get(page).items}
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
  const rows = [...index.entries()].flatMap(([label,items])=>items.map(item=>({
    label,page:item.page,ratio:item.ratio,colonEncoded:!!item.confirmedColonMargin
  })));
  const labels = new Set(rows.map(r=>r.label));
  console.log(JSON.stringify({document:data.document?.name,pages:total,
    labels:labels.size,occurrences:rows.length,
    colonOccurrences:rows.filter(r=>r.colonEncoded).length,
    example1_1:rows.filter(r=>r.label==='(1.1)'),
    page7_singleDigits:rows.filter(r=>r.page===7 && /^\([1-3]\)$/.test(r.label)),
    samePageDuplicateLabels: rows.filter((r,i)=>rows.findIndex(q=>q.label===r.label && q.page===r.page)!==i)},null,2));
}).catch(error => { console.error(error.stack); process.exitCode=1; });
