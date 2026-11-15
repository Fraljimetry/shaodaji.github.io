import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_GPU_PROBE_POINTS,buildGPUProbeShaders,evaluateRestrictedGPUProbe,compareGPUProbeWithCPU} from '../src/gpu_sampling_probe3d.mjs';

test('shader generates real GPU float-bit readback, not a CPU substitute',()=>{
 const {vertex,fragment}=buildGPUProbeShaders('((x*x)+(y*y)+(z*z)-1.)');
 assert.match(vertex,/gl_PointSize=1\.0/);
 assert.match(fragment,/floatBitsToUint\(value\)/);
 assert.match(fragment,/float value=/);
 assert.throws(()=>buildGPUProbeShaders('x;discard;'));
});
test('missing and throwing WebGL contexts fail explicitly',()=>{
 const points=[[1,2,3]];
 assert.equal(evaluateRestrictedGPUProbe({},'x=1',points).status,'UNAVAILABLE');
 assert.equal(evaluateRestrictedGPUProbe({getContext:()=>null},'x=1',points).status,'UNAVAILABLE');
 assert.equal(evaluateRestrictedGPUProbe({getContext:()=>{throw Error('device error')}},'x=1',points).status,'UNAVAILABLE');
});
test('malformed input and resource bounds are rejected before acquiring GPU',()=>{
 const canvas={getContext:()=>{throw Error('must not be reached')}};
 assert.equal(evaluateRestrictedGPUProbe(canvas,'sin(x)',[[1,2,3]]).status,'REJECTED');
 assert.equal(evaluateRestrictedGPUProbe(canvas,'x',[...Array(MAX_GPU_PROBE_POINTS+1)].map(()=>[1,2,3])).status,'REJECTED');
 for(const p of [[[NaN,0,0]],[[Infinity,0,0]],[[1,2]],[[1e6,0,0]]])
  assert.equal(evaluateRestrictedGPUProbe(canvas,'x',p).status,'REJECTED');
});
test('CPU/GPU comparison enforces tolerance and non-finite safety',()=>{
 const points=[[0,0,0],[1,0,0],[0.5,0.5,0.5]];
 const good={status:'PASS',values:[-1,0,-0.25]};
 assert.equal(compareGPUProbeWithCPU('x^2+y^2+z^2=1',points,good).status,'PASS');
 assert.equal(compareGPUProbeWithCPU('x^2+y^2+z^2=1',points,{...good,values:[-1,0,-0.2]}).status,'FAIL');
 assert.equal(compareGPUProbeWithCPU('x^2+y^2+z^2=1',points,{...good,values:[-1,NaN,-0.25]}).status,'FAIL');
 assert.equal(compareGPUProbeWithCPU('x=0',[[0,0,0]],{status:'UNAVAILABLE'}).status,'UNAVAILABLE');
});
