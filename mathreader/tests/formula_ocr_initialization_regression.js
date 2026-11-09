// MathReader v416: first-crop lazy OCR model loading must not lock PDF reading.
// Run: node mathreader/tests/formula_ocr_initialization_regression.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(dir, 'js/10-formula-ocr.js'), 'utf8');
const start = src.indexOf('// Formula recognition begins after the first completed crop.');
const end = src.indexOf('\nfunction schedulePdfCorePreload()', start);
assert.ok(start > 0 && end > start);
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'mathreader.css'), 'utf8');
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
check(!html.includes('formula-ocr-init-overlay') && !css.includes('.formula-ocr-init-overlay'), 'no blocking first-crop OCR modal');
check(!src.includes('setFormulaOcrInitializationModal'), 'no modal state machine');
check(!src.slice(start, end).includes('.inert ='), 'loading never disables underlying controls');
check(!src.slice(start, end).includes('stopImmediatePropagation'), 'loading never steals reader keys or file drops');
check(!src.includes('scheduleMathOcrPreload'), 'model not loaded before first crop');
check(src.includes('mathOcrInitializationFailed = true;'), 'failed initialization remains latched until reset');
const runtime = fs.readFileSync(path.join(dir,'js/70-command-ui-runtime.js'),'utf8');
check(runtime.includes('setOcrMode(false); mathOcrInitializationFailed = false; await disposeMathOcrPipeline();'), 'deliberate user reset remains explicit');
check(!runtime.includes('scheduleMathOcrPreload()'), 'settings/reset do not auto-initialize');

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok,fail) => { resolve=ok; reject=fail; });
  return {promise,resolve,reject};
}
function harness({plan=[{label:'CPU',official:true}],limit=120000}={}) {
  const header={inert:false},reader={inert:false};
  const statuses=[],notices=[],states=[],listeners=[];
  const doc={body:{children:[header,reader]},addEventListener(type,handler,capture){listeners.push({type,handler,capture});}};
  const context=vm.createContext({
    document:doc, console, performance:{now:()=>Date.now()}, setTimeout,clearTimeout,
    mathOcrPipeline:null,mathOcrInitPromise:null,mathOcrModulePromise:null,mathOcrLoading:false,mathOcrInitializationFailed:false,
    mathOcrBackend:null,mathOcrReadyAt:null,mathOcrInferenceRuns:0,lastOcrEngineTiming:null,
    TRANSFORMERS_RUNTIME:'test-runtime', TRANSFORMERS_URL:'stub', MATH_OCR_MODEL:'stub-model',
    ocrNow:()=>Date.now(),t:(en)=>en,setOcrMode(){},
    setOcrStatus:msg=>statuses.push(msg),updateOcrInteractionAvailability(){states.push('availability');},
    updateOcrCapability(){},currentOcrPlan:()=>plan,logOcrTiming(){},showNotice:msg=>notices.push(msg)
  });
  const testedSource=src.slice(start,end).replace('const FORMULA_OCR_INIT_TIMEOUT_MS = 120000;', `const FORMULA_OCR_INIT_TIMEOUT_MS = ${limit};`);
  vm.runInContext(testedSource,context,{timeout:5000});
  const evalJs=(js)=>vm.runInContext(js,context);
  const call=()=>evalJs('ensureMathOcrPipeline()');
  const mockPipeline=(pipeline)=>{ context.testPipeline=pipeline;evalJs('importFormulaOcrRuntime = async () => ({pipeline: testPipeline})');};
  return {context,header,reader,listeners,statuses,notices,states,call,mockPipeline,evalJs};
}

async function tests() {
  const deferredModel=deferred();
  const h=harness();let calls=0;
  const pipe={dispose(){throw new Error('usable pipeline must not be disposed');}};
  h.mockPipeline(async () => {calls++;return deferredModel.promise;});
  check(h.evalJs('mathOcrInitPromise')===null && !h.evalJs('mathOcrLoading'), 'no eager initialization');
  const job1=h.call();
  const job2=h.call();
  check(h.evalJs('mathOcrLoading') && Boolean(h.evalJs('mathOcrInitPromise')), 'first extraction starts asynchronous shared initialization');
  check(h.header.inert===false && h.reader.inert===false, 'document and header stay interactive during pending engine load');
  check(h.listeners.length===0, 'no global keyboard/drop interception is installed');
  check(h.statuses.some(x=>x.includes('Initializing Formula OCR in background')), 'OCR panel reports loading');
  check(h.evalJs('mathOcrPipeline')===null, 'no fake ready pipeline during pending request');
  deferredModel.resolve(pipe);
  check(await job1===pipe && await job2===pipe && calls===1, 'concurrent crop requests share one model initialization');
  check(!h.evalJs('mathOcrLoading') && !h.header.inert && !h.reader.inert, 'successful load leaves reading interactive');
  check(h.evalJs('mathOcrPipeline')===pipe && h.evalJs('mathOcrInitPromise')===null, 'ready pipeline installed, pending request cleared');
  check(await h.call()===pipe && calls===1, 'warm engine reused');

  const f=harness(); f.mockPipeline(async()=>{throw new Error('offline');});
  await assert.rejects(f.call(),/offline/);checks++;
  check(!f.header.inert && !f.reader.inert && !f.evalJs('mathOcrLoading'), 'failed initialization cannot affect reading');
  check(f.evalJs('mathOcrPipeline')===null && f.evalJs('mathOcrInitPromise')===null, 'failed engine has no ready state');
  check(f.evalJs('mathOcrInitializationFailed')===true, 'failure latched until deliberate reset');
  check(f.notices.some(x=>x.includes('PDF reading is available')), 'OCR failure is explicitly nonfatal to reading');
  check(f.statuses.some(x=>x.includes('Reset OCR to retry')), 'failed-model retry guidance visible');
  let retried=0;
  const newPipe={};
  f.mockPipeline(async()=>{retried++;return newPipe;});
  check(await f.call()===newPipe && retried===1, 'user-requested retry may recover from offline load');
  check(f.evalJs('mathOcrInitializationFailed')===false, 'successful retry clears latch');

  const fall=harness({plan:[{label:'WebGPU',official:false,device:'webgpu',dtype:'q4f16'},{label:'CPU fallback',official:true}]});
  let attempts=0;
  const fallbackPipe={};
  fall.mockPipeline(async()=>{attempts++;if(attempts===1)throw new Error('WebGPU init failed');return fallbackPipe;});
  check(await fall.call()===fallbackPipe && attempts===2, 'explicit WebGPU to CPU backend plan preserved');
  check(!fall.reader.inert && !fall.header.inert, 'fallback does not block reading');

  const pending=deferred(),late=harness({limit:35});
  let disposed=0;
  late.mockPipeline(async()=>pending.promise);
  await assert.rejects(late.call(),/safety limit/);checks++;
  check(!late.reader.inert && !late.evalJs('mathOcrLoading'), 'timeout does not affect reading');
  check(late.evalJs('mathOcrPipeline')===null && late.evalJs('mathOcrInitPromise')===null, 'timed-out pipeline not installed');
  pending.resolve({dispose:async()=>{disposed++;}});
  await new Promise(r=>setTimeout(r,0));
  check(disposed===1 && late.evalJs('mathOcrPipeline')===null, 'late pipeline disposed rather than installed');

  const importPending=deferred(),stall=harness({limit:35});
  stall.context.importPending=importPending.promise;
  stall.evalJs('importFormulaOcrRuntime = () => importPending');
  await assert.rejects(stall.call(),/safety limit/);checks++;
  check(!stall.reader.inert && !stall.header.inert, 'stalled import does not block reader');
  check(stall.evalJs('mathOcrInitializationFailed')===true, 'timed-out import latched until reset');
  importPending.resolve({pipeline:async()=>({})});
  console.log(`OK: ${checks} non-blocking formula OCR initialization assertions`);
}
tests().catch(err=>{console.error(err);process.exitCode=1;});
