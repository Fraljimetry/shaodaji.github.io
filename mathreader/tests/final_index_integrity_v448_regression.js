'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c=vm.createContext({console,document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/41-equations-bibliography.js'),'utf8'),c,{timeout:20000});
let checks=0;
function eq(actual, expected, note) {assert.equal(actual,expected,note);checks++;}
const row=(label,page,ratio,evidence='weak')=>({label,page,ratio,declarationEvidence:evidence});
const a=row('Theorem 2',2,.2),b=row('Theorem 3',2,.6);
for (const observations of [[b,a],[a,b]]) {
 const output=c.normalizeSequentialStructureEntries(observations);
 eq(output.length,2,'shuffled weak numbered declarations must survive');
 eq(output[0],a,'printed order is canonical');
 eq(output[1],b,'last numbered declaration retained');
}
const fragments=Array.from({length:140000},(_,i)=>({start:i,end:i+1,xStartRatio:.1,xEndRatio:.2}));
const merged={text:'x'.repeat(fragments.length)};
const split=c.equationLineFragmentForColumns(merged,fragments,0,.1,.2);
eq(split?.text.length,140000,'large fragment array cannot overflow function argument stack');
eq(split?.xStartRatio,.1,'column geometry starts accurately');
eq(split?.xEndRatio,.2,'column geometry ends accurately');
eq(c.equationLineFragmentForColumns({text:'abc'},[{start:0,end:5,xStartRatio:.1,xEndRatio:.2}],0,0,.5),null,'out-of-bounds fragments rejected');
eq(c.equationLineFragmentForColumns({text:'abc'},[{start:0,end:2,xStartRatio:NaN,xEndRatio:.2}],0,0,.5)?.text,'ab','missing optional x start maintains legacy 0 fallback');
console.log('PASS',checks,'v448 final index integrity assertions');
