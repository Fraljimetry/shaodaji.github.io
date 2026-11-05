// MathReader v349: application-wide formula OCR initialization modal.
// Run: node mathreader/tests/formula_ocr_initialization_regression.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(dir, 'js/10-formula-ocr.js'), 'utf8');
const start = src.indexOf('// Only the initial model/runtime download');
const end = src.indexOf('\nfunction scheduleMathOcrPreload()', start);
assert.ok(start > 0 && end > start);
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'mathreader.css'), 'utf8');
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
check(html.includes('id="formula-ocr-init-overlay"') && html.includes('aria-modal="true"') && html.includes('role="dialog"'), 'accessible modal exists');
check(html.includes('data-zh="正在初始化公式 OCR"') && html.includes('even if OCR fails'), 'bilingual initialization and graceful failure text');
check(css.includes('.formula-ocr-init-overlay{position:fixed;inset:0;z-index:2000'), 'full-viewport modal above other UI');
check(!css.match(/\.formula-ocr-init-card[^}]*animation:/), 'startup card has no deceptive progress animation');
check(src.includes("if (!pdfDoc || restoringSession || documentOcrInteractionLocked()) return;"), 'preload still deferred until readable PDF');
check(!src.slice(start,end).includes('progress_callback: ()=>'), 'original backend callback is not replaced');
check(src.includes('if (mathOcrPipeline || mathOcrLoading || mathOcrInitializationFailed) return;'), 'failed preload is not automatically retried forever');
const runtime=fs.readFileSync(path.join(dir,'js/70-command-ui-runtime.js'),'utf8');
check(runtime.includes('setOcrMode(false); mathOcrInitializationFailed = false; await disposeMathOcrPipeline();'), 'explicit user reset and engine selection clear failure latch');

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok,fail) => { resolve=ok; reject=fail; });
  return {promise,resolve,reject};
}

function fakeElement() {
  return {inert:false, isConnected:true, classList: {
    hidden:true,
    add(c) { if (c==='is-hidden') this.hidden=true; },
    remove(c) { if (c==='is-hidden') this.hidden=false; }
  }, focused:false, focus() {this.focused=true;}};
}
function harness({plan=[{label:'CPU',official:true}],limit=120000}={}) {
  const overlay=fakeElement(), header=fakeElement(), main=fakeElement(), other=fakeElement();
  other.inert=true;
  const prev=fakeElement();
  const keys={};
  const statuses=[], notices=[], states=[];
  const doc={activeElement:prev,body:{children:[header,main,other,overlay]},addEventListener(type,handler,capture){if(type==='keydown'&&capture)keys.handler=handler;if(type==='drop'&&capture)keys.drop=handler;}};
  const context=vm.createContext({
    document:doc, console, performance:{now:()=>Date.now()}, setTimeout,clearTimeout,
    formulaOcrInitOverlay:overlay,
    formulaOcrInitModalVisible:false,formulaOcrInitPreviousFocus:null,formulaOcrInitInertElements:[],
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
  return {context,overlay,header,main,other,prev,keys,statuses,notices,states,call,mockPipeline,evalJs};
}

async function tests() {
  const deferredModel=deferred();
  const h=harness();let calls=0;
  const pipe={dispose(){ throw new Error('should not dispose a usable pipeline'); }};
  h.mockPipeline(async () => {calls++;return deferredModel.promise;});
  const job1=h.call();
  const job2=h.call();
  check(h.overlay.classList.hidden===false && h.header.inert && h.main.inert, 'start of loading blocks whole reader');
  check(h.other.inert === true, 'existing inert states are preserved while blocked');
  check(h.overlay.focused && h.evalJs('formulaOcrInitModalVisible'), 'overlay receives modal focus');
  const key={key:'o',preventDefault(){this.blocked=true;},stopImmediatePropagation(){this.stopped=true;}};
  h.keys.handler(key);
  check(key.blocked && key.stopped, 'reader keyboard shortcuts blocked in capture phase');
  const reload={key:'r',ctrlKey:true,preventDefault(){this.blocked=true;},stopImmediatePropagation(){this.stopped=true;}};
  h.keys.handler(reload);
  check(!reload.blocked, 'browser reload stays possible');
  const drop={preventDefault(){this.blocked=true;},stopImmediatePropagation(){this.stopped=true;}};
  h.keys.drop(drop);
  check(drop.blocked && drop.stopped, 'global file drop is blocked during initialization');
  deferredModel.resolve(pipe);
  check(await job1===pipe && await job2===pipe && calls===1, 'concurrent requests share exactly one init');
  check(h.overlay.classList.hidden && !h.header.inert && !h.main.inert && h.other.inert, 'successful load restores controls/inert state');
  check(h.prev.focused && !h.evalJs('formulaOcrInitModalVisible'), 'previous focus restored on success');
  check(h.evalJs('mathOcrPipeline')===pipe && h.evalJs('mathOcrInitPromise')===null, 'ready pipeline installed and init cleared');
  check(await h.call() === pipe && calls===1, 'warm engine does not re-lock the reader');

  const f=harness(); f.mockPipeline(async()=>{throw new Error('offline');});
  await assert.rejects(f.call(),/offline/);checks++;
  check(f.overlay.classList.hidden && !f.main.inert && f.prev.focused, 'failed load always unlocks and returns focus');
  check(f.evalJs('mathOcrPipeline')===null && f.evalJs('mathOcrInitPromise')===null, 'failed engine leaves no ready state');
  check(f.evalJs('mathOcrInitializationFailed')===true, 'failure latched to prevent automatic repeated blocking');
  check(f.notices.some(x=>x.includes('PDF reading is available')), 'failure message confirms normal reader available');
  check(f.statuses.some(x=>x.includes('Reset OCR to retry')), 'retry guidance is visible');
  let retried=0;
  const newPipe={};
  f.mockPipeline(async()=>{retried++;return newPipe;});
  check(await f.call()===newPipe && retried===1 && f.overlay.classList.hidden, 'explicit retry can recover after a failure');
  check(f.evalJs('mathOcrInitializationFailed')===false, 'a successful retry clears the failure latch');

  const fall=harness({plan:[{label:'WebGPU',official:false,device:'webgpu',dtype:'q4f16'},{label:'CPU fallback',official:true}]});
  let attempt=0;
  const fallbackPipe={};
  fall.mockPipeline(async()=>{ attempt++;if(attempt===1)throw new Error('WebGPU init failed');return fallbackPipe;});
  check(await fall.call()===fallbackPipe && attempt===2, 'existing WebGPU to CPU fallback retained');
  check(fall.overlay.classList.hidden && !fall.header.inert, 'fallback resolution releases modal');

  const pending=deferred(); const late=harness({limit:35});
  let disposed=0;
  late.mockPipeline(async()=>pending.promise);
  await assert.rejects(late.call(),/safety limit/);checks++;
  check(late.overlay.classList.hidden && !late.header.inert, 'asynchronous initialization timeout releases all controls');
  check(late.evalJs('mathOcrPipeline')===null && late.evalJs('mathOcrInitPromise')===null, 'timed-out pipeline not installed');
  pending.resolve({dispose:async()=>{disposed++;}});
  await new Promise(r=>setTimeout(r,0));
  check(disposed===1 && late.evalJs('mathOcrPipeline')===null, 'late pipeline disposed rather than installed');

  const importPending=deferred();const stall=harness({limit:35});
  stall.context.importPending=importPending.promise;
  stall.evalJs('importFormulaOcrRuntime = () => importPending');
  await assert.rejects(stall.call(),/safety limit/);checks++;
  check(stall.overlay.classList.hidden && !stall.header.inert, 'stalled model/runtime import also unlocks');
  check(stall.evalJs('mathOcrInitializationFailed')===true, 'timed-out import prevents automatic re-preloads');
  importPending.resolve({pipeline:async()=>({})});
  console.log(`OK: ${checks} formula OCR initialization/modal assertions`);
}
tests().catch(err=>{console.error(err);process.exitCode=1;});
