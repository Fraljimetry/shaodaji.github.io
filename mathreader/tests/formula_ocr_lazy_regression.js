// MathReader v350: lazily load Texify only on the first image formula extraction.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const ocr = fs.readFileSync(path.join(root, 'js/10-formula-ocr.js'), 'utf8');
const vector = fs.readFileSync(path.join(root, 'js/11-formula-vector.js'), 'utf8');
const doc = fs.readFileSync(path.join(root, 'js/60-notes-bookmarks-data.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'js/70-command-ui-runtime.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
check(!ocr.includes('scheduleMathOcrPreload'), 'model preload scheduler eliminated');
check(!doc.includes('scheduleMathOcrPreload'), 'opening/restoring documents never preloads model');
check(!vector.includes('scheduleMathOcrPreload'), 'recognition failure never schedules background re-init');
check(!runtime.includes('scheduleMathOcrPreload'), 'settings/reset do not preload model');
check(runtime.includes('schedulePdfCorePreload();'), 'unrelated PDF.js startup warmup preserved');
check(vector.includes('const pipe = await ensureMathOcrPipeline();'), 'OCR inference lazily acquires the engine');
check(vector.includes("if (formulaExtractionMode === 'vector' && vector?.latex)"), 'usable vector formula bypasses image OCR');
check(html.includes('mathreader.js?v=364') && html.includes('mathreader.css?v=364'), 'v364 cache busting');
check(html.includes('The model loads on the next image formula extraction.'), 'reset hint describes lazy behavior');
check(runtime.includes('OCR reset · loads on next image extraction'), 'reset says it will not preload');
check(runtime.includes('OCR engine selected · loads on first image extraction'), 'engine settings say they will not preload');

const modeStart = ocr.indexOf('function updateOcrInteractionAvailability()');
const modeEnd = ocr.indexOf('\nfunction normalizedOcrEngineMode(', modeStart);
check(modeStart >= 0 && modeEnd > modeStart, 'actual selection-mode functions located');
let imports=0, statuses=[];
const button={disabled:true,attrs:{},classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this.attrs[k]=v;}};
const ctx = vm.createContext({
  pdfDoc:{},ocrMode:false,mathOcrLoading:false,mathOcrInitializationFailed:false,
  mathOcrPipeline:null,mathOcrBackend:null,mathOcrButton:button,ocrDrag:null,
  applyOcrModeToSurfaces(){},resetOcrBoxes(){},hideSelectionToolbar(){},
  window:{getSelection:()=>({removeAllRanges(){}})},
  autoOpenRightSection(){},setOcrStatus(msg){statuses.push(msg)},
  formulaExtractionMode:'image',matchMedia:()=>({matches:false}),
  shell:{classList:{add(){},remove(){}}},t:(en)=>en,
  ensureMathOcrPipeline:async()=>{imports++;return {};},
});
vm.runInContext(ocr.slice(modeStart,modeEnd),ctx,{timeout:5000});
const run = code => vm.runInContext(code,ctx);
run('updateOcrInteractionAvailability()');
check(!button.disabled, 'formula selection enabled before engine initialization');
run('setOcrMode(true)');
check(run('ocrMode') && imports===0, 'entering formula selection does not initialize OCR');
run('setOcrMode(false)');
check(!run('ocrMode') && imports===0, 'cancel selection without model initialization');
run('mathOcrLoading = true; updateOcrInteractionAvailability()');
check(button.disabled, 'selection blocked while image OCR is running');
run('mathOcrLoading = false; mathOcrInitializationFailed = true; updateOcrInteractionAvailability()');
check(button.disabled, 'failed image engine blocks implicit repeated image loads');
run('setOcrMode(true)');
check(!run('ocrMode') && imports===0 && statuses.some(x=>x.includes('Reset OCR')), 'failure guides explicit reset instead of loading');
run("formulaExtractionMode = 'vector'; updateOcrInteractionAvailability(); setOcrMode(true)");
check(run('ocrMode') && !button.disabled && imports===0, 'PDF-vector selection remains available after image OCR load failure');
run("setOcrMode(false); formulaExtractionMode = 'image'");
run('mathOcrInitializationFailed = false; updateOcrInteractionAvailability(); setOcrMode(true)');
check(run('ocrMode') && !button.disabled && imports===0, 'reset enables selecting without loading');
run('pdfDoc = null; updateOcrInteractionAvailability()');
check(button.disabled && !run('ocrMode'), 'no-document state still disables selection');

const cropStart=vector.indexOf('async function recognizeMathCrop(');
const cropEnd=vector.indexOf('\n\nasync function canvasFromDataUrl(',cropStart);
check(cropStart>=0 && cropEnd>cropStart, 'actual formula extraction handler located');
let imageRuns=0,vectorResults=0,processingCalls=0;
const extract=vm.createContext({
  ocrNow:()=>123,setOcrMode(){},mathOcrLoading:false,mathOcrBackend:null,
  formulaExtractionMode:'image',t:(en)=>en,console,
  extractVectorFormulaFromLayer:()=>({latex:'x+y',text:'x+y'}),
  stabilizeOcrLatexSyntax:x=>x,repairOcrLatex:x=>x,
  commitFormulaResult:()=>{vectorResults++},
  setOcrProcessing(){processingCalls++},setOcrStatus(){},
  yieldForOcrProgressPaint:async()=>{},
  runImageFormulaRecognition:async()=>{imageRuns++;return {latex:'x+y',penalty:0,timing:{},inferenceCount:1};},
  ocrApproxTokenCount:()=>3,logOcrTiming(){},
  updateOcrInteractionAvailability(){},disposeMathOcrPipeline:async()=>{},
  showError(err){throw new Error(err)},currentOcrResult:null,mathOcrInitializationFailed:false,
});
vm.runInContext(vector.slice(cropStart,cropEnd),extract,{timeout:5000});
const crop={width:100,height:40,toDataURL:()=> 'data:image/png;base64,AA=='};
extract.crop=crop;
(async()=>{
  check(imageRuns===0,'without an extraction no inference is requested');
  await vm.runInContext("recognizeMathCrop(crop, 1, 'primary')",extract);
  check(imageRuns===1 && processingCalls===2, 'first image extraction requests OCR exactly once');
  check(!extract.mathOcrLoading, 'first extraction releases busy status');
  extract.ocrLayer={offsetHeight:100};extract.selectionRect={top:10,height:20};
  extract.formulaExtractionMode='vector';
  await vm.runInContext("recognizeMathCrop(crop, 1, 'primary', ocrLayer, selectionRect)",extract);
  check(imageRuns===1 && vectorResults===2, 'valid vector extraction remains model-free');
  extract.mathOcrInitializationFailed=true;
  extract.extractVectorFormulaFromLayer=()=>null;
  await vm.runInContext("recognizeMathCrop(crop, 1, 'primary', ocrLayer, selectionRect)",extract);
  check(imageRuns===1, 'failed model with unavailable PDF vector does not silently retry');
  extract.mathOcrInitializationFailed=false;
  extract.formulaExtractionMode='image';
  await vm.runInContext("recognizeMathCrop(crop, 1, 'primary')",extract);
  check(imageRuns===2,'subsequent explicit image extraction still works');
  console.log(`OK: ${checks} formula OCR lazy-initialization assertions`);
})().catch(e=>{console.error(e);process.exitCode=1});
