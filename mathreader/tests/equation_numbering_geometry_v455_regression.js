'use strict';
// Full native-geometry replay of the user's previously failing 20-page LLM note.
// This does not claim fresh PDF.js or OCR execution. Ground truth is the actual
// six printed right-margin glyph positions, not the old detector's output.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const fixture = JSON.parse(read('regression/fixtures/llm_native_equations_v455.json'));
const pages = new Map(fixture.nativePdfPages.map(p=>[p.page,p]));
assert.equal(pages.size, fixture.document.pages, 'all document pages included in inference');
const ctx = vm.createContext({
  console, Map,Set,Promise,Date,setTimeout,
  EQUATION_TAG_SYMBOL_CLASS:'*†‡',equationNumberingSide:'right',equationDetectionGeneration:1,
  currentFileKey:'llm-native-fixture',pdfDoc:{numPages:fixture.document.pages},
  equationLabelIndex:null,equationAutomaticLabelIndex:null,equationImageAssistPromise:null,
  equationDetectionProgress:{phase:'native'},equationIndexKnownCount:null,equationEdits:[],
  manualIndexOcrPages:new Map(),documentOcrPages:new Map(),equationSupplementalOcrCache:new Map(),
  sourceDocumentUsesOcr:()=>false,documentTextFeaturesAvailable:()=>true,
  equationOcrPageConfidence:()=>null,equationDetectionNowMs:()=>Date.now(),
  lineCache:new Map(),textCache:new Map(),document:{addEventListener(){}},
  updateEquationDetectionProgress:()=>{},logEquationDetectionTiming:()=>{},
  persistDocumentState:()=>{},renderEquationIndex:()=>{},applyEquationEdits:m=>m,t:en=>en,
  orderedPrefetch:async function*(items,fetch){for(const item of items)yield {item,value:await fetch(item)};},
  nativePageTextData:async (_doc,page)=>({page:{view:pages.get(page).view},content:{items:pages.get(page).items}}),
});
const core = read('js/00-core.js');
const start = core.indexOf('function findFirstRowInYBuckets(');
const stop = core.indexOf('const nativePageTextCacheByDocument',start);
assert.ok(start>=0 && stop>start,'load production row geometry helpers');
vm.runInContext(core.slice(start,stop),ctx);
vm.runInContext(read('js/41-equations-bibliography.js'),ctx,{filename:'41-equations-bibliography.js'});
vm.runInContext('updateEquationDetectionProgress=()=>{};renderEquationIndex=()=>{};logEquationDetectionTiming=()=>{};globalThis.run=buildEquationLabelIndex;',ctx);
(async()=>{
  const index = await ctx.run();
  const actual = [...index.entries()].flatMap(([label,rows])=>rows.map(row=>({label,...row})));
  assert.equal(actual.length,6,`only the six printed equations; got ${actual.map(r=>r.label+'@'+r.page).join(', ')}`);
  assert.equal(ctx.equationNumberingSide,'right','consistent physical right edge must win');
  for(const truth of fixture.printedTagTruth){
    const page = pages.get(truth.page), height=page.view[3]-page.view[1], width=page.view[2]-page.view[0];
    const hit=actual.find(r=>r.label===truth.label && r.page===truth.page);
    assert.ok(hit, `missing ${truth.label} at PDF page ${truth.page}`);
    assert.ok(Math.abs(hit.ratio-(page.view[3]-truth.y)/height)<=2.2/height,`incorrect baseline for ${truth.label}`);
    assert.ok(Math.abs(hit.candidateXEndRatio-(truth.x+truth.width-page.view[0])/width)<.002,`incorrect tag edge for ${truth.label}`);
  }
  assert.ok(!index.has('(0)'),'superscript fragments are not equation targets');
  // Resolve the actual inline reference in page 6 to its printed target on page 4.
  ctx.ensureEquationIndexRendered=async()=>index;
  const resolved=await ctx.findEquationLabelLocation('(1)',6,(792-432.407)/792);
  assert.equal(resolved?.page,4,'inline reference resolves to the actual equation page');
  assert.ok(Math.abs(resolved.ratio-(792-65.688)/792)<=2.2/792,'inline reference resolves to measured equation baseline');
  // Keep both numbering conventions: strong distinct-label alignment wins over
  // arbitrarily repeated weak or duplicate candidates on the opposite side.
  const strong=(n,side)=>({label:`(${n})`,numeric:{prefix:''},explicitParenthesized:true,mathSignals:2,
    candidateAtLineStart:side==='left',candidateAtLineEnd:side==='right',
    candidateXStartRatio:side==='left'?.08:.87,candidateXEndRatio:side==='left'?.10:.89,
    text:side==='left'?`(${n}) x = y + z`:`x = y + z (${n})`});
  const weak=(side)=>({label:'(9.9)',numeric:{prefix:'9'},bareSource:true,mathSignals:3,
    candidateXStartRatio:side==='left'?.08:.87,candidateXEndRatio:side==='left'?.12:.91,
    candidateAtLineStart:side==='left',candidateAtLineEnd:side==='right',text:'x = y + z'});
  for(const side of ['left','right']){
    const opposite=side==='left'?'right':'left';
    const records=[...[1,2,3].map(n=>strong(n,side)),...Array.from({length:40},()=>weak(opposite)),...Array.from({length:40},()=>strong(9,opposite))];
    assert.equal(ctx.inferEquationNumberingSide(records),side,`distinct aligned tags beat noisy ${opposite} votes`);
  }
  // A legitimate tag (0) remains eligible; no label-specific blacklist.
  assert.ok(ctx.equationCandidateConfidenceForSide(strong(0,'right'))>=8,'real equation zero not forbidden');
  console.log('PASS v455 20-page LLM native geometry: 6/6 printed equations, 0 spurious; inline reference (1), both numbering sides');
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
