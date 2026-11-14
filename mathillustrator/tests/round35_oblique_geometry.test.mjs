import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,command,createAnchored,createResolver,derivedShapeVertices,shapeVerticesFromPoints,appendDerivedShapeEdges,guardAnchorMove,validateDoc,clone,affected,remove,isObjectVisible} from '../src/model.mjs';
import {worldBounds,nearestFreehandAttachment} from '../src/geometry.mjs';
import {compatibleObjects} from '../src/selection.mjs';
import {tikzGeometryIssue} from '../src/export_fidelity.mjs';
const close=(a,b,tol=1e-8)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<tol,JSON.stringify({a,b}));
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
const ownerSides=(d,id)=>d.objects.filter(o=>o.edgeOf===id);
const base=()=>{const d=newDoc();for(const [n,p] of [['A',[1,2]],['B',[5,4]],['C',[4,8]]])addPoint(d,p,n);return d;};

test('Round35: 3-point oblique rectangle derives perpendicular width from third control; four owned stable sides',()=>{
 const d=base(),owner=command(d,'Rectangle(A,B,C)'),res=createResolver(d),p=res.points(owner),v=derivedShapeVertices(owner,res.at);
 assert.equal(owner.refs.length,3);assert.equal(v.length,4);close(v[0],p[0]);close(v[1],p[1]);
 const dot=(v[1][0]-v[0][0])*(v[2][0]-v[1][0])+(v[1][1]-v[0][1])*(v[2][1]-v[1][1]);approx(dot,0);
 close(v[3],[v[0][0]+v[2][0]-v[1][0],v[0][1]+v[2][1]-v[1][1]]);
 assert.equal(ownerSides(d,owner.id).length,4);
 const ids=ownerSides(d,owner.id).map(o=>o.id);
 ownerSides(d,owner.id)[0].style.stroke='#ef4444';
 const changed=clone(d);changed.objects.find(o=>o.name==='C').xy=[-2,6];
 const revised=createResolver(changed),vertices=derivedShapeVertices(owner,revised.at);
 assert.notDeepEqual(vertices,v);assert.equal(ownerSides(changed,owner.id)[0].style.stroke,'#ef4444');
 assert.deepEqual(ownerSides(changed,owner.id).map(o=>o.id),ids);
 assert.doesNotThrow(()=>guardAnchorMove(d,changed,changed.objects.find(o=>o.name==='C').id));
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(changed))),changed);
 for(let i=0;i<4;i++){const line=revised.line(ids[i]);assert.ok(line.length>0);close(revised.points(ownerSides(changed,owner.id)[i])[0],vertices[i]);}
 const mid=ownerSides(changed,owner.id)[0],side=revised.points(mid),half=[(side[0][0]+side[1][0])/2,(side[0][1]+side[1][1])/2];
 assert.ok(nearestFreehandAttachment(half,[mid],revised,50,10)?.distancePx<1e-6);
 assert.equal(affected(changed,owner.id).size,5);
 remove(changed,owner.id);assert.equal(ownerSides(changed,owner.id).length,0);
});

test('Round35: three consecutive vertices form a dependent parallelogram, preserving anchors and style',()=>{
 const d=base(),q=command(d,'Parallelogram(A,B,C)'),r=createResolver(d),v=derivedShapeVertices(q,r.at);
 assert.equal(q.type,'parallelogram');assert.equal(q.refs.length,3);assert.deepEqual(v,[[1,2],[5,4],[4,8],[0,6]]);
 assert.equal(ownerSides(d,q.id).length,4);assert.deepEqual(ownerSides(d,q.id).map(e=>r.points(e)),v.map((p,i)=>[p,v[(i+1)%4]]));
 assert.equal(compatibleObjects([q],'fill').length,1);
 assert.equal(newDoc().settings.stroke,'#000000');assert.equal(newDoc().settings.fill,'#000000');
 for(const e of ownerSides(d,q.id))assert.equal(e.style.stroke,'#000000');
 q.hidden=true;assert.equal(isObjectVisible(d,ownerSides(d,q.id)[0]),false);
 assert.equal(worldBounds(d,r).minX,1);q.hidden=false;assert.ok(worldBounds(d,r).minX<=0);
 assert.doesNotThrow(()=>validateDoc(d));assert.equal(tikzGeometryIssue(d),null);
});

test('Round35: legacy two-anchor rectangles remain supported by command, model, renderer and JSON v1',()=>{
 const d=newDoc();addPoint(d,[0,0],'A');addPoint(d,[4,3],'B');const old=command(d,'Rectangle(A,B)');
 assert.equal(old.refs.length,2);assert.deepEqual(derivedShapeVertices(old,createResolver(d).at),[[0,0],[4,0],[4,3],[0,3]]);
 assert.equal(ownerSides(d,old.id).length,4);assert.deepEqual(validateDoc(d),d);
 const copy=clone(d);copy.objects.find(o=>o.name==='B').xy=[-2,-5];
 assert.deepEqual(derivedShapeVertices(old,createResolver(copy).at),[[-2,-5],[0,-5],[0,0],[-2,0]]);
 const p=addPoint(copy,[5,8],'C');const newer=command(copy,'Rectangle(A,B,C)');
 assert.equal(newer.refs.length,3);assert.deepEqual(validateDoc(copy),copy);
});

test('Round35: rejects collinear/duplicate/overflowed three-point constructions atomically and rejects forged edges',()=>{
 const d=newDoc();for(const [name,xy] of [['A',[0,0]],['B',[2,2]],['C',[3,3]],['D',[4,0]]])addPoint(d,xy,name);
 const before=JSON.stringify(d);
 for(const expression of ['Parallelogram(A,B,C)','Rectangle(A,B,C)','Rectangle(A,A,D)','Parallelogram(A,A,D)','Parallelogram(A,B)']){
  assert.throws(()=>command(d,expression));assert.equal(JSON.stringify(d),before);
 }
 assert.deepEqual(shapeVerticesFromPoints('rectangle',[[0,0],[1,0],[1,2]]),[[0,0],[1,0],[1,2],[0,2]]);
 const obj=command(d,'Parallelogram(A,B,D)'),edge=ownerSides(d,obj.id)[0];
 for(const bad of [e=>e.refs.pop(),e=>e.edgeIndex=4,e=>e.edgeOf='o999']){
  const copy=clone(d);bad(copy.objects.find(o=>o.id===edge.id));assert.throws(()=>validateDoc(copy));
 }
 const wrong=clone(d);wrong.objects.find(o=>o.id===obj.id).refs.pop();assert.throws(()=>validateDoc(wrong));
 const denied=clone(d);const selected=denied.objects.find(o=>o.id===obj.id);selected.hidden=true;assert.doesNotThrow(()=>validateDoc(denied));
});

test('Round35: dynamic sides and initial fill remain stable in a connected 128-shape construction',()=>{
 const d=newDoc();let last=null;
 for(let i=0;i<128;i++){
  const a=addPoint(d,[i*3,0]),b=addPoint(d,[i*3+1,1]),c=addPoint(d,[i*3+2,3]);
  last=append(d,{type:i%2===0?'rectangle':'parallelogram',refs:[a.id,b.id,c.id]});appendDerivedShapeEdges(d,last.id);
 }
 assert.equal(d.objects.length,128*8);assert.doesNotThrow(()=>validateDoc(d));
 const r=createResolver(d),bounds=worldBounds(d,r);assert.ok(bounds.maxX>380);
 const output=JSON.stringify(validateDoc(d)),reloaded=JSON.parse(output);assert.deepEqual(validateDoc(reloaded),reloaded);
 assert.equal(createResolver(reloaded).points(ownerSides(reloaded,last.id)[3]).length,2);
});
