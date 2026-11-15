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
