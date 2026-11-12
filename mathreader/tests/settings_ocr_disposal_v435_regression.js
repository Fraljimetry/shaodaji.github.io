'use strict';
// Exact production model disposal function; no actual Texify model is loaded.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ocr = fs.readFileSync(path.join(root, 'js/10-formula-ocr.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'js/70-command-ui-runtime.js'), 'utf8');
function extract(name) {
  const begin = ocr.indexOf(`async function ${name}(`);
  assert(begin >= 0, `missing actual ${name}`);
  return ocr.slice(begin, ocr.indexOf('\n}',begin)+2);
}
let checks = 0;
function check(value, name) { assert.ok(value, name); checks++; }
function harness(pipe) {
  const notices=[],statuses=[];
  const ctx = {
    mathOcrPipeline:pipe,mathOcrBackend:{label:'Texify CPU'},mathOcrReadyAt:1,
    mathOcrInferenceRuns:1,mathOcrModulePromise:Promise.resolve({}),mathOcrDisposalFailed:false,
    updateOcrCapability(){},setOcrStatus:(message)=>statuses.push(message),
    showNotice:(message)=>notices.push(message),t:(en)=>en,console
  };
  vm.createContext(ctx);
  vm.runInContext(extract('disposeMathOcrPipeline'),ctx);
  return {ctx,notices,statuses,dispose:()=>vm.runInContext('disposeMathOcrPipeline()',ctx)};
}
(async()=>{
  let called=0;
  const good = harness({async dispose(){called++;}});
  check(await good.dispose()===true && called===1,'successful disposal returns true');
  check(good.ctx.mathOcrPipeline===null && good.ctx.mathOcrBackend===null,'success drops unloaded pipeline');
  check(!good.ctx.mathOcrDisposalFailed && good.notices.length===0,'success has no false warning');
  const empty = harness(null);
  check(await empty.dispose()===true && !empty.ctx.mathOcrDisposalFailed,'idle reset succeeds without a model');
  const failed = harness({async dispose(){throw Error('device lost in dispose');}});
  check(await failed.dispose()===false,'rejected disposal cannot masquerade as success');
  check(failed.ctx.mathOcrDisposalFailed && failed.ctx.mathOcrPipeline===null,'failure latches unsafe image engine');
  check(failed.notices.length===1 && failed.statuses.some(msg=>msg.includes('Reload MathReader')),'failure visibly instructs reload');
  check(runtime.includes('mathOcrDisposing = true') && runtime.includes('mathOcrDisposing = false'), 'Settings resets serialized across disposal');
  check(runtime.includes('if (!await disposeMathOcrPipeline()) return false;'),'Settings never claims reset success after failed disposal');
  console.log(`PASS: ${checks} v435 OCR-disposal assertions (mocked model)`);
})().catch(err=>{console.error(err);process.exitCode=1;});
