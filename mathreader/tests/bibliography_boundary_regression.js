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
// Genuine old-scan failure class: [11] may OCR as "{lj ," with the
// entire closing bracket lost. Recognition is provisional until [10]/[12]
// uniquely enclose it in document order.
const newBody='Global properties of minimal surfaces in E3 and E4, Ann. of Math. (2) 80 (1964) 340-364.';
const ocrLine=(xStartRatio=0.06,ocrSource=true)=>({xStartRatio,ocrSource,ratio:0.78});
const damaged=context.malformedNumericBibliographyCandidate('{lj , '+newBody,ocrLine(),19);
check(damaged?.digitText,'11','opening-brace OCR {lj , supplies candidate 11');
check(damaged?.body,newBody,'candidate retains actual bibliography body');
entries=[{...anchor(10,0.69),page:19},{...anchor(12,0.83),page:19}];
check(probe(entries,[damaged]),1,'bounded [10]/[12] recover the damaged [11]');
check(entries.map(e=>e.label),['[10]','[11]','[12]'],'candidate inserted in sequence, not merged into [10]');
check(context.malformedNumericBibliographyCandidate('{lj , '+newBody,ocrLine(0.46),19),null,'middle-page candidate rejected');
check(context.malformedNumericBibliographyCandidate('{lj , '+newBody,ocrLine(0.06,false),19),null,'native text cannot use OCR-only repair');
check(context.malformedNumericBibliographyCandidate('{lj , Ordinary prose without publication markers',ocrLine(),19),null,'weak body rejected');
check(context.malformedNumericBibliographyCandidate('{lj an ordinary sentence '+newBody,ocrLine(),19),null,'missing punctuation cannot create numeric key');
entries=[{...anchor(10,0.69),page:19},{...anchor(13,0.83),page:19}];
check(probe(entries,[context.malformedNumericBibliographyCandidate('{lj , '+newBody,ocrLine(),19)]),0,'wrong bracketing neighbors rejected');
entries=[{...anchor(10,0.69),page:19},{...anchor(12,0.83),page:19}];
check(probe(entries,[context.malformedNumericBibliographyCandidate('{lj , '+newBody,ocrLine(),19),context.malformedNumericBibliographyCandidate('{lj , '+newBody,ocrLine(),19)]),0,'ambiguous competing OCR candidates rejected');
console.log(`OK: ${checks} boundary-bibliography class assertions`);
