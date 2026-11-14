import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,createResolver,circumcircle,validateDoc,clone,guardAnchorMove,position,remove} from '../src/model.mjs';
import {clipRay,worldBounds,nearestFreehandAttachment,smoothCurveSvg} from '../src/geometry.mjs';

const coords=[[0,0],[4,0],[0,3],[4,3]];
function scene(){const doc=newDoc(),pts=coords.map(p=>addPoint(doc,p));return {doc,pts};}

test('round23: circumcircle unique radius, stable translation, and invalid 3-point cases',()=>{
 const a=circumcircle([[0,0],[4,0],[0,3]]);
 assert.deepEqual(a.center,[2,1.5]);assert.equal(a.radius,2.5);
 const shift=1e6,b=circumcircle([[shift,shift],[shift+4,shift],[shift,shift+3]]);
 assert.deepEqual(b.center,[shift+2,shift+1.5]);assert.equal(b.radius,2.5);
 for(const pts of [[[0,0],[1,1],[2,2]],[[0,0],[1,1],[1+1e-11,1+1e-11]],[[0,0],[0,0],[0,3]],[[0,0],[1,0],[1,1e-12]],[[0,0],[Infinity,0],[0,3]],[]])assert.equal(circumcircle(pts),null);
});

test('round23: ray clips forward only at horizontal/vertical/diagonal viewport bounds',()=>{
 assert.deepEqual(clipRay([5,5],[6,5],10,10),[[5,5],[10,5]]);
 assert.deepEqual(clipRay([5,5],[4,5],10,10),[[5,5],[0,5]]);
 assert.deepEqual(clipRay([5,5],[5,6],10,10),[[5,5],[5,10]]);
 assert.deepEqual(clipRay([-5,5],[-4,5],10,10),[[0,5],[10,5]]);
 assert.equal(clipRay([-5,5],[-6,5],10,10),null);
 assert.equal(clipRay([1,1],[1,1],10,10),null);
 assert.equal(clipRay([0,0],[1,0],-1,10),null);
});

test('round23: live midpoint, bisector, ray and three-point circle survive JSON and parent motion',()=>{
 const {doc,pts}=scene();const ids=pts.map(x=>x.id);
 const mid=append(doc,{type:'midpoint',refs:ids.slice(0,2)}),bis=append(doc,{type:'perpBisector',refs:ids.slice(0,2)}),ray=append(doc,{type:'ray',refs:ids.slice(0,2)}),circle=append(doc,{type:'circleThrough3',refs:ids.slice(0,3)});
 assert.deepEqual(position(doc,mid.id),[2,0]);assert.deepEqual(circumcircle(createResolver(doc).points(circle)).center,[2,1.5]);
 assert.deepEqual(validateDoc(clone(doc)),doc);
 const before=clone(doc);pts[0].xy=[-2,0];guardAnchorMove(before,doc,pts[0].id);
 assert.deepEqual(position(doc,mid.id),[1,0]);assert.notDeepEqual(circumcircle(createResolver(doc).points(circle)).center,[2,1.5]);
 const bounds=worldBounds(doc,createResolver(doc));assert.ok(bounds.minX < -2 && bounds.maxX > 4 && bounds.minY < -2.8 && bounds.maxY > 3,JSON.stringify(bounds));
 assert.equal(remove(doc,pts[0].id),5);assert.ok(doc.objects.every(o=>!o.refs||!o.refs.includes(ids[0])));
 assert.ok(validateDoc(doc));
});

test('round23: imported malformed new dependency types reject rather than produce invisible artwork',()=>{
 const {doc,pts}=scene();const c=append(doc,{type:'circleThrough3',refs:pts.slice(0,3).map(o=>o.id)}),snap=clone(doc);
 assert.ok(validateDoc(snap));
 for(const type of ['ray','perpBisector','circleThrough3','spline']){
  const bad=clone(doc);bad.objects.at(-1).type=type;bad.objects.at(-1).refs=type==='spline'?[pts[0].id,pts[0].id,pts[1].id]:type==='circleThrough3'?[pts[0].id,pts[1].id,pts[1].id]:[pts[0].id,pts[0].id];
  assert.throws(()=>validateDoc(bad),/distinct|noncollinear|consecutive|invalid/i);
 }
 const moved=clone(doc);moved.objects.find(o=>o.id===pts[2].id).xy=[2,0];
 assert.throws(()=>guardAnchorMove(doc,moved,pts[2].id),/collapse/i);
 assert.equal(c.refs.length,3);
});

test('round23: open/closed spline refs, tangent rendering, invalid seams and points in document format',()=>{
 const {doc,pts}=scene(),refs=pts.map(o=>o.id);
 const open=append(doc,{type:'spline',refs:refs.slice(0,3)}),closed=append(doc,{type:'spline',refs,closed:true});
 assert.deepEqual(validateDoc(doc),doc);
 const openPath=smoothCurveSvg(refs.slice(0,3).map(id=>position(doc,id)));
 const closedPath=smoothCurveSvg(refs.map(id=>position(doc,id)),true);
 assert.match(openPath,/C/);assert.doesNotMatch(openPath,/ Z$/);
 assert.match(closedPath,/C/);assert.match(closedPath,/ Z$/);
 assert.ok(!closedPath.includes('NaN'));assert.equal(open.closed,undefined);
 const malformed=clone(doc);malformed.objects.at(-1).refs[3]=refs[0];assert.throws(()=>validateDoc(malformed),/first vertex/);
 const wrong=clone(doc);wrong.objects.at(-1).closed='yes';assert.throws(()=>validateDoc(wrong),/closure/);
});

test('round23: ray snapping uses forward half-line beyond the direction anchor',()=>{
 const {doc,pts}=scene();const ray=append(doc,{type:'ray',refs:pts.slice(0,2).map(o=>o.id)});
 const resolver=createResolver(doc);
 const forward=nearestFreehandAttachment([9,0.06],[ray],resolver,50,16),backward=nearestFreehandAttachment([-1,0],[ray],resolver,50,16);
 assert.ok(forward);assert.ok(Math.abs(forward.world[0]-9)<1e-8);assert.ok(Math.abs(forward.world[1])<1e-8);
 assert.equal(backward,null);
});
