// A first-crop image pipeline must remain exclusive after startup completes,
// and a stale document's pending crop must not publish into the replacement.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const engine = fs.readFileSync(path.join(root, 'js/10-formula-ocr.js'), 'utf8');
const vector = fs.readFileSync(path.join(root, 'js/11-formula-vector.js'), 'utf8');
const engineStart = engine.indexOf('// Formula recognition begins after the first completed crop.');
const engineEnd = engine.indexOf('\nfunction schedulePdfCorePreload()', engineStart);
const cropStart = vector.indexOf('async function recognizeMathCrop(');
const cropEnd = vector.indexOf('\n\nasync function canvasFromDataUrl(', cropStart);
assert.ok(engineStart > 0 && engineEnd > engineStart && cropStart > 0 && cropEnd > cropStart);
function deferred() { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise, resolve}; }
const inference = deferred();
let pipelineRuns = 0;
let commits = 0;
const doc1 = {name:'old'};
const doc2 = {name:'new'};
const button = {disabled:false, setAttribute(){}, classList:{add(){},remove(){}}};
const context = vm.createContext({
  console, performance:{now:()=>Date.now()}, setTimeout, clearTimeout,
  pdfDoc:doc1, currentFileKey:'old', currentPage:1, mathOcrPipeline:null,
  mathOcrInitPromise:null, mathOcrModulePromise:null, mathOcrInitializationFailed:false,
  mathOcrBackend:null, mathOcrReadyAt:null, mathOcrInferenceRuns:0,
  mathOcrLoading:false, formulaExtractionMode:'image', mathOcrButton:button,
  TRANSFORMERS_RUNTIME:'test', TRANSFORMERS_URL:'test', MATH_OCR_MODEL:'test',
  ocrNow:()=>Date.now(), t:en=>en,
  setOcrMode(){}, setOcrProcessing(){}, setOcrStatus(){},
  updateOcrInteractionAvailability(){},
  updateOcrCapability(){}, currentOcrPlan:()=>[{label:'CPU',official:true}],
  logOcrTiming(){}, showNotice(){}, showError(err){throw new Error(err)},
  yieldForOcrProgressPaint:async()=>{},
  extractVectorFormulaFromLayer:()=>null,
  ocrApproxTokenCount:()=>1,
  commitFormulaResult(){commits++;}, disposeMathOcrPipeline:async()=>{},
  lastOcrRunTiming:null,
  runImageFormulaRecognition:async()=>{
    await vm.runInContext('ensureMathOcrPipeline()',context);
    return inference.promise;
  }
});
vm.runInContext(engine.slice(engineStart, engineEnd), context, {timeout:5000});
vm.runInContext(vector.slice(cropStart,cropEnd),context,{timeout:5000});
context.mockPipeline = async () => {pipelineRuns++; return {dispose:async()=>{}};};
vm.runInContext('importFormulaOcrRuntime = async () => ({pipeline: mockPipeline})',context);
const crop = {width:100,height:40,toDataURL:()=> 'data:image/png;base64,AA=='};
context.crop = crop;
(async()=>{
  const oldJob = vm.runInContext("recognizeMathCrop(crop, 1, 'primary')",context);
  // Wait for the engine to become ready, but keep the first inference unfinished.
  for (let i=0; i<30 && !context.mathOcrPipeline;i++) await new Promise(r=>setImmediate(r));
  assert.ok(context.mathOcrPipeline,'first model initialized');
  await new Promise(r=>setImmediate(r));
  assert.equal(context.mathOcrLoading,true,'ocr remains busy throughout first-crop inference');
  assert.equal(pipelineRuns,1,'one initialization');
  // Even if the user switches documents, the old job remains exclusive until it settles.
  context.pdfDoc=doc2; context.currentFileKey='new';
  const newJob=vm.runInContext("recognizeMathCrop(crop, 2, 'primary')",context);
  await new Promise(r=>setImmediate(r));
  assert.equal(commits,0,'no stale result yet');
  inference.resolve({latex:'x',penalty:0,timing:{},inferenceCount:1});
  await Promise.all([oldJob,newJob]);
  assert.equal(commits,0,'old result never published in new document');
  assert.equal(context.mathOcrLoading,false,'crop completion releases busy state');
  assert.equal(pipelineRuns,1,'no duplicate pipeline initialization');
  console.log('PASS: first-crop OCR remains exclusive through inference and ignores stale documents');
})().catch(e=>{console.error(e);process.exitCode=1;});
