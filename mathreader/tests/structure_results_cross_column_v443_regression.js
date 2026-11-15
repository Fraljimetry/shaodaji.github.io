'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const resultSource=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const outlineSource=fs.readFileSync(path.join(root,'js/40-outline-structure.js'),'utf8');
const ctx=vm.createContext({console});
function load(src,start,end){const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert(a>=0&&b>a,start);vm.runInContext(src.slice(a,b),ctx)}
load(resultSource,'function normalizedReferenceLabel(', '\nfunction structureResultParentheticalHeadingTail(');
load(outlineSource,'function structureHeadingRowSegments(', '\nfunction structureHeadingRowFragments(');
const wrapped=ctx.structureResultWrappedProseReference;
const heading='Theorem 2.3. Let f be continuous';
const current={text:heading,ratio:.41,xStartRatio:.09,xEndRatio:.46};
assert.equal(wrapped([{text:'By',ratio:.39,xStartRatio:.10,xEndRatio:.2},current],1,heading),true,'same-column wrapped citation remains excluded');
assert.equal(wrapped([{text:'By',ratio:.39,xStartRatio:.60,xEndRatio:.86},current],1,heading),false,'right-column prose cannot suppress left-column theorem');
assert.equal(wrapped([{text:'By',ratio:.39,xStartRatio:.09,xEndRatio:.44},{...current,xStartRatio:.61,xEndRatio:.92}],1,heading),false,'left-column prose cannot suppress right-column theorem');
const segments=ctx.structureHeadingRowSegments;
const row={text:'2 Introduction 3 Other',ratio:.2,xStartRatio:.10,xEndRatio:.9,parts:[{start:0,end:14,xStartRatio:.1,xEndRatio:.42},{start:15,end:22,xStartRatio:.55,xEndRatio:.80}]};
assert.equal(segments(row).length,2,'well formed split yields two headings');
const malformed=[
 [{start:15,end:22,xStartRatio:.55,xEndRatio:.8},{start:0,end:14,xStartRatio:.1,xEndRatio:.42}],
 [{start:0,end:14,xStartRatio:.1,xEndRatio:.42},{start:12,end:22,xStartRatio:.55,xEndRatio:.8}],
 [{start:0,end:14,xStartRatio:.1,xEndRatio:.42},{start:15,end:22,xStartRatio:.2,xEndRatio:.8}],
];
for(const parts of malformed){const entries=segments({...row,parts});assert.equal(entries.length,1,'malformed part order/overlap cannot be trusted as two separate columns');assert.equal(entries[0].text,row.text)}
console.log('PASS v443 cross-column Results and malformed heading geometry');
const all=vm.createContext({console,document:{addEventListener(){}}});
vm.runInContext(resultSource,all,{timeout:15000});
const rows=[{text:'10-4 PROOF OF THE UNIFORMIZATION',ratio:.35,xStartRatio:.60,xEndRatio:.91},{text:'THEOREM (PART I)',ratio:.37,xStartRatio:.11,xEndRatio:.43}];
assert.equal(all.detectedStructureResult(rows,1,7)?.title,'THEOREM (PART I)','opposite-column proof heading cannot hide a theorem');
assert.equal(all.detectedStructureResult([{...rows[0],xStartRatio:.12,xEndRatio:.42},rows[1]],1,7),null,'same-column proof heading continuation still excluded');
