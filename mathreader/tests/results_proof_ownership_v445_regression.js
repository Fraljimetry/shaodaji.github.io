// v445: proof targets must precede their proof in visual order.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({console,document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8'),ctx,{timeout:20000});
const candidates=[
  {label:'Theorem 4.1',page:10,ratio:.12,declarationXStartRatio:.10},
  {label:'Lemma 4.2',page:10,ratio:.83,declarationXStartRatio:.10},
  {label:'Theorem 4.3',page:11,ratio:.14,declarationXStartRatio:.10}
];
assert.equal(ctx.resultProofTarget(candidates,'Lemma 4.2',10,{ratio:.35,xStartRatio:.10}),null,'later declaration must not match explicit proof');
assert.equal(ctx.resultProofTarget(candidates,'',10,{ratio:.35,xStartRatio:.10}),candidates[0],'unnumbered proof must select preceding result');
assert.equal(ctx.resultProofTarget(candidates,'Lemma 4.2',10,{ratio:.90,xStartRatio:.10}),candidates[1],'later proof can match same-page declaration');
assert.equal(ctx.resultProofTarget(candidates,'Theorem 4.3',10,{ratio:.95,xStartRatio:.10}),null,'future page must not match');
assert.equal(ctx.resultProofTarget(candidates,'Lemma 4.2',11,{ratio:.05,xStartRatio:.10}),candidates[1],'preceding page remains valid');
assert.equal(ctx.resultProofTarget(candidates,'',10,{xStartRatio:.10}),candidates[1],'missing coordinates preserve fallback');
assert.equal(ctx.proofLineSameColumn(.10,.60),false,'other column cannot contribute proof references or QED');
assert.equal(ctx.proofLineSameColumn(.10,.14),true,'same column remains available');
assert.equal(ctx.proofLineSameColumn(null,.60),true,'unknown geometry retains legacy fallback');
assert.equal(ctx.proofLineSameColumn(.10,NaN),true,'invalid geometry must not invent different-column evidence');
console.log('PASS 10 proof ordering and column assertions');
