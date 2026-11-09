'use strict';
// Minimal native-text replay derived from the supplied 267-page Leon Simon export.
// Document SHA-256: 8a261ff912d78cf839d102e99f317a391949d69c017e109dd2629796d4c3b999
// Pages and label positions are genuine PDF text-layer evidence, not OCR truth.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/41-equations-bibliography.js'), 'utf8');
const linesByPage = new Map();
function add(page, text, ratio, xStart = 0.07236) {
  const items = linesByPage.get(page) || [];
  const first = /^\s*(?:\d{1,3}[:：]\d{1,3}|\(\d+\))/.exec(text)?.[0] || text;
  const parts = [{start:0,end:first.length,xStartRatio:xStart,xEndRatio:xStart+first.length*0.006}];
  if (first.length < text.length) parts.push({start:first.length+1,end:text.length,xStartRatio:xStart+0.12,xEndRatio:0.85});
  items.push({text,parts,ratio,xStartRatio:xStart,xEndRatio:first.length===text.length ? xStart+first.length*0.006 : 0.85,heightRatio:0.016});
  linesByPage.set(page, items);
}
// The book repeats section-local labels after a new chapter starts.
add(12, '1:16 L ( A ) D inf', 0.561);
add(12, '1:16 L ( A ) D inf', 0.752);
add(6, '1:1 μ ( A ) D μ ( A j )', 0.95149);
add(47, '1:1 j f ( x ) - f ( y ) j D L d ( x; y )', 0.9118);
add(89, '1:1 M ∈ M 0 [ F j ( R )', 0.6339);
// Other independent left-margin families, including the colon/dot variant.
add(111, '3:3 n ( r ) dμ D 0', 0.581);
add(112, '3:6 ( 1 C ε ) J ( ρ ) D 0', 0.459);
add(112, '3:7 ( 1 C ε ) ρ I ( ρ ) D 0', 0.549);
add(112, '3:8 μ ( B ρ ) D ∫ f', 0.732);
add(239, '2:1 f ( x ) D ∫ f ( x; S )', 0.766);
add(240, '2:2 δ V ( X ) D M ( V )', 0.154);
add(240, '2:3 δ V ( X ) D ∫ div S X', 0.291);
add(241, '3:1 div S X D n ( r )', 0.635);
add(242, '3:6 μ ( B ρ ) - θ D ∫ f', 0.299);
// False positives: definition conditions and a prose-like clock entry.
add(7, '1.4 Definition: A collection of subsets of X is a σ-algebra if', 0.695, 0.07236);
add(7, '(1) ∅ ; X ∈ S', 0.723, 0.09096);
add(7, '(2) A ∈ S implies X minus A ∈ S', 0.747, 0.09096);
add(7, '(3) A 1 , A 2 ∈ S', 0.772, 0.09096);
add(240, '12:30 lecture starts this afternoon', 0.52);
for (const arr of linesByPage.values()) arr.sort((a,b)=>a.ratio-b.ratio);
const ctx = vm.createContext({
  console:{...console,log:()=>{}},Date,Map,Set,Promise,setTimeout,
  EQUATION_TAG_SYMBOL_CLASS:'*†‡',equationNumberingSide:'right',
  pdfDoc:{numPages:242},currentFileKey:'simon-test',equationDetectionGeneration:1,
  equationLabelIndex:null,equationAutomaticLabelIndex:null,equationImageAssistPromise:null,
  equationDetectionProgress:{},equationIndexKnownCount:null,equationEdits:[],
  equationSupplementalOcrCache:new Map(), manualIndexOcrPages:new Map(),
  document:{addEventListener:()=>{}},documentTextFeaturesAvailable:()=>true,
  equationOcrPageConfidence:()=>null,equationDetectionNowMs:()=>Date.now(),
  persistDocumentState:()=>{},applyEquationEdits:(m)=>m,
  t:(en)=>en
});
vm.runInContext(source,ctx);
ctx.equationSourceLabelForDisplayed=(label)=>label;
ctx.orderedPrefetch=async function*(pages,fn){for(const item of pages)yield{item,value:await fn(item)}};
ctx.pageTextLines=async (page)=>linesByPage.get(page)||[];
vm.runInContext('updateEquationDetectionProgress=()=>{}; renderEquationIndex=()=>{}; globalThis.detect=buildEquationLabelIndex; globalThis.readCandidates=equationLabelCandidatesInLine; globalThis.rowKey=equationRowOrderKey; globalThis.compareRows=compareEquationIndexRows;',ctx);
assert.equal(Array.from(ctx.readCandidates('3:7 f ( x ) D 0'), x=>x.label).join(','),'(3.7)','recover damaged-font colon only in a leading candidate');
assert.equal(ctx.readCandidates('the ratio 3:7 is important').length,0,'no colon rewriting in prose');
assert.equal(ctx.readCandidates('12:30 starts the lecture')[0].label,'(12.30)','a potential clock remains only a candidate until validated');
(async()=>{
  const index=await ctx.detect();
  const assertPage=(label,page)=>assert.ok((index.get(label)||[]).some(x=>x.page===page),`${label} on PDF page ${page}`);
  for(const [label,page] of [['(1.1)',6],['(1.1)',47],['(1.1)',89],['(3.6)',112],['(3.7)',112],['(3.8)',112],['(2.1)',239],['(2.2)',240],['(2.3)',240],['(3.1)',241],['(3.6)',242]])assertPage(label,page);
  assert.equal((index.get('(1.1)')||[]).length,3,'all chapter-local occurrences survive canonicalization');
  assert.equal((index.get('(3.6)')||[]).length,2,'repeated section labels retain distinct page coordinates');
  assert.equal((index.get('(1.16)')||[]).length,1,'same-label repeats on one page collapse to one canonical location');
  for (const k of ['(12.30)','(1)','(2)','(3)']) assert.ok(!index.has(k),`reject false equation ${k}`);
  const rows=(index.get('(1.1)')||[]).map(x=>({label:'(1.1)',...x,repeatedPrintedEquation:true}));
  assert.equal(new Set(rows.map(ctx.rowKey)).size,3,'repeated labels have independent, stable drag keys');
  rows.sort(ctx.compareRows);
  assert.equal(Array.from(rows, x=>x.page).join(','),'6,47,89','repeated number is ordered by physical document location');
  console.log('PASS: Simon native-font colon normalization, repeated numbering, conditions vs equations, navigation and order');
})().catch(error=>{console.error(error);process.exitCode=1});
