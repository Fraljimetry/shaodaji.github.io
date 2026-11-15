// v446: positional proof references, malformed index headings and dense duplicate evidence.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({console, document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/41-equations-bibliography.js'), 'utf8'), context, {timeout:20000});
let count=0;
function eq(actual, expected, message){ assert.equal(actual, expected, message); count++; }
const left = {label:'Theorem 2.1', page:4, ratio:.12, declarationXStartRatio:.10};
const laterLeft = {label:'Theorem 2.1', page:4, ratio:.65, declarationXStartRatio:.10};
const previous = {label:'Theorem 2.1', page:3, ratio:.9, declarationXStartRatio:.1};
const right = {label:'Lemma 2.2', page:4, ratio:.2, declarationXStartRatio:.63};
// Deliberately shuffled OCR arrival order; printed coordinates must win.
eq(context.resultProofTarget([laterLeft, previous, left], 'Theorem 2.1',4,{ratio:.72,xStartRatio:.1}), laterLeft, 'explicit repeated label selects nearest printed occurrence');
eq(context.resultProofTarget([laterLeft, previous, left], 'Theorem 2.1',4,{ratio:.5,xStartRatio:.1}), left, 'later printed occurrence cannot own prior proof');
eq(context.resultProofTarget([laterLeft, previous, left], 'Theorem 2.1',5,{ratio:.1,xStartRatio:.1}), laterLeft, 'most recent prior page wins independent of input order');
eq(context.resultProofTarget([right,left], '',4,{ratio:.35,xStartRatio:.1}), left, 'implicit proof follows correct column');
eq(context.resultProofTarget([right,left], '',4,{ratio:.35,xStartRatio:.65}), right, 'right column can own its own proof');
eq(context.resultProofTarget([right,left], 'Lemma 9.9',4,{ratio:.8,xStartRatio:.1}), null, 'unresolved explicit proof remains unmatched');
eq(context.resultProofTarget([right,left], '',null,{ratio:.8,xStartRatio:.1}),null,'invalid proof page never invents owner');
const unknown = {label:'Lemma 2.3',page:4, ratio:.25};
eq(context.resultProofTarget([unknown,left], '',4,{ratio:.3,xStartRatio:.1}),left,'measured same-column declaration prioritized over unknown-column ambiguity');
const invalid = {label:'Lemma 2.4',page:NaN,ratio:.1};
eq(context.resultProofTarget([invalid,left], '',4,{ratio:.3,xStartRatio:.1}),left,'invalid declaration page ignored');
const indexRows = Array.from({length:12}, (_, i) => ({text:`Line ${i}`,ratio:.3}));
indexRows[0] = {text:'Index',ratio:null};
eq(context.structureResultsIndexNavigationPage(indexRows),false,'missing heading position is not page top');
indexRows[0] = {text:'Index',ratio:-.01};
eq(context.structureResultsIndexNavigationPage(indexRows),false,'negative heading position rejected');
indexRows[0] = {text:'Index',ratio:.08};
eq(context.structureResultsIndexNavigationPage(indexRows),true,'genuine index page still excluded');
indexRows[0] = {text:'Index',ratio:NaN};
eq(context.structureResultsIndexNavigationPage(indexRows),false,'NaN heading position rejected');
// Large repeated weak detections formerly raised Maximum call stack size exceeded.
const many=Array.from({length:140000},(_,i)=>({label:'Theorem 1.1',page:i%2+1,ratio:.25}));
const dedup=context.normalizeSequentialStructureEntries(many);
eq(dedup.length,1,'large weak duplicate observations reduce to one entry without overflow');
console.log(`PASS ${count} v446 proof ordering, false-positive, and dense-dedup assertions`);
