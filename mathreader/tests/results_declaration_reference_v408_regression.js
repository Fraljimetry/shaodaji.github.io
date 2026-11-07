// v408: Results must point to printed declaration locations, not sentence-start references.
// Standalone: node mathreader/tests/results_declaration_reference_v408_regression.js
// Optional real exported PDF.js detector lines:
// MATHREADER_RESULTS_EXPORT='/path/to/Principal_Minor_Theorem_4_1_Correction-mathreader.json'
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.resolve(__dirname, '../js/41-equations-bibliography.js'), 'utf8');
const core = fs.readFileSync(path.resolve(__dirname, '../js/00-core.js'), 'utf8');
const ctx = vm.createContext({console, document:{addEventListener(){}}, setTimeout});
vm.runInContext(source, ctx, {timeout:15000});
let checks=0;
function same(actual, expected, reason){assert.equal(actual,expected,reason);checks++;}
function yes(value,reason){assert.ok(value,reason);checks++;}
function line(text,ratio=0.35){return [{text,ratio,xStartRatio:0.12,xEndRatio:0.82,parts:[{start:0,end:text.length,xStartRatio:0.12,xEndRatio:0.82}]}];}
function detected(text){return ctx.detectedStructureResult(line(text),0,4);}
function absent(text){same(detected(text),null,`narrative citation must not be a Result: ${text}`);}
function present(text,label){same(detected(text)?.label,label,`physical declaration must survive: ${text}`);}

// These two literal lines and locations came from the supplied 9-page PDF.js
// reading-data export's detectorInputLines. They wrongly shadowed genuine labels.
absent('Theorem 4.1 of the cited 2023 preprint claims that an n × n matrix ( n ≥ 4 ) has a single');
absent('Lemma 4.4 from the main obstruction.');
// General-case prepositional/conjunctive references, including appendix labels.
for(const sample of [
  'Theorem 2.4 in the previous chapter explains why',
  'Lemma 3.2 on page 11 establishes the estimate',
  'Proposition 5.1 for metric spaces has been cited',
  'Corollary 6.1 with the earlier hypotheses is valid',
  'Theorem B.3 from the appendix supplies the bound',
  'Lemma A.2 as a consequence of the discussion',
  'Definition 4.1 and the earlier example',
  'Theorem 3.1 below gives the result',
]) absent(sample);

// Do not discard actual theorems, including common no-dot, dot, parenthetical,
// appendix, numeric-first, and multiline/standalone styles.
present('Theorem 4.1 (Counterexample family in every dimension) . Let n ≥ 4 and let p, q ∈ F be', 'Theorem 4.1');
present('Lemma 2.1 (Principal-minor preservation) . For a matrix A of the form (2.1) , the matrices A', 'Lemma 2.1');
present('Theorem 6.2 (Corrected single-class fiber criterion) . Let F be any field', 'Theorem 6.2');
present('Corollary 6.3 (A valid one-cut obstruction) . If A is irreducible', 'Corollary 6.3');
present('Lemma 2.5 Let A be a positive definite matrix', 'Lemma 2.5');
present('Theorem 2.1. For every smooth f', 'Theorem 2.1');
present('Theorem B.3. For every x', 'Theorem B.3');
present('4-1. Definition. Let x be a compact set', 'Definition 4-1');
present('THEOREM', 'Theorem · p.4');

// A false citation must not delete a legitimate earlier-numbered lemma by
// the subsequent monotone-number sequence filter, nor steal a true theorem.
const candidates = [
  {label:'Theorem 4.1',page:1,ratio:0.3855555555555556,title:'Theorem 4.1 of the cited preprint'},
  {label:'Lemma 4.4',page:1,ratio:0.5817891414141414,title:'Lemma 4.4 from the main obstruction'},
  {label:'Lemma 2.1',page:3,ratio:0.18925378787878788,title:'Lemma 2.1 (Principal-minor preservation)'},
  {label:'Theorem 4.1',page:4,ratio:0.37353661616161615,title:'Theorem 4.1 (Counterexample family)'},
];
let clean = Array.from(ctx.normalizeSequentialStructureEntries(candidates.slice(2)));
same(clean.length,2,'genuine entries both survive sequence normalization without phantom citations');
same(clean[0].page,3,'Lemma 2.1 retains its true page');
same(clean[1].page,4,'Theorem 4.1 retains its true page');
yes(/const STRUCTURE_INDEX_VERSION = 52\s*;/.test(core),'old detection caches are invalidated for v408');

if(process.env.MATHREADER_RESULTS_EXPORT){
 const data=JSON.parse(fs.readFileSync(process.env.MATHREADER_RESULTS_EXPORT,'utf8'));
 same(data.document.pages,9,'export fixture consists of nine pages');
 const sourceRows=data.fullDocumentText.pages;
 same(sourceRows.length,9,'all native detector input pages are preserved');
 const observed=[];
 for(const page of sourceRows){
  const lines=page.detectorInputLines;
  for(let i=0;i<lines.length;i++){
   const found=ctx.detectedStructureResult(lines,i,page.page);
   if(found&&!found.ambiguousAppendixOCR)observed.push({key:`${page.page}:${found.label}`,...found});
  }
 }
 const ordered=Array.from(ctx.normalizeSequentialStructureEntries(observed));
 const find=(label)=>ordered.filter(row=>row.label===label);
 for(const [label,page,ratio] of [
  ['Lemma 2.1',3,0.18925378787878788],
  ['Theorem 4.1',4,0.37353661616161615],
  ['Lemma 6.1',6,0.6101616161616161],
  ['Theorem 6.2',7,0.11020075757575758],
  ['Corollary 6.3',7,0.5514393939393939],
  ['Proposition 6.4',7,0.6488017676767677],
 ]){
  same(find(label).length,1,`${label} detected exactly once`);
  same(find(label)[0].page,page,`${label} is on printed declaration page`);
  yes(Math.abs(find(label)[0].ratio-ratio)<0.000001,`${label} original PDF.js coordinates preserved`);
 }
 same(find('Lemma 4.4').length,0,'absent external Lemma 4.4 not inserted as local Result');
 same(ordered.length,10,'ten actual in-document Result declarations retained; no phantom citations');
 console.log(`PASS: ${checks} assertions against all nine actual exported PDF.js detection pages`);
}else console.log(`PASS: ${checks} Results declaration/reference class assertions (optional full export replay not set)`);
