import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,addPoint,validateDoc,createResolver,affected,command} from '../src/model.mjs';
import {arrowHeadPoints} from '../src/geometry.mjs';

test('arrowhead is finite, directed, and within finite screen edge for short or steep edges',()=>{
 for(const [tip,from,w] of [ [[10,0],[0,0],2], [[1,1],[0,0],100], [[0,-10],[0,0],.1], [[-100,50],[0,0],3] ]){
  const h=arrowHeadPoints(tip,from,w);assert.equal(h.length,3);assert.deepEqual(h[0],tip);
  const mid=[(h[1][0]+h[2][0])/2,(h[1][1]+h[2][1])/2];
  const dot=(tip[0]-from[0])*(tip[0]-mid[0])+(tip[1]-from[1])*(tip[1]-mid[1]);
  assert.ok(dot>0,'head must face along edge');assert.ok(h.flat().every(Number.isFinite));
  assert.ok(Math.hypot(tip[0]-mid[0],tip[1]-mid[1])<=Math.hypot(tip[0]-from[0],tip[1]-from[1]));
 }
 assert.deepEqual(arrowHeadPoints([0,0],[0,0],2),[]);
 assert.deepEqual(arrowHeadPoints([NaN,0],[0,0],2),[]);
});

test('dense, shared nested construction references remain correct when resolving and pruning',()=>{
 const doc=newDoc(),A=addPoint(doc,[0,0]),B=addPoint(doc,[2,0]);
 let curr=append(doc,{type:'midpoint',refs:[A.id,B.id]});
 for(let i=0;i<1800;i++)curr=append(doc,{type:'midpoint',refs:[curr.id,A.id]});
 const resolver=createResolver(validateDoc(doc));assert.ok(resolver.at(curr.id));
 const deps=affected(doc,A.id);assert.equal(deps.size,1802);
});

test('adversarial command failure leaves object count and nextId stable',()=>{
 const d=newDoc();command(d,'A=(0,0)');command(d,'B=(0,0)');
 for(const bad of ['Segment(A,B)','RegularPolygon(A,B,5)','Midpoint(A,Q)','f(x)=sin(', 'C=(1e999,0)']){
  const before=JSON.stringify(d);assert.throws(()=>command(d,bad));assert.equal(JSON.stringify(d),before,bad);
 }
});
