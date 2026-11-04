// Class-level OCR bibliography regression: damaged first key, established numeric sequence.
// Run from Workspace root: node mathreader/tests/bibliography_boundary_regression.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const context=vm.createContext({document:{addEventListener(){}},console});
vm.runInContext(source,context,{timeout:8000});
const strong='J. F. Adams, Vector fields on spheres, Ann. of Math. (2) 75 (1962), 603-632; Russian transl.';
const anchor=(number,ratio)=>({number,label:`[${number}]`,page:9,ratio,title:`A. Mathematician, Mathematical Research (1965), 101-200.`,citations:[]});
const candidate=(token='{i}',opts={})=>({token,bracketedSingleGlyph:true,digitText:'',body:strong,page:9,ratio:0.72,xStartRatio:0.08,ocrSource:true,used:false,continuations:[],...opts});
const series=()=>[anchor(2,0.76),anchor(3,0.82),anchor(4,0.88),anchor(5,0.90)];
let checks=0;
function check(got, expected, message){assert.deepEqual(got,expected,message);checks+=1}
function probe(entries,candidates){return context.recoverSingleGapBibliographyCandidates(entries,candidates)}
let entries=series();let cases=[candidate()];
check(probe(entries,cases),1,'corrupt printed [1] as {i}, anchored to [2],[3],[4], must recover');
check(entries.map(e=>e.label),['[1]','[2]','[3]','[4]','[5]'],'recovery follows exact sequence at the correct position');
check(entries[0].page,9,'recovered reference keeps its observed page');
check(entries[0].ratio,0.72,'recovered reference keeps its observed vertical anchor');
check(cases[0].used,true,'recovery consumes candidate');
entries=series();check(probe(entries,[candidate('[B]')]),0,'author key B is not guessed to be first numbered entry');
entries=series();check(probe(entries,[candidate('{i}',{ocrSource:false})]),0,'native text is not heuristically rewritten');
entries=series();check(probe(entries,[candidate('{i}',{xStartRatio:0.48})]),0,'body/center paragraph is not promoted');
entries=series();check(probe(entries,[candidate('{i}',{ratio:0.95})]),0,'candidate after [2] is not promoted');
entries=series();check(probe(entries,[candidate('{i}',{page:8,ratio:0.85})]),0,'distant prior page does not qualify');
entries=series();check(probe(entries,[candidate('{i}'),candidate('{l}',{ratio:0.70})]),0,'ambiguous competing candidates reject recovery');
entries=[anchor(2,0.76),anchor(3,0.82)];check(probe(entries,[candidate('{i}')]),0,'weak 2-key sequence is insufficient');
entries=[anchor(2,0.76),anchor(3,0.82),anchor(5,0.88)];check(probe(entries,[candidate('{i}')]),0,'broken numeric anchor does not infer a missing first key');
entries=series();check(probe(entries,[candidate('{i}',{body:'This does not resemble a reference.'})]),0,'weak bibliography body does not qualify');
entries=[anchor(1,0.7),...series()];check(probe(entries,[candidate('{i}')]),0,'existing first key is not duplicated');
console.log(`OK: ${checks} boundary-bibliography class assertions`);
