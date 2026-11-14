import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,validateDoc,createResolver,position,remove,guardAnchorMove,clone,command,intersectStraightLines} from '../src/model.mjs';
import {nearestFreehandAttachment,worldBounds} from '../src/geometry.mjs';

const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
function scene(){
 const doc=newDoc();
 const [a,b,c,d,e]=[[0,0],[4,0],[1,-3],[1,3],[0,2]].map(p=>addPoint(doc,p));
 const horizontal=append(doc,{type:'line',refs:[a.id,b.id]});
 const vertical=append(doc,{type:'line',refs:[c.id,d.id]});
 return {doc,a,b,c,d,e,horizontal,vertical};
}
test('Round 25: two dynamic through-point lines and a crossing intersection remain reference-based',()=>{
 const {doc,b,d,e,horizontal,vertical}=scene();
 const parallel=append(doc,{type:'parallelThrough',refs:[e.id,horizontal.id]});
 const perpendicular=append(doc,{type:'perpendicularThrough',refs:[e.id,horizontal.id]});
 const cross=append(doc,{type:'intersection',refs:[parallel.id,vertical.id]});
 const r=createResolver(doc);
 assert.deepEqual(r.line(parallel).a,[0,2]);assert.deepEqual(r.line(parallel).d,[1,0]);
 approx(r.line(perpendicular).d[0],0);approx(r.line(perpendicular).d[1],1);
 assert.deepEqual(r.at(cross.id),[1,2]);
 assert.deepEqual(validateDoc(doc),doc);
 const old=clone(doc);b.xy=[4,4];guardAnchorMove(old,doc,b.id);
 const now=createResolver(doc);approx(now.line(parallel).d[0],Math.SQRT1_2);approx(now.line(parallel).d[1],Math.SQRT1_2);
 assert.deepEqual(now.at(cross.id),[1,3]);
 assert.deepEqual(validateDoc(doc),doc);
 const bounds=worldBounds(doc,now);assert.ok(bounds.minX<=0 && bounds.maxX>=4 && bounds.maxY>=4);
 const saved=validateDoc(JSON.parse(JSON.stringify(doc)));assert.deepEqual(position(saved,cross.id),[1,3]);
 assert.equal(remove(doc,horizontal.id),4,'source line, both through-lines, and their intersection deleted');
 assert.ok(doc.objects.some(o=>o.id===vertical.id));
});
test('Round 25: intersections honor segment and ray domains and reject near-parallel',()=>{
 const a={a:[0,0],d:[1,0],domain:'segment',length:1};
 const b={a:[2,-1],d:[0,1],domain:'infinite',length:1};
 assert.equal(intersectStraightLines(a,b),null);
 assert.deepEqual(intersectStraightLines({...a,domain:'infinite'},b),[2,0]);
 assert.equal(intersectStraightLines({...a,domain:'ray'}, {a:[-1,-1],d:[0,1],domain:'infinite',length:1}),null);
 assert.equal(intersectStraightLines({...a,domain:'infinite'}, {a:[0,1],d:[1,1e-12],domain:'infinite',length:1}),null);
 assert.deepEqual(intersectStraightLines({...a,domain:'ray'}, {a:[0,-1],d:[0,1],domain:'infinite',length:1}),[0,0]);
});
test('Round 25: anchor movement cannot silently invalidate previously valid crossing',()=>{
 const {doc,a,b,c,d,horizontal,vertical}=scene();
 const cross=append(doc,{type:'intersection',refs:[horizontal.id,vertical.id]});
 assert.deepEqual(position(doc,cross.id),[1,0]);
 const before=clone(doc);c.xy=[1,0];d.xy=[3,0];
 assert.throws(()=>guardAnchorMove(before,doc,c.id),/collapse/i);
 assert.throws(()=>validateDoc(doc),/intersection/i);
});
test('Round 25: malformed references/cycles and noncrossing intersections are rejected',()=>{
 const {doc,e,horizontal,vertical}=scene();
 const through=append(doc,{type:'parallelThrough',refs:[e.id,horizontal.id]});
 const cross=append(doc,{type:'intersection',refs:[horizontal.id,vertical.id]});
 for(const patch of [
  d=>d.objects.find(o=>o.id===through.id).refs.reverse(),
  d=>d.objects.find(o=>o.id===cross.id).refs[0]=e.id,
  d=>d.objects.find(o=>o.id===cross.id).refs[1]=cross.id,
  d=>d.objects.find(o=>o.id===through.id).refs[1]='o999',
 ]){const bad=clone(doc);patch(bad);assert.throws(()=>validateDoc(bad));}
 const near=clone(doc);near.objects.find(o=>o.id===vertical.id).refs=[horizontal.refs[0],horizontal.refs[1]];
 assert.throws(()=>validateDoc(near),/intersection/i);
});
test('Round 25: command construction and source-line snapping preserve exact geometry',()=>{
 const {doc,e,horizontal,vertical}=scene();
 const p=command(doc,`Parallel(${e.name}, ${horizontal.name})`);
 const q=command(doc,`Perpendicular(${e.name}, ${horizontal.name})`);
 const x=command(doc,`Intersect(${p.name}, ${vertical.name})`);
 assert.equal(p.type,'parallelThrough');assert.equal(q.type,'perpendicularThrough');assert.equal(x.type,'intersection');
 assert.deepEqual(position(doc,x.id),[1,2]);
 assert.ok(nearestFreehandAttachment([0.3,2.05],[p],createResolver(doc),50,16));
 assert.throws(()=>command(doc,`Intersect(${p.name}, ${horizontal.name})`),/crossing/i);
 assert.deepEqual(validateDoc(doc),doc);
});
test('Round 25: large dependency chains of through lines + intersections do not recurse',()=>{
 const {doc,e,horizontal,vertical}=scene();
 let last=e.id;
 // Each step depends on the last intersection via an infinite horizontal line.
 for(let i=0;i<900;i++){
  const through=append(doc,{type:'parallelThrough',refs:[last,horizontal.id]});
  const hit=append(doc,{type:'intersection',refs:[through.id,vertical.id]});
  last=hit.id;
 }
 assert.deepEqual(position(doc,last),[1,2]);
 assert.deepEqual(position(validateDoc(doc),last),[1,2]);
});
