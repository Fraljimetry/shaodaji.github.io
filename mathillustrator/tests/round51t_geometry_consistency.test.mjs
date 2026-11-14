import test from 'node:test';
import assert from 'node:assert/strict';
import {triangleCenter, CENTER_KINDS} from '../src/geometry_round50.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';

test('three excenters have the correct locations and survive model validation',()=>{
 const triangle=[[0,0],[4,0],[0,3]];
 const expected={excenterA:[6,6],excenterB:[-2,2],excenterC:[3,-3]};
 for(const [kind,want] of Object.entries(expected)){
  assert.ok(CENTER_KINDS.includes(kind));
  const got=triangleCenter(triangle,kind);
  assert.ok(got&&got.every((v,i)=>Math.abs(v-want[i])<1e-9),`${kind}: ${got}`);
 }
 const doc=newDoc();
 const refs=triangle.map(xy=>append(doc,{type:'point',xy}).id);
 append(doc,{type:'triangleCenter',refs,centerKind:'excenterA'});
 assert.doesNotThrow(()=>validateDoc(structuredClone(doc)));
});

test('excenters reject collinear triangles and absent vertices',()=>{
 assert.equal(triangleCenter([[0,0],[1,1],[2,2]],'excenterA'),null);
 assert.equal(triangleCenter([[0,0],null,[2,2]],'excenterA'),null);
});
