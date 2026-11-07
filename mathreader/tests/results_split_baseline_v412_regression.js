'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8');
const ctx=vm.createContext({console,document:{addEventListener(){}}});vm.runInContext(src,ctx,{timeout:10000});
function found(lines){ctx.lines=lines;return vm.runInContext('detectedStructureResult(lines,0,23)',ctx,{timeout:3000})}
const base={text:'THEOREM Let P k and let The a symmetric (k 2)-tensor on',ratio:.1733,xStartRatio:.150,xEndRatio:.881,parts:[{start:0,end:7,xStartRatio:.150,xEndRatio:.2404},{start:8,end:11,xStartRatio:.282,xEndRatio:.319}]};
const number={text:'5.2. e M, ^ 0, +',ratio:.1701,xStartRatio:.2404,xEndRatio:.756,parts:[{start:0,end:4,xStartRatio:.2404,xEndRatio:.282},{start:5,end:6,xStartRatio:.335,xEndRatio:.343}]};
assert.equal(found([base,number])?.label,'Theorem 5.2','recover actual printed number on slightly shifted baseline');
assert.equal(found([{...base,text:'LEMMA The eigenvalues ofr k on @ are',ratio:.837,xStartRatio:.1542,parts:[{start:0,end:5,xStartRatio:.1542,xEndRatio:.2215}]},{...number,text:'5.3. 2',ratio:.8337,xStartRatio:.2215,parts:[{start:0,end:4,xStartRatio:.2215,xEndRatio:.264}]}])?.label,'Lemma 5.3','lemma with shifted number');
assert.equal(found([{...base,text:'THEOREM If N is asymptotically flat with metric g',ratio:.6158,xStartRatio:.1525,parts:[{start:0,end:7,xStartRatio:.1525,xEndRatio:.2432}]},{...number,text:'9.6 [ADM, B].',ratio:.6125,xStartRatio:.2432,parts:[{start:0,end:13,xStartRatio:.2432,xEndRatio:.4024}]}])?.label,'Theorem 9.6','bibliographic attribution following a split printed heading');
for(const altered of [
 {...number,ratio:.19}, // distant baseline
 {...number,xStartRatio:.7,parts:[{start:0,end:4,xStartRatio:.7,xEndRatio:.743}]}, // unrelated column
 {...number,text:'5.2 (see above)'}, // not printed numbered fragment punctuation
 {...number,parts:[]} // no native span evidence
]) assert.equal(found([base,altered]),null,'ambiguous nearby number must not be promoted');
assert.equal(found([{...base,text:'Theorem Let P k and let ...'},number]),null,'prose lower-case/theorem reference has no uppercase heading proof');
assert.equal(found([base]),null,'do not invent missing number');
// Concrete two-span number/type evidence must win over a later prose-looking
// mention of the same label even if the latter happens to have a period.
ctx.duplicateRows = [
  {key:'39:lemma 9.1',label:'Lemma 9.1',page:39,ratio:.76,declarationEvidence:'split-baseline'},
  {key:'40:lemma 9.1',label:'Lemma 9.1',page:40,ratio:.86,declarationEvidence:'explicit-statement'},
];
const unique = vm.runInContext('normalizeSequentialStructureEntries(duplicateRows)',ctx);
assert.equal(unique.length,1);
assert.equal(unique[0].page,39);
console.log('Results baseline-split v412: 11 assertions passed');
