// v444: proof ownership must respect explicit targets, page age and columns.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({console,document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8'),ctx,{timeout:20000});
let n=0;
const check=(actual,expected,msg)=>{assert.equal(actual,expected,msg);n++;};
const entries=[{label:'Theorem 2.1',page:17,declarationXStartRatio:.11},{label:'Lemma 2.2',page:18,declarationXStartRatio:.58},{label:'Theorem 2.3',page:18,declarationXStartRatio:.1}];
const proof=x=>({xStartRatio:x});
check(ctx.resultProofTarget(entries,'Lemma 9.9',18,proof(.1)),null,'unresolved explicit lemma never becomes unrelated theorem');
check(ctx.resultProofTarget(entries,'Lemma 2.2',18,proof(.1)),entries[1],'explicit reference selects printed lemma');
check(ctx.resultProofTarget(entries,'Theorem 2.1',18,proof(.1)),entries[0],'explicit reference can target previous page');
check(ctx.resultProofTarget(entries,'',18,proof(.59)),entries[1],'unnumbered proof right column');
check(ctx.resultProofTarget(entries,'',18,proof(.12)),entries[2],'unnumbered proof left column');
check(ctx.resultProofTarget(entries,'',20,proof(.1)),null,'distant stale result not claimed');
check(ctx.resultProofTarget(entries,'',18,{}),entries[2],'missing proof geometry preserves behavior');
check(ctx.resultProofTarget([{label:'Proposition 7.1',page:18,declarationXStartRatio:null}],'',18,proof(.7)).label,'Proposition 7.1','missing result geometry preserves behavior');
check(ctx.resultProofTarget([{label:'Theorem 2.1',page:15,declarationXStartRatio:.1}], 'Theorem 2.1',18,proof(.1)).label,'Theorem 2.1','explicit printed label may refer back several pages');
for(const [input,expected] of [
 ['Proof of Theorem A.3','Theorem A.3'],
 ['Proof of Lemma 2.1','Lemma 2.1'],
 ['Proof of Corollary 5.2.1','Corollary 5.2.1'],
 ['Proof of Claim B.4','Claim B.4'],
 ]) check(ctx.resultProofHeading(input).printedReference,expected,`printed proof target ${input}`);
check(ctx.resultProofHeading('Proof of Theorem ???').explicitTarget,true,'damaged explicit target remains explicit');
check(ctx.resultProofHeading('Proof').explicitTarget,false,'unnumbered Proof remains implicit');
console.log(`PASS ${n} proof ownership assertions`);
