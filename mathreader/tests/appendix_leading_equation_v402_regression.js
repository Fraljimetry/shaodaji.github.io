'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/41-equations-bibliography.js'),'utf8');
const core=fs.readFileSync(path.join(root,'js/00-core.js'),'utf8');
const context=vm.createContext({document:{addEventListener(){}},console});
vm.runInContext("let equationNumberingSide='left'; const EQUATION_TAG_SYMBOL_CLASS='*†‡';",context);
vm.runInContext(source,context,{timeout:15000});
const indexFor=(data)=>new Map(data.map(([label,page,ratio,ocrSource])=>[label,[{label,page,ratio,ocrSource:!!ocrSource}]]));
const giusti=indexFor([['(A.2)',231,.381],['(A.3)',231,.488],['(A.4)',233,.266],['(A.5)',233,.474]]);
const plan=context.equationNativeImageGapPlan(giusti,253);
assert.ok(plan.pages.includes(231),'Giusti original PDF p231 must be selected to verify missing printed (A.1)');
assert.ok(plan.expectedByPage.get(231)?.has('(A.1)'),'OCR must seek printed (A.1), never insert it directly');
assert.ok(!giusti.has('(A.1)'),'planning must not invent (A.1)');
assert.ok(!context.equationNativeImageGapPlan(indexFor([['(A.2)',231,.38],['(A.3)',231,.49],['(A.4)',233,.27]]),253).expectedByPage.get(231)?.has('(A.1)'),'three-tag family not sufficient');
assert.ok(!context.equationNativeImageGapPlan(indexFor([['(A.1)',231,.28],['(A.2)',231,.38],['(A.3)',231,.49],['(A.4)',233,.27]]),253).expectedByPage.get(231)?.has('(A.1)'),'do not scan for existing tag');
assert.ok(!context.equationNativeImageGapPlan(indexFor([['(A.2)',230,.38],['(A.3)',231,.49],['(A.4)',233,.27],['(A.5)',233,.47]]),253).expectedByPage.get(230)?.has('(A.1)'),'anchor must be same page');
assert.ok(!context.equationNativeImageGapPlan(indexFor([['(A.2)',231,.38,1],['(A.3)',231,.49],['(A.4)',233,.27],['(A.5)',233,.47]]),253).expectedByPage.get(231)?.has('(A.1)'),'OCR-only anchor cannot establish native gap');
// Original-PDF Tesseract crop contains the exact text; the test asserts the
// production candidate parser recognizes that observed margin text, not a guess.
assert.ok(context.equationLabelCandidatesInLine('(A.1)  8(Rn) 8 M').some(x=>x.label==='(A.1)'),'observed OCR label parse');
assert.ok(source.includes('await persistEquationMarginOcrEvidence(sourceDoc, sourceKey)'),'auto scan persistence retained');
// User-invoked meticulous page OCR is also a completed margin observation.
const meticulous=source.match(/async function meticulousEquationMarginEvidence\([^]*?\n\}/)?.[0];
assert.ok(meticulous,'meticulous margin OCR source exists');
assert.ok(meticulous.includes('equationSupplementalOcrCache.set('),'meticulous observation saved to shared cache');
assert.ok(meticulous.includes('await persistEquationMarginOcrPage('),'meticulous OCR evidence persisted before returning');
(async()=>{
  const doc={numPages:253};
  let persisted=0;
  const ctx={
    pdfDoc:doc,currentFileKey:'sha256:giusti',equationNumberingSide:'left',
    equationSupplementalOcrCache:new Map(),
    equationMarginOcrLines:async()=>[{text:'(A.1)',ratio:.28,xStartRatio:.082,xEndRatio:.13,parts:[]}],
    persistEquationMarginOcrPage:async()=>{persisted++;return true},
    equationLabelCandidatesInLine:()=>[],
    Map, Number, console
  };
  const tested=vm.runInNewContext(meticulous+'\nmeticulousEquationMarginEvidence',ctx);
  const result=await tested(doc,231,{},{});
  assert.equal(result.length,0,'absence of validated OCR candidates does not fabricate indexed equations');
  assert.equal(persisted,1,'page OCR persists exactly once');
  assert.equal(ctx.equationSupplementalOcrCache.get('sha256:giusti|left|231')[0].ratio,.28,'exact observed page geometry is retained');
  let resume;
  ctx.equationMarginOcrLines=()=>new Promise(r=>{resume=r});
  const deferred=tested(doc,232,{},{});
  ctx.currentFileKey='sha256:other-document';
  resume([{text:'(A.2)',ratio:.38}]);
  assert.equal((await deferred).length,0,'late OCR cannot publish into another PDF');
  assert.equal(persisted,1,'foreign-document OCR never writes storage');
  console.log('PASS | v402 Giusti leading appendix equation + meticulous OCR persistence | 15 assertions');
})().catch(error=>{console.error(error);process.exitCode=1});
