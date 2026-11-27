import test from 'node:test';
import assert from 'node:assert/strict';
import {captureObjectSelection} from '../src/object_clipboard.mjs';

test('clipboard capture handles a deep valid dependency DAG without recursion overflow',()=>{
 const n=9500;
 const objects=Array.from({length:n},(_,i)=>({id:`o${i+1}`,type:'point',xy:[0,0],refs:i?[`o${i}`]:[]}));
 const clip=captureObjectSelection({objects},[`o${n}`]);
 assert.equal(clip.objects.length,n);
 assert.equal(clip.objects[0].id,'o1');
 assert.equal(clip.objects.at(-1).id,`o${n}`);
 assert.deepEqual(clip.roots,[`o${n}`]);
});

test('clipboard shared dependencies are cloned once and topologically ordered',()=>{
 const objects=[{id:'o1',refs:[]},{id:'o2',refs:['o1']},{id:'o3',refs:['o1']},{id:'o4',refs:['o2','o3']}];
 const clip=captureObjectSelection({objects},['o4','o3']);
 assert.deepEqual(clip.objects.map(o=>o.id),['o1','o2','o3','o4']);
 assert.deepEqual(clip.roots,['o4','o3']);
});

test('clipboard rejects cyclic dependencies with the intended error',()=>{
 const objects=[{id:'o1',refs:['o2']},{id:'o2',refs:['o1']}];
 assert.throws(()=>captureObjectSelection({objects},['o1']),/Cyclic clipboard dependency/);
});
