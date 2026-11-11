// v429: exercise real runImageFormulaRecognition with a deterministic mock image model.
// No remote model is installed here; this certifies retry control flow only.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=fs.readFileSync(path.join(root,'js/10-formula-ocr.js'),'utf8');
const vector=fs.readFileSync(path.join(root,'js/11-formula-vector.js'),'utf8');
const f=require(path.join(root,'regression/fixtures/extreme_formula_ocr_v429.json')).cases;
const severe=f.find(v=>v.id==='extreme-04').raw;
const names=['normalizeOcrLatex','splitTopLevelOcrAlignmentCells','formulaOcrLayoutAnomalies','repairOcrLatex','repairOcrMisplacedAlignmentTabs','repairLatexInnerTags','repairLatexSpecialCharacters','stabilizeOcrLatexSyntax','findRepeatedLatexSequence','assessImageOcrResult','imageOcrCorruptionScore','latexStructuralPenalty'];
function pick(src,n){const a=src.indexOf(`function ${n}(`);assert(a>=0,n);let b=src.indexOf('\nfunction ',a+1);if(b<0)b=src.length;return src.slice(a,b)}
const source=vector.slice(vector.indexOf('async function runImageFormulaRecognition('), vector.indexOf('\nfunction commitFormulaResult('));
async function run(outputs, visualInkRows=0){
 const statuses=[],calls=[];
 const c=vm.createContext({
  t:en=>en,console,ocrNow:()=>Date.now(),navigator:{hardwareConcurrency:4,deviceMemory:8},
  document:{visibilityState:'visible'},mathOcrBackend:{device:'wasm'},
  mathOcrReadyAt:Date.now()-1000,mathOcrInferenceRuns:0,mathOcrLoading:false,
  ensureMathOcrPipeline:async()=>async(input,config)=>{
    calls.push({input,config});const next=outputs.shift();
    if(next instanceof Error)throw next;
    return [{generated_text:next}];
  },
  analyzeFormulaSelection:()=>({tensorLike:false,expectedRows:0,aspect:1,visualInkRows}),
  normalizeFormulaCropForOcr:(canvas,variant)=>({width:variant==='tight'?900:760,height:100,variant}),
  preprocessFormulaCanvas:(canvas)=>canvas,prepareMathOcrInput:async canvas=>canvas,
  ocrApproxTokenCount:s=>Math.max(1,Math.round(s.length/3)),ocrRate:()=>12,
  setOcrStatus:s=>statuses.push(s),fuseTensorOcrWithVector:()=>({applied:false,replacements:[],reason:'not needed'}),
 });
 vm.runInContext(names.map(n=>pick(engine,n)).join('\n')+'\n'+source,c);
 const result=await vm.runInContext('runImageFormulaRecognition({width:300,height:200})',c);
 return {result,calls,statuses};
}
(async()=>{
 const good=String.raw`\begin{aligned}E&=mc^2\\F&=ma\end{aligned}`;
 const clean=await run([good]);
 assert.equal(clean.calls.length,1,'clean input => exactly one inference');
 assert.equal(clean.result.inferenceCount,1);
 assert.equal(clean.result.latex,good);
 assert.equal(clean.result.timing.retryReason,'');
 const recovered=await run([severe,good]);
 assert.equal(recovered.calls.length,2,'severe output => exactly one retry');
 assert.equal(recovered.result.inferenceCount,2,'accurate inference count');
 assert.equal(recovered.calls[0].input.variant,'tight');
 assert.equal(recovered.calls[1].input.variant,'relaxed');
 assert.equal(recovered.calls[1].config.num_beams,2);
 assert.equal(recovered.result.latex,good,'non-corrupted second result selected');
 assert.equal(recovered.result.timing.retryFailed,false);
 assert(recovered.statuses.some(s=>s.includes('retrying once')),'retry disclosed in status');
 const both=await run([severe,severe]);
 assert.equal(both.calls.length,2,'catastrophic output cannot loop forever');
 assert.equal(both.result.assessment.retainedForReview,true);
 assert.equal(both.result.assessment.ok,false,'cannot report hard-rejected output as valid');
 assert.equal(both.result.timing.retryFailed,true);
 const failed=await run([severe,new Error('model inference failed')]);
 assert.equal(failed.calls.length,2);
 assert.equal(failed.result.inferenceCount,2,'failed retry still counts the attempted inference');
 assert.equal(failed.result.assessment.retainedForReview,true,'failed retry preserves editable first result');
 assert.equal(failed.result.timing.retryFailed,true);
 const dense=String.raw`\begin{aligned}\nabla_m F^{i_1\cdots i_r}_{j_1\cdots j_s}&=\partial_m F^{i_1\cdots i_r}_{j_1\cdots j_s}\\&+\sum_{n=1}^r\Gamma_{mk}^{i_n}F^{i_1\cdots k\cdots i_r}_{j_1\cdots j_s}\end{aligned}`;
 const valid=await run([dense]);
 assert.equal(valid.calls.length,1,'legitimate complex tensor needs no extra model call');
 const incomplete=await run([good], 15);
 assert.equal(incomplete.calls.length,1,'valid but short transcription is not automatically retried');
 assert(incomplete.result.assessment.warnings.some(s=>s.includes('may have missing lines')),
   'tall original image with only two decoded rows is marked for review');
 console.log('PASS: 21 bounded-retry, candidate selection and no-uncontrolled-call assertions');
})().catch(e=>{console.error(e);process.exitCode=1});
