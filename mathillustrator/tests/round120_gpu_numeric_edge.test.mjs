import test from 'node:test';
import assert from 'node:assert/strict';
import {compileRestrictedGPUImplicit} from '../src/gpu_expression3d.mjs';
import {compareGPUProbeWithCPU,evaluateRestrictedGPUProbe,buildGPUProbeShaders,MAX_GPU_PROBE_POINTS} from '../src/gpu_sampling_probe3d.mjs';

test('GPU comparison rejects nonfinite, negative and malformed tolerances',()=>{
 const pts=[[0,0,0]];const gpu={status:'PASS',values:[999]};
 for(const val of [NaN,Infinity,-Infinity,-1]){
  assert.equal(compareGPUProbeWithCPU('x=0',pts,gpu,{absoluteTolerance:val}).status,'FAIL');
  assert.equal(compareGPUProbeWithCPU('x=0',pts,gpu,{relativeTolerance:val}).status,'FAIL');
 }
 assert.equal(compareGPUProbeWithCPU('x',[[1,0,0]],gpu,{absoluteTolerance:1000,relativeTolerance:0}).status,'PASS');
});

test('GPU comparisons reject missing/corrupt arrays and input points',()=>{
 for(const values of [undefined,null,{},[],[0,1]])
  assert.equal(compareGPUProbeWithCPU('x=0',[[0,0,0]],{status:'PASS',values}).status,'FAIL');
 for(const pts of [[],[[NaN,0,0]],[[1,2]],[[1e6,0,0]],Array.from({length:MAX_GPU_PROBE_POINTS+1},()=>[0,0,0])])
  assert.equal(compareGPUProbeWithCPU('x=0',pts,{status:'PASS',values:[0]}).status,'FAIL');
});

test('sign-sensitive boundaries and near-zero mismatches are never counted as equivalence',()=>{
 const cases=[
  ['x=0',[[0,0,0],[1e-7,0,0],[-1e-7,0,0]]],
  ['x^2+y^2+z^2=1',[[1,0,0],[0.999999,0,0],[1.000001,0,0]]],
  ['(x-y)^3=0',[[1,1,0],[1,1.000001,0],[1,0.999999,0]]],
 ];
 for(const [expr,pts] of cases){
  const c=compileRestrictedGPUImplicit(expr);assert.ok(c,expr);
  const reference=pts.map(p=>c.cpu(...p));
  assert.equal(compareGPUProbeWithCPU(expr,pts,{status:'PASS',values:reference},
   {absoluteTolerance:0,relativeTolerance:0}).status,'PASS');
  const corrupted=reference.slice();corrupted[0]+=0.01;
  assert.equal(compareGPUProbeWithCPU(expr,pts,{status:'PASS',values:corrupted},
   {absoluteTolerance:0,relativeTolerance:0}).status,'FAIL');
 }
});

test('readback shader includes float-bit encoding and input draw index',()=>{
 const {vertex,fragment}=buildGPUProbeShaders('x');
 assert.match(vertex,/a_sample\.w/);assert.match(fragment,/floatBitsToUint/);
 assert.equal(evaluateRestrictedGPUProbe({getContext:()=>null},'x',[[0,0,0]]).status,'UNAVAILABLE');
});
