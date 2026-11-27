import test from 'node:test';
import assert from 'node:assert/strict';
import {intersectLineCircle,intersectCircles,newDoc,append,createResolver} from '../src/model.mjs';

test('R77-01 genuine near-tangent line secants retain both ordered branches',()=>{
 const r=intersectLineCircle({a:[0,1-1e-12],d:[1,0],domain:'infinite'},{center:[0,0],radius:1});
 assert.equal(r.tangent,false);assert.ok(r.minus&&r.plus);
 assert.ok(r.minus[0]<-1e-6&&r.plus[0]>1e-6);
});
test('R77-02 shallow circle crossings have symmetric distinct branches',()=>{
 const r=intersectCircles({center:[0,0],radius:1},{center:[2-1e-12,0],radius:1});
 assert.equal(r.tangent,false);assert.ok(r.minus&&r.plus);
 assert.ok(r.minus[1]<-1e-6&&r.plus[1]>1e-6);
});
test('R77-03 tangent API has one root; old plus-branch objects still resolve',()=>{
 const r=intersectCircles({center:[0,0],radius:1},{center:[2,0],radius:1});
 assert.equal(r.tangent,true);assert.deepEqual(r.minus,[1,0]);assert.equal(r.plus,null);
 const d=newDoc();
 const a=append(d,{type:'point',xy:[0,0]}),b=append(d,{type:'point',xy:[0,1]}),c=append(d,{type:'point',xy:[2,0]}),e=append(d,{type:'point',xy:[2,1]});
 const first=append(d,{type:'circle',refs:[a.id,b.id]}),second=append(d,{type:'circle',refs:[c.id,e.id]});
 const oldPlus=append(d,{type:'circleCircleIntersection',refs:[first.id,second.id],branch:1});
 assert.deepEqual(createResolver(d).at(oldPlus.id),[1,0]);
 c.xy=[2-1e-12,0];e.xy=[2-1e-12,1];
 assert.ok(createResolver(d).at(oldPlus.id)[1]>1e-6);
});
test('R77-04 near-concentric equal circles have two intersection roots',()=>{
 const r=intersectCircles({center:[0,0],radius:1},{center:[1e-11,0],radius:1});
 assert.equal(r.tangent,false);assert.ok(r.minus&&r.plus);
 assert.ok(r.minus[1]<-.99&&r.plus[1]>.99);
});
test('Strict no-intersection conditions do not invent secants',()=>{
 assert.equal(intersectCircles({center:[0,0],radius:1},{center:[2+1e-12,0],radius:1}).minus,null);
 assert.equal(intersectLineCircle({a:[0,1+1e-12],d:[1,0],domain:'infinite'},{center:[0,0],radius:1}).minus,null);
 assert.equal(intersectCircles({center:[0,0],radius:1},{center:[0,0],radius:1}).minus,null);
});

test('Analytic circle crossings retain scale-normalized roots at microscopic scales',()=>{
 for(const s of [1e-250,1e-200,1e-160,1e-100,1e-9,1,1e6]){
  const close=(actual,expected)=>assert.ok(Math.abs(actual/s-expected)<1e-12,`${actual/s} != ${expected} at ${s}`);
  const circle={center:[0,0],radius:s};
  const line=intersectLineCircle({a:[0,s/2],d:[1,0],domain:'infinite'},circle);
  assert.equal(line.tangent,false);close(line.minus[0],-Math.sqrt(3)/2);close(line.plus[0],Math.sqrt(3)/2);
  const pair=intersectCircles(circle,{center:[s,0],radius:s});
  assert.equal(pair.tangent,false);close(pair.minus[0],.5);close(pair.minus[1],-Math.sqrt(3)/2);close(pair.plus[1],Math.sqrt(3)/2);
  const unequal=intersectCircles(circle,{center:[s,0],radius:s/2});
  assert.equal(unequal.tangent,false);close(unequal.minus[0],.875);close(unequal.plus[1],Math.sqrt(15)/8);
  const tangent=intersectCircles(circle,{center:[2*s,0],radius:s});
  assert.equal(tangent.tangent,true);close(tangent.minus[0],1);assert.equal(tangent.plus,null);
 }
});
test('Near-concentric circles retain two roots when squared center separation underflows',()=>{
 const pair=intersectCircles({center:[0,0],radius:1},{center:[1e-250,0],radius:1});
 assert.equal(pair.tangent,false);assert.ok(pair.minus&&pair.plus);
 assert.ok(Math.abs(pair.minus[1]+1)<1e-14&&Math.abs(pair.plus[1]-1)<1e-14);
});
