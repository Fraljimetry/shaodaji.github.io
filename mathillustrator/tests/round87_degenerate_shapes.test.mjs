/** Round 86 discovery-only oracles: intentionally RED until fixed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {r50SourceShape} from '../src/geometry_round50.mjs';
const resolver={line:()=>null,circle:()=>null,at:()=>null,points:o=>o._pts};
test('R86-01 zero-radius regular polygon must not emit repeated-vertex path',()=>{
 const o={id:'polygon0',type:'regularPolygon',sides:5,_pts:[[2,3],[2,3]]};
 assert.deepEqual(r50SourceShape(o,resolver),[]);
});
test('R86-02 collinear rectangle anchors must not emit zero-area closed path',()=>{
 const o={id:'rect0',type:'rectangle',_pts:[[0,0],[2,0],[1,0]]};
 assert.deepEqual(r50SourceShape(o,resolver),[]);
});
test('R86-03 collinear parallelogram anchors must not emit zero-area closed path',()=>{
 const o={id:'para0',type:'parallelogram',_pts:[[0,0],[2,0],[1,0]]};
 assert.deepEqual(r50SourceShape(o,resolver),[]);
});

import {regularPolygonVertices,shapeVerticesFromPoints,checkNewGeometry} from '../src/model.mjs';
import {distinctPoints,independentEdges,perpendicularHeightNonzero} from '../src/numeric_geometry.mjs';

test('R87 numerical predicates are scale-equivariant (no fixed world-unit floor)',()=>{
 for(const scale of [1e-12,1e-9,1,1e6]){
  const a=[0,0],b=[scale,0],c=[scale,scale/2],flat=[scale*1.4,0];
  assert.equal(distinctPoints(a,b),true);
  assert.equal(independentEdges(a,b,c),true);
  assert.equal(perpendicularHeightNonzero(a,b,c),true);
  assert.equal(independentEdges(a,b,flat),false);
  assert.equal(perpendicularHeightNonzero(a,b,flat),false);
 }
});
test('R87 valid microscopic regular polygons and quadrilaterals survive model and path resolution',()=>{
 for(const scale of [1e-12,1e-9,1,1e6]){
  const p=[[0,0],[scale,0],[scale,scale/2]];
  assert.equal(regularPolygonVertices(p[0],p[1],5).length,5);
  assert.equal(shapeVerticesFromPoints('rectangle',p).length,4);
  assert.equal(shapeVerticesFromPoints('parallelogram',p).length,4);
  for(const type of ['regularPolygon','rectangle','parallelogram']){
   const refs=type==='regularPolygon'?p.slice(0,2):p;
   assert.doesNotThrow(()=>checkNewGeometry(type,refs));
   assert.equal(r50SourceShape({type,sides:5,_pts:refs},resolver).length,type==='regularPolygon'?6:5);
  }
 }
});
test('R87 invalid new quadrilaterals are rejected while source resolution stays nonthrowing',()=>{
 const p=[[0,0],[2,0],[3,0]];
 for(const type of ['rectangle','parallelogram']){
  assert.throws(()=>checkNewGeometry(type,p));
  assert.deepEqual(r50SourceShape({type,_pts:p},resolver),[]);
 }
 assert.deepEqual(regularPolygonVertices(p[0],p[0],7),[]);
 assert.deepEqual(shapeVerticesFromPoints('rectangle',p),[]);
 assert.deepEqual(shapeVerticesFromPoints('parallelogram',p),[]);
});
