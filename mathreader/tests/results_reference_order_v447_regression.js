'use strict';
const assert = require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c=vm.createContext({console,document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8'),c,{timeout:20000});
let n=0; const same=(actual,expected,label)=>{assert.equal(actual,expected,label); n++;};
const earlier={label:'Theorem 1.1',page:3,ratio:.2,declarationEvidence:'number-first'};
const later={label:'Theorem 1.1',page:3,ratio:.75,declarationEvidence:'number-first'};
const missing={label:'Theorem 1.1',page:3,ratio:null,declarationEvidence:'number-first'};
const different={label:'Theorem 1.1',page:5,ratio:.12,declarationEvidence:'number-first'};
for (const rows of [[later,earlier,missing],[missing,later,earlier]]) {
 const normalized=c.normalizeSequentialStructureEntries([...rows,different]);
 same(normalized.length,2,'repeated strong labels on separate pages preserved');
 same(normalized.includes(earlier),true,'earliest positioned same-page declaration wins regardless of detector order');
 same(normalized.includes(different),true,'new chapter repeat survives');
}
const owner={page:3,proofPage:3,proofRatio:.5,ratio:.5};
same(c.resolveStructureReferenceOccurrence([later,earlier],owner),earlier,'forward same-page declaration rejected');
same(c.resolveStructureReferenceOccurrence([earlier,later],{...owner,proofRatio:.9}),later,'nearest preceding declaration chosen');
same(c.resolveStructureReferenceOccurrence([later],owner),null,'unique forward occurrence cannot be linked');
same(c.resolveStructureReferenceOccurrence([different],owner),null,'future page cannot be linked');
same(c.resolveStructureReferenceOccurrence([different,earlier],{page:6,ratio:.2}),different,'nearest earlier page wins');
same(c.resolveStructureReferenceOccurrence([different,earlier],{page:0,ratio:.2}),null,'invalid owner page cannot invent dependency');
same(c.resolveStructureReferenceOccurrence([later,earlier],{page:3,ratio:null}),later,'unknown owner ratio does not manufacture zero');
same(c.resolveStructureReferenceOccurrence([{label:'Lemma',page:3,ratio:null},earlier],owner),earlier,'unknown declaration ratio cannot beat measured geometry');
console.log('PASS',n,'v447 declaration/reference chronology assertions');
