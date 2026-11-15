import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRestrictedGPUBatch,compareGPUBatchWithCPU,
 MAX_GPU_PROBE_BATCH_POINTS,MAX_GPU_PROBE_POINTS,compareGPUProbeWithCPU} from '../src/gpu_sampling_probe3d.mjs';

test('GPU diagnostic batches reject invalid inputs before acquiring context',()=>{
 const canvas={getContext(){throw Error('unexpected context')}};
 for(const points of [[],[[Infinity,0,0]],[[1,2]],Array.from({length:MAX_GPU_PROBE_BATCH_POINTS+1},()=>[0,0,0])])
  assert.equal(evaluateRestrictedGPUBatch(canvas,'x',points).status,'REJECTED');
 assert.equal(evaluateRestrictedGPUBatch(canvas,'sin(x)',[[1,0,0]]).status,'REJECTED');
});

test('GPU diagnostic batches never mask unavailable shader execution',()=>{
 const points=Array.from({length:MAX_GPU_PROBE_POINTS+3},(_,i)=>[i/100,0,0]);
 const result=evaluateRestrictedGPUBatch({getContext:()=>null},'x',points);
 assert.equal(result.status,'UNAVAILABLE');assert.equal(result.failedOffset,0);
 assert.equal(Object.hasOwn(result,'values'),false);
});

test('batch equivalence checks 4096 values and preserves global mismatch index',()=>{
 const points=Array.from({length:MAX_GPU_PROBE_BATCH_POINTS},(_,i)=>[i/10000,0,0]);
 const values=points.map(p=>p[0]);
 assert.equal(compareGPUBatchWithCPU('x',points,{status:'PASS',values}).status,'PASS');
 values[3072]=-values[3072];
 const result=compareGPUBatchWithCPU('x',points,{status:'PASS',values});
 assert.equal(result.status,'FAIL');assert.equal(result.index,3072);
});

test('GPU zero-vs-nonzero topology mismatch rejected even inside tolerance',()=>{
 assert.equal(compareGPUProbeWithCPU('x',[[0.00000001,0,0]],
  {status:'PASS',values:[0]},{absoluteTolerance:0.1}).status,'FAIL');
 assert.equal(compareGPUProbeWithCPU('x',[[0,0,0]],
  {status:'PASS',values:[-0]}).status,'PASS');
});

test('malformed batch and invalid tolerance fail closed',()=>{
 const points=[[0.1,0,0]];
 assert.equal(compareGPUBatchWithCPU('x',points,{status:'PASS',values:[]}).status,'FAIL');
 assert.equal(compareGPUBatchWithCPU('x',points,{status:'PASS',values:[0.1]},
  {absoluteTolerance:Infinity}).status,'FAIL');
});
