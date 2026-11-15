import test from 'node:test';
import assert from 'node:assert/strict';
import {compareGPUProbeWithCPU,evaluateRestrictedGPUProbe,buildGPUProbeShaders} from '../src/gpu_sampling_probe3d.mjs';

test('implicit zero crossings reject reversed sign even within numeric tolerance',()=>{
 const positive=[[0.00001,0,0]],negative=[[-0.00001,0,0]];
 const options={absoluteTolerance:0.01,relativeTolerance:0};
 assert.equal(compareGPUProbeWithCPU('x=0',positive,{status:'PASS',values:[-0.00001]},options).status,'FAIL');
 assert.equal(compareGPUProbeWithCPU('x=0',negative,{status:'PASS',values:[0.00001]},options).status,'FAIL');
 assert.equal(compareGPUProbeWithCPU('x=0',positive,{status:'PASS',values:[0.00002]},options).status,'PASS');
});

test('valid zero and signed zero remain acceptable',()=>{
 for(const actual of [-0,0])
  assert.equal(compareGPUProbeWithCPU('x=0',[[0,0,0]],{status:'PASS',values:[actual]}).status,'PASS');
 for(const actual of [1e-7,-1e-7])
  assert.equal(compareGPUProbeWithCPU('x=0',[[0,0,0]],{status:'PASS',values:[actual]}).status,'FAIL');
});

test('GPU sampling rejects oversized source without acquiring a context',()=>{
 const canvas={getContext(){throw Error('unexpected context creation')}};
 assert.equal(evaluateRestrictedGPUProbe(canvas,'x'.repeat(500),[[1,0,0]]).status,'REJECTED');
});

test('shader readback still encodes full float bits',()=>{
 const {fragment}=buildGPUProbeShaders('x');
 assert.match(fragment,/floatBitsToUint\(value\)/);
 assert.match(fragment,/bits>>24u/);
});
