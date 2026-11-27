/** Round 79: tiny circles and a shared 3-point circle/arc degeneracy rule. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {circumcircle,circleGeometry,checkNewGeometry,newDoc,addPoint,append,createResolver,validateDoc,intersectCircles,intersectLineCircle} from '../src/model.mjs';
import {circum,circleArcPoints} from '../src/geometry_round50.mjs';
const near=(a,b,tol=1e-20)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test('R77-05: finite tiny circles survive resolver, JSON and intersection calculations',()=>{
 const doc=newDoc();const center=addPoint(doc,[0,0]),edge=addPoint(doc,[1e-10,0]);
 const circle=append(doc,{type:'circle',refs:[center.id,edge.id]});
 assert.doesNotThrow(()=>checkNewGeometry('circle',[[0,0],[1e-10,0]]));
 assert.doesNotThrow(()=>validateDoc(structuredClone(doc)));
 const resolved=createResolver(doc).circle(circle);assert.ok(resolved);near(resolved.radius,1e-10);
 const root=intersectLineCircle({a:[-2e-10,0],d:[1,0],domain:'infinite'},resolved);
 assert.ok(root.minus&&root.plus);near(root.minus[0],-1e-10);near(root.plus[0],1e-10);
});

test('R77-05: overlapping tiny circles retain two roots and coincident radius is rejected',()=>{
 const a={center:[0,0],radius:1e-10},b={center:[1e-10,0],radius:1e-10};
 const roots=intersectCircles(a,b);assert.ok(roots.minus&&roots.plus);
 near(roots.plus[0],.5e-10);assert.ok(roots.plus[1]>0&&roots.minus[1]<0);
 assert.throws(()=>checkNewGeometry('circle',[[0,0],[0,0]]),/circle|distinct/i);
 assert.equal(circleGeometry({type:'circle',refs:['a','b']},id=>[0,0]),null);
});

test('R77-06: valid small circumcircle and source arc remain finite at different scales',()=>{
 for(const scale of [1e-200,1e-160,1e-110,1e-9,1e-10,1e-6,1,1e6]){
  const points=[[0,0],[scale,0],[0,scale]];
  const one=circumcircle(points),two=circum(points);
  assert.deepEqual(one,two);assert.ok(one);near(one.center[0],scale/2,scale*1e-12);
  near(one.radius,scale*Math.SQRT1_2,scale*1e-12);
  const arc=circleArcPoints(points,16);
  assert.equal(arc.length,17);assert.ok(arc.every(p=>p.every(Number.isFinite)));
  assert.doesNotThrow(()=>checkNewGeometry('circleThrough3',points));
  assert.doesNotThrow(()=>checkNewGeometry('circularArc',points));
 }
});

test('R77-09: circles, arcs and triangle centers reject near-collinear triples consistently',()=>{
 for(const points of [ [[0,0],[.1,0],[.2,1e-10]],[[0,0],[1,0],[2,1e-12]],[[0,0],[0,0],[2,0]],[[0,0],[1,0],[2,0]] ]){
  assert.equal(circumcircle(points),null);
  assert.equal(circum(points),null);
  assert.deepEqual(circleArcPoints(points,8),[]);
  assert.throws(()=>checkNewGeometry('circleThrough3',points),/noncollinear/i);
  assert.throws(()=>checkNewGeometry('circularArc',points),/noncollinear/i);
 }
});

test('R77-06: tiny 3-point circles survive document validation and edits',()=>{
 const doc=newDoc();const refs=[[0,0],[1e-9,0],[0,1e-9]].map(p=>addPoint(doc,p).id);
 const circle=append(doc,{type:'circleThrough3',refs});
 assert.doesNotThrow(()=>validateDoc(structuredClone(doc)));
 near(createResolver(doc).circle(circle).radius,Math.SQRT1_2*1e-9);
 const old=doc.objects.find(x=>x.id===refs[2]);old.xy=[0,2e-9];
 assert.doesNotThrow(()=>validateDoc(structuredClone(doc)));
 assert.ok(createResolver(doc).circle(circle).radius>0);
});
