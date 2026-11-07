// v409: real historical PDF.js lines must not promote wrapped prose references
// or allow a weak citation to remove a later explicit numbered theorem.
// Standalone: node mathreader/tests/results_wrapped_references_v409_regression.js
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console,document:{addEventListener(){}},setTimeout});
vm.runInContext(fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8'),context,{timeout:20000});
let checks=0;
function check(value, why){assert.ok(value,why);checks++;}
function equal(a,b,why){assert.equal(a,b,why);checks++;}
function row(text,ratio,x=0.084){return {text,ratio,xStartRatio:x,xEndRatio:0.82,parts:[{start:0,end:text.length,xStartRatio:x,xEndRatio:.82}]};}
function detected(rows,i=0,page=3){return context.detectedStructureResult(rows,i,page);}
// Exact textual observations and relative line positions from the original
// Giusti p.150 export (the source print was independently inspected).
const giusti150=[
 row('to be Lipschitz-continuous or even smoother (in general cpEC 2 will be sufficient).',.419),
 row('In the following chapters we discuss continuous (see theorem 13.6) and L 1 (see',.440),
 row('Theorem 14.5) boundary data.',.461),
 row('We shall work in the space C 0 • 1 (n) of Lipschitz-continuous functions in',.482,.109),
];
equal(detected(giusti150,2,150),null,'wrapped (see Theorem 14.5) is reference, not declaration');
// Exact lines from PDF.js fixture prepared from Yau p.39; the printed lemma
// statement is on p.38, not at this p.39 text continuation.
const yau=JSON.parse(fs.readFileSync(path.join(root,'regression/yau_results_control_v395.json'),'utf8'));
const yau39=yau.pages.find(x=>x.page===39).detectorInputLines;
const yLemma=yau39.findIndex(x=>/^Lemma 1\.$/.test(x.text));
check(yLemma>=1,'Yau p39 exact wrapped Lemma 1 line exists');
equal(detected(yau39,yLemma,39),null,'deduce / Lemma 1 sentence wrap is not a declaration');
const yau38=yau.pages.find(x=>x.page===38).detectorInputLines;
const realLemma=yau38.findIndex(x=>/^LEMMA\. Let/.test(x.text));
check(realLemma>=0,'Yau p38 actual printed lemma exists');
equal(detected(yau38,realLemma,38)?.label,'Lemma · p.38','unnumbered real lemma survives');
// Wrapped prose starts must not promote a bare result even if they lose a dot
// or are followed by a sentence that looks like the next assertion.
for(const [pre,current] of [
 ['We can now deduce','Lemma 4.'],
 ['It follows from','Theorem 10.2.'],
 ['The argument is completed by','Proposition 3.4'],
 ['For details (see','Theorem 14.5) boundary conditions.'],
 ['Hence this is an application of','Corollary 3.1. For the other cases'],
 ]){
  equal(detected([row(pre,.40),row(current,.423)],1),null,`reference continuation ${pre} / ${current}`);
}
for(const candidate of [
 'Proposition 3.1, we may assume that inequality holds',
 'Theorem 1.19; a diagonal process gives the required sequence',
 'Theorem 2.1(a). Then for every epsilon there exists a constant',
 'Lemma 3.4.2(b) and therefore the claim follows',
 ]) equal(detected([row(candidate,.4)]),null,'partial prefix never invents result from longer numbered reference: '+candidate);
// Exact number-first heading corpus from Giusti original PDF.js export.
for(const [text,label,page] of [
 ['12.9 Theorem: Let cp be a Lipschitz-continuous function on an, and suppose','Theorem 12.9',154],
 ['13.2 Theorem: Let u be a smooth solution of the minimal surface equation in','Theorem 13.2',165],
 ['14.5 Theorem: Let Q be a bounded open set with Lipschitz-continuous boundary','Theorem 14.5',175],
 ]) {
  const d=detected([row(text,.55)],0,page);equal(d?.label,label,'actual numbered-first result preserved');
  check(d?.declarationEvidence==='number-first','printed number-first form carries strong evidence');
}
const sequence=[
 {label:'Theorem 14.5',title:'Theorem 14.5. boundary data.',page:150,ratio:.461},
 ...[[154,'12.9'],[157,'12.10'],[158,'12.11'],[158,'12.12'],[165,'13.2'],[166,'13.4'],[168,'13.5'],[169,'13.6'],[170,'13.7'],[172,'13.8'],[173,'14.2'],[175,'14.5']].map(([page,n])=>({...detected([row(`${n} Theorem: Let x satisfy the hypotheses`,.52)],0,page),page,ratio:.52})),
];
const accepted=Array.from(context.normalizeSequentialStructureEntries(sequence));
for(const item of sequence.slice(1))check(accepted.some(x=>x.label===item.label&&x.page===item.page),`${item.label} survives even when earlier weak reference appears`);
equal(accepted.filter(x=>x.label==='Theorem 14.5').length,1,'one 14.5 declared');
equal(accepted.find(x=>x.label==='Theorem 14.5')?.page,175,'printed declaration outranks earlier citation');
// True standalone type-first declarations are still recognized.
for(const text of ['Lemma 2.3. Let u be smooth','Theorem B.3 (Bounded extension). Suppose F is a field','Theorem 3) For every x'])
 check(Boolean(detected([row(text,.5)])),`real type-first declaration preserved ${text}`);
console.log(`PASS ${checks} wrapped-reference historical Results assertions`);
