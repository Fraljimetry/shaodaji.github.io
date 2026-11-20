import test from 'node:test';
import assert from 'node:assert/strict';
import {stableDepthSortSteps} from '../src/plot3d.mjs';

const stableNative = entries => [...entries].sort((a,b)=>a.depth-b.depth).map(x=>x.id);
function makeValues(size,seed=9){
 let state=seed;
 return Array.from({length:size},(_,id)=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return {id,depth:state%31===0?0:(state%149)-74};
 });
}
test('cooperative depth ordering matches native stable sort on boundary sizes and ties',()=>{
 for(const size of [0,1,2,3,7,8,9,63,64,65,4095,4096,4097,8191,8192,8193,184416]){
  const values=makeValues(size);const expected=stableNative(values);
  const generator=stableDepthSortSteps(values,4096);let state,steps=0;
  do{state=generator.next();steps++;assert.ok(steps<10000);}while(!state.done);
  assert.deepEqual(values.map(x=>x.id),expected,`size=${size}`);
 }
});
test('a cancelled sorting iterator does not mutate the retained completed scene',()=>{
 const completed=makeValues(10000);const originalIds=completed.map(x=>x.id);
 const task=stableDepthSortSteps(completed);task.next();task.return();
 assert.equal(completed.length,originalIds.length);
 const fresh=makeValues(10000);for(const _ of stableDepthSortSteps(fresh,128)){}
 assert.deepEqual(fresh.map(x=>x.id),stableNative(makeValues(10000)));
});
