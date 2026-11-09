#!/usr/bin/env node
'use strict';
// Real exported PDF.js native text, independently checked against the published
// 12-page conference PDF. No dependence on the user's external export path.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'regression/fixtures/stoc25_native_equations_v420.json'), 'utf8'));
const pages = new Map(fixture.nativePdfPages.map(p => [p.page,p]));
const ctx = {
  console:{log:()=>{},info:()=>{},warn:()=>{},error:console.error}, Map,Set,Promise,Date,setTimeout,
  EQUATION_TAG_SYMBOL_CLASS:'*†‡',equationNumberingSide:'right',equationDetectionGeneration:1,
  currentFileKey:'stoc25-native-fixture',pdfDoc:{numPages:fixture.document.pages},
  equationLabelIndex:null,equationAutomaticLabelIndex:null,equationImageAssistPromise:null,
  equationDetectionProgress:{phase:'native'},equationIndexKnownCount:null,equationEdits:[],
  manualIndexOcrPages:new Map(),documentOcrPages:new Map(),equationSupplementalOcrCache:new Map(),
  sourceDocumentUsesOcr:()=>false,documentTextFeaturesAvailable:()=>true,
  equationOcrPageConfidence:()=>null,equationDetectionNowMs:()=>Date.now(),
  lineCache:new Map(),textCache:new Map(),document:{addEventListener:()=>{}},
  updateEquationDetectionProgress:()=>{},logEquationDetectionTiming:()=>{},
  persistDocumentState:()=>{},renderEquationIndex:()=>{},applyEquationEdits:m=>m,t:en=>en,
};
ctx.orderedPrefetch = async function*(items, fetch) {
  for (const item of items) yield {item,value:await fetch(item)};
};
ctx.nativePageTextData = async (_doc,page) => ({
  page:{view:pages.get(page).view},content:{items:pages.get(page).items}
});
ctx.findFirstRowInYBuckets = (buckets,y) => {
  for (const rows of buckets.values()) for (const row of rows) if (Math.abs(row.y-y)<=2.2) return row;
  return null;
};
ctx.addRowToYBuckets = (buckets,row) => {
  const k=Math.floor(row.y/2.2),arr=buckets.get(k)||[];arr.push(row);buckets.set(k,arr);
};
const sandbox=vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8'),sandbox,{filename:'41-equations-bibliography.js'});
vm.runInContext('updateEquationDetectionProgress=()=>{};renderEquationIndex=()=>{};globalThis.run=buildEquationLabelIndex;',sandbox);
(async () => {
  const index = await sandbox.run();
  const actual = [...index.entries()].flatMap(([label,rows])=>rows.map(row=>({label,...row})));
  const missing=[];
  for(const [n,page] of Object.entries(fixture.expectedPrintedEquations)){
    const label=`(${n})`;
    if(!actual.some(r=>r.label===label&&r.page===page))missing.push(`${label}@p${page}`);
  }
  assert.deepEqual(missing,[],`missing independently verified printed equations: ${missing.join(', ')}`);
  const extraneous=actual.filter(row=>!Object.prototype.hasOwnProperty.call(fixture.expectedPrintedEquations,row.label.slice(1,-1)));
  assert.deepEqual(extraneous,[],`spurious equation labels: ${JSON.stringify(extraneous)}`);
  assert.equal(actual.length,21,'exactly the 21 printed equation occurrences, excluding numbered prose conditions');
  const ordered = actual.sort((a,b)=>sandbox.compareEquationIndexRows(a,b));
  assert.deepEqual(ordered.map(r=>r.label), Array.from({length:21},(_,i)=>`(${i+1})`), 'correct two-column reading order');
  console.log('PASS v420 STOC 2025 native PDF two-column equation ground truth (21/21, 0 spurious)');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
