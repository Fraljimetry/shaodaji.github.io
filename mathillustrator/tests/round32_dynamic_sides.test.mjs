import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,appendDerivedShapeEdges,command,createResolver,validateDoc,guardAnchorMove,affected,remove,clone,derivedSidePoints,derivedShapeVertices} from '../src/model.mjs';
import {regularPolygonVertices,nearestFreehandAttachment} from '../src/geometry.mjs';
const base=()=>{const d=newDoc();addPoint(d,[0,0],'A');addPoint(d,[4,3],'B');return d;};
const edges=(d,owner)=>d.objects.filter(o=>o.edgeOf===owner.id);
const near=(a,b,eps=1e-8)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<eps,JSON.stringify([a,b]));

test('Round32: rectangle sides are actual stable, independently styled segment objects',()=>{
 const d=base(),r=command(d,'Rectangle(A,B)'),e=edges(d,r),resolver=createResolver(d);
 assert.equal(e.length,4);assert.deepEqual(e.map(x=>x.edgeIndex),[0,1,2,3]);
 assert.equal(new Set(e.map(x=>x.id)).size,4);
 assert.deepEqual(e.map(x=>resolver.points(x)),[
  [[0,0],[4,0]],[[4,0],[4,3]],[[4,3],[0,3]],[[0,3],[0,0]]]);
 for(const side of e)assert.deepEqual(resolver.points(side),[resolver.line(side).a,[(resolver.line(side).a[0]+resolver.line(side).d[0]*resolver.line(side).length),(resolver.line(side).a[1]+resolver.line(side).d[1]*resolver.line(side).length)].map(x=>Math.abs(x)<1e-10?0:x)]);
 e[0].style.stroke='#ef4444';assert.equal(e[1].style.stroke,d.settings.stroke);
 assert.deepEqual(validateDoc(d),d);
 const json=JSON.parse(JSON.stringify(d));json.objects[1].xy=[-2,5];
 const moved=createResolver(json);assert.deepEqual(moved.points(e[0]),[[-2,0],[0,0]]);
 assert.deepEqual(moved.points(e[2]),[[0,5],[-2,5]]);
 assert.doesNotThrow(()=>guardAnchorMove(d,json,json.objects[1].id));
 assert.equal(affected(d,r.id).size,5);
 remove(d,e[2].id);assert.equal(edges(d,r).length,3);assert.doesNotThrow(()=>validateDoc(d));
 remove(d,r.id);assert.equal(d.objects.length,2);assert.doesNotThrow(()=>validateDoc(d));
});

test('Round32: regular polygon derived sides track moved center, vertex and orientation',()=>{
 const d=base(),p=command(d,'RegularPolygon(A,B,5)'),e=edges(d,p),r=createResolver(d);
 assert.equal(e.length,5);assert.deepEqual(e.map(x=>x.edgeIndex),[0,1,2,3,4]);
 const vertices=regularPolygonVertices([0,0],[4,3],5);
 assert.deepEqual(derivedShapeVertices(p,id=>r.at(id)),vertices);
 for(let i=0;i<e.length;i++){
  const sides=r.points(e[i]);near(sides[0],vertices[i]);near(sides[1],vertices[(i+1)%5]);
  assert.ok(r.line(e[i]).length>1);
 }
 const first=e.map(o=>o.id);
 const updated=clone(d);updated.objects[0].xy=[2,-1];updated.objects[1].xy=[2,-6];
 const next=createResolver(updated),v=regularPolygonVertices([2,-1],[2,-6],5);
 for(let i=0;i<5;i++){near(next.points(e[i])[0],v[i]);near(next.points(e[i])[1],v[(i+1)%5]);}
 assert.deepEqual(edges(updated,p).map(o=>o.id),first);
 assert.doesNotThrow(()=>guardAnchorMove(d,updated,updated.objects[0].id));
 assert.doesNotThrow(()=>validateDoc(updated));
 const snapped=nearestFreehandAttachment([(v[0][0]+v[1][0])/2,(v[0][1]+v[1][1])/2],[e[0]],next,50,10);
 assert.ok(snapped&&snapped.distancePx<1,snapped);
});

test('Round32: derived sides reject forged owners/indexes/refs/duplicates transactionally',()=>{
 const d=base(),poly=command(d,'RegularPolygon(A,B,4)'),e=edges(d,poly);
 const invalid=transform=>{
  const copy=clone(d);transform(copy,copy.objects.find(o=>o.id===e[0].id));
  assert.throws(()=>validateDoc(copy),/edge|owner|reference/i);
  assert.doesNotThrow(()=>validateDoc(d));
 };
 invalid((d,e)=>e.edgeOf='o999');invalid((d,e)=>e.edgeIndex=-1);
 invalid((d,e)=>e.edgeIndex=8);invalid((d,e)=>e.refs.reverse());
 invalid((d,e)=>e.edgeIndex=1);invalid((d,e)=>delete e.edgeIndex);
 invalid((d,e)=>{e.edgeOf=d.objects[0].id;});
 invalid((d,e)=>{e.type='arrow';});
});

test('Round32: legacy shapes without sides remain untouched and invalid construction does not make phantom edges',()=>{
 const d=base(),refs=d.objects.map(o=>o.id),r=append(d,{type:'rectangle',refs});
 assert.equal(edges(d,r).length,0);assert.doesNotThrow(()=>validateDoc(d));
 const p=append(d,{type:'regularPolygon',refs,sides:6});
 assert.equal(edges(d,p).length,0);assert.doesNotThrow(()=>validateDoc(d));
 assert.equal(derivedSidePoints({edgeIndex:8},r,id=>createResolver(d).at(id)),null);
 const old=JSON.stringify(d);assert.throws(()=>command(d,'RegularPolygon(A,A,7)'),/distinct/i);
 assert.equal(JSON.stringify(d),old);
});

test('Round32: capacity checks fail closed before partial side creation',()=>{
 const d=base(),p=append(d,{type:'regularPolygon',refs:d.objects.map(o=>o.id),sides:100});
 d.nextId=Number.MAX_SAFE_INTEGER-20;
 assert.throws(()=>appendDerivedShapeEdges(d,p.id),/capacity/i);
 assert.equal(edges(d,p).length,0);
});
