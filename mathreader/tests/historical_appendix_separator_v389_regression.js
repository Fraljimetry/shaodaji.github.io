'use strict';
// Real old-textbook failure class: Giusti Appendix B PDF p.238 printed (B.3),
// but lower-resolution Tesseract read (B3); neighboring (B.2)/(B.4) were correct.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const c = vm.createContext({document:{addEventListener(){}},console});
vm.runInContext("let equationNumberingSide='left'; const EQUATION_TAG_SYMBOL_CLASS='*∗⋆★☆†‡※◇◆○●◦•△▲▽▼□■♢♦⊙⊗⊕⊖⊥∥';", c);
vm.runInContext(source,c,{timeout:30000});
let total=0;
function check(condition,message){assert.ok(condition,message);total++;}
function make(label,page,ratio){return {label,page,ratio,ocrSource:true,numeric:c.parsedEquationNumber(label),confidence:25,standaloneTag:true,candidateXStartRatio:.0829,candidateXEndRatio:.145};}
function dense(labels){return c.denseSupplementalEquationFamilies(labels.map((x,i)=>make(x,238,.1+i*.1))).map(x=>x.label).join(',');}
check(c.equationSequenceFamilyKey(c.parsedEquationNumber('(B.3)')) !== c.equationSequenceFamilyKey(c.parsedEquationNumber('(B3)')),'dotted and compact cannot validate each other');
check(c.equationSequenceFamilyKey(c.parsedEquationNumber('(C-3)')) !== c.equationSequenceFamilyKey(c.parsedEquationNumber('(C.3)')),'hyphen and dot are distinct');
check(dense(['(B.2)','(B3)','(B.4)']) === '', 'Giusti OCR loss of dot cannot create a false dense family');
check(dense(['(C.5)','(C6)','(C.7)']) === '', 'C6 cannot corroborate C.5/C.7');
check(dense(['(B.2)','(B.3)','(B.4)']) === '(B.2),(B.3),(B.4)','real dotted family is accepted');
check(dense(['(B1)','(B2)','(B3)']) === '(B1),(B2),(B3)','genuine compact family still accepted');
check(dense(['(C-1)','(C-2)','(C-3)']) === '(C-1),(C-2),(C-3)','genuine hyphen family still accepted');
check(dense(['(A.1)','(A.3)','(A.4)']) === '(A.1),(A.3),(A.4)','monotone dotted family with one OCR hole is retained');
const mixed = new Map([
 ['(B.2)',[make('(B.2)',238,.1165)]],
 ['(B3)',[make('(B3)',238,.1996)]],
 ['(B.4)',[make('(B.4)',238,.3469)]],
 ['(B.5)',[make('(B.5)',239,.1)]],
]);
const plan=c.equationNativeImageGapPlan(mixed,253,[]);
check(!(plan.expectedByPage.get(238)||new Set()).has('(B.3)'), 'cross-format B3 cannot establish a dotted gap query');
check(c.equationLabelCandidatesInLine('See (B.3) for the proof').some(x=>x.label==='(B.3)') && c.equationReferenceProseContext('See (B.3) for the proof'),'prose references remain distinguishable from displayed tags');
console.log(`PASS: ${total} original-scan appendix numbering family assertions`);
