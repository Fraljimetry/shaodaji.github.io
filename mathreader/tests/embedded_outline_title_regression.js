// MathReader v347: metadata-only cleanup of invalid bookmark title tails.
// Run from repository root: node mathreader/tests/embedded_outline_title_regression.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const outlineSource = fs.readFileSync(path.join(__dirname, '../js/40-outline-structure.js'), 'utf8');
const refsSource = fs.readFileSync(path.join(__dirname, '../js/50-references-search.js'), 'utf8');
const extract = (source, begin, end) => {
  const a = source.indexOf(begin), b = source.indexOf(end, a + begin.length);
  assert(a >= 0 && b > a, `missing boundary: ${begin}`);
  return source.slice(a, b);
};
let checks = 0;
const check = (condition, description) => { assert.ok(condition, description); checks++; };
const ctx = vm.createContext({console});
vm.runInContext([
  extract(outlineSource, 'function flattenOutline(', '\nfunction cleanEmbeddedOutlineTitle('),
  extract(outlineSource, 'function cleanEmbeddedOutlineTitle(', '\nfunction updateOutlineSource('),
].join('\n'), ctx, {timeout:5000});
const clean = (s) => vm.runInContext(`cleanEmbeddedOutlineTitle(${JSON.stringify(s)})`, ctx);
// Representative decodings of a malformed trailing bookmark byte sequence.
check(clean('Contents\u0000') === 'Contents', 'trailing NUL removed');
check(clean('Foreword\uFFFD') === 'Foreword', 'trailing replacement glyph removed');
check(clean('Preface\uDC80') === 'Preface', 'invalid trailing surrogate removed');
check(clean("1. Applications of Schwarz’s lemma\uDCC0\uDC80") === '1. Applications of Schwarz’s lemma', 'malformed UTF-8 bytes at end removed');
check(clean('1.2. Schwarz–Pick theorem\u0000\uFFFD') === '1.2. Schwarz–Pick theorem', 'multiple invalid tail characters removed');
check(clean('Conformal measures\u007F\u0080') === 'Conformal measures', 'invalid trailing control bytes removed');
// Negative controls: no semantic math-character removal or made-up substitutions.
check(clean('Lemma □') === 'Lemma □', 'legitimate empty-square mathematical glyph preserved');
check(clean('Equation ☐') === 'Equation ☐', 'mathematical white-square glyph preserved');
check(clean('Proof ■') === 'Proof ■', 'mathematical solid-square glyph preserved');
check(clean('Section α + β') === 'Section α + β', 'Greek and mathematical operators preserved');
check(clean('Equation \uFFFD still uncertain') === 'Equation \uFFFD still uncertain', 'interior damaged glyph not hidden');
check(clean('Title \u0000 Section') === 'Title \u0000 Section', 'interior code point not silently dropped');
check(clean('Cover') === 'Cover', 'healthy title left exactly unchanged');
check(clean('  Appendix B  ') === 'Appendix B', 'ordinary whitespace normalization');
check(clean('') === '' && clean(null) === '', 'empty or absent title safe');

// Exercise the real outline ingestion and TOC-reference paths, not just the
// standalone string helper. Preserve raw sourceKey and destination semantics.
let rendered = null, scheduled = 0, requested = 0;
const outline = [
  {title:'Cover', dest:1, items:[]},
  {title:'Contents\u0000', dest:4, items:[{title:'1. Schwarz’s lemma\uFFFD', dest:7, items:[]}]},
  {title:'2. Capacity\uDCC0\uDC80', dest:20, items:[]},
  {title:'3. Bounds □', dest:38, items:[]},
];
Object.assign(ctx, {
  pdfDoc: {getOutline:async()=>{requested++;return outline;}},
  documentTextFeaturesAvailable:()=>true,
  outlineList:{replaceChildren(){}}, outlineMode:'none',
  updateOutlineSource:()=>{},
  flattenOutline:vm.runInContext('flattenOutline',ctx),
  resolveOutlineDestination:async(dest)=>({page:dest,ratio:0.2}),
  renderEmbeddedOutline:(entries)=>{rendered=entries;},
  scheduleDetectedOutlineAugmentation:()=>{scheduled++;},
  t:(en)=>en,
  tocOutlineTargets:null, inferredOutline:[],
  tocSectionNumber:()=>'',
  normalizeSearchValue:(v)=>String(v).toLowerCase(),
});
vm.runInContext(extract(refsSource,'async function renderOutline() {','\nasync function pageText('),ctx,{timeout:5000});
vm.runInContext(extract(refsSource,'async function getTocOutlineTargets() {','\nasync function decorateTocLinks('),ctx,{timeout:5000});
(async()=>{
  await vm.runInContext('renderOutline()',ctx);
  check(rendered.length===5, 'embedded outline keeps all entries and order');
  check(rendered.map(x=>x.title).join('|')==='Cover|Contents|1. Schwarz’s lemma|2. Capacity|3. Bounds □', 'rendered labels clean invalid tails only');
  check(rendered.map(x=>x.page).join('|')==='1|4|7|20|38', 'destination pages unchanged');
  check(rendered[2].depth===1 && rendered[3].depth===0, 'outline hierarchy unchanged');
  check(rendered[1].sourceKey==='1:0:Contents\u0000', 'original raw source identity retained for edits');
  check(rendered[2].matchText==='1. Schwarz’s lemma', 'match text cleaned alongside visible text');
  check(scheduled===1 && requested===1, 'existing outline augmentation still scheduled');
  const targets = await vm.runInContext('getTocOutlineTargets()',ctx);
  check(targets.length===5, 'all TOC link targets kept');
  check(targets.map(x=>x.title).join('|')==='Cover|Contents|1. Schwarz’s lemma|2. Capacity|3. Bounds □', 'TOC reference labels also clean');
  check(targets[4].page===38 && targets[4].ratio===0.2, 'TOC link destination unchanged');
  console.log(`OK: ${checks} embedded-outline malformed-tail class-level assertions`);
})().catch((error)=>{console.error(error);process.exitCode=1;});
