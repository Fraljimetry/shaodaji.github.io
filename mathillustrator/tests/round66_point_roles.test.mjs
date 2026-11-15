import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,geometricPoint,pointRole,validateDoc} from '../src/model.mjs';
import {r50SourceShape} from '../src/geometry_round50.mjs';
const pt=(d,xy)=>append(d,{type:'point',xy});
test('Round 66: dilation image is a point in the dependency resolver, midpoint, nesting, and saved projects',()=>{
 const d=newDoc(),O=pt(d,[0,0]),P=pt(d,[2,1]);
 const Q=append(d,{type:'transformCopy',refs:[P.id,O.id],transform:'dilate',amount:2});
 const R=append(d,{type:'transformCopy',refs:[Q.id,O.id],transform:'rotate',amount:Math.PI});
 const M=append(d,{type:'midpoint',refs:[Q.id,O.id]});
 const r=createResolver(d);
 assert.deepEqual(r.at(Q.id),[4,2]);assert.ok(Math.abs(r.at(R.id)[0]+4)<1e-9);
 assert.deepEqual(r.at(M.id),[2,1]);assert.equal(geometricPoint(R,r),true);
 assert.equal(r50SourceShape(R,r,16).length,1);
 assert.equal(validateDoc(JSON.parse(JSON.stringify(d))).objects.length,5);
});
test('Round 66: transformed curves are not points, including a one-vertex curve',()=>{
 const d=newDoc(),O=pt(d,[0,0]),P=pt(d,[1,0]);
 const C=append(d,{type:'circle',refs:[O.id,P.id]});
 const image=append(d,{type:'transformCopy',refs:[C.id,O.id],transform:'dilate',amount:2});
 const r=createResolver(d);
 assert.equal(pointRole(image,id=>r.object(id)),false);
 assert.equal(geometricPoint(image,r),false);assert.equal(r.at(image.id),null);
 append(d,{type:'midpoint',refs:[image.id,O.id]});const invalid=structuredClone(d);
 assert.throws(()=>validateDoc(invalid),/Invalid reference target/);
});
test('Round 66: singular inversion does not become a point at the origin',()=>{
 const d=newDoc(),O=pt(d,[0,0]),P=pt(d,[3,0]),C=append(d,{type:'circle',refs:[O.id,P.id]});
 const I=append(d,{type:'transformCopy',refs:[O.id,C.id],transform:'invert',amount:0});
 const r=createResolver(d);assert.equal(r.at(I.id),null);assert.equal(geometricPoint(I,r),false);
 assert.throws(()=>validateDoc(d),/no finite image/i);
});
