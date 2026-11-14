import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,appendPolygonEdges,createResolver,command,validateDoc,remove,affected,clone,guardAnchorMove} from '../src/model.mjs';
import {nearestFreehandAttachment} from '../src/geometry.mjs';
import {createAnchorIndex} from '../src/anchor_index.mjs';

const xy=(doc,id)=>createResolver(doc).at(id);
const simple=()=>{const d=newDoc();for(const [name,p] of [['A',[0,0]],['B',[4,0]],['C',[3,3]],['D',[0,2]]])addPoint(d,p,name);return d;};
test('R28: command polygon creates actual, independently editable segments sharing live references',()=>{
 const d=simple(),polygon=command(d,'Polygon(A,B,C,D)'),edges=d.objects.filter(o=>o.edgeOf===polygon.id);
 assert.equal(edges.length,4);assert.equal(new Set(edges.map(o=>o.id)).size,4);
 assert.deepEqual(edges.map(o=>o.refs),[[d.objects[0].id,d.objects[1].id],[d.objects[1].id,d.objects[2].id],[d.objects[2].id,d.objects[3].id],[d.objects[3].id,d.objects[0].id]]);
 assert.ok(edges.every(o=>o.type==='segment'));
 assert.doesNotThrow(()=>validateDoc(d));
 const before=clone(d);d.objects[0].xy=[-2,1];guardAnchorMove(before,d,d.objects[0].id);
 assert.deepEqual(createResolver(d).points(edges[0]),[[-2,1],[4,0]]);
 assert.deepEqual(createResolver(d).points(edges[3]),[[0,2],[-2,1]]);
});
test('R28: polygon removal cascades to generated edges; removing just an edge preserves polygon',()=>{
 const d=simple(),poly=command(d,'Polygon(A,B,C,D)'),edges=d.objects.filter(o=>o.edgeOf===poly.id);
 const ids=affected(d,poly.id);assert.equal(ids.size,5);
 remove(d,edges[0].id);assert.equal(d.objects.filter(o=>o.edgeOf===poly.id).length,3);validateDoc(d);
 remove(d,poly.id);assert.equal(d.objects.filter(o=>o.type==='segment').length,0);
 assert.equal(d.objects.filter(o=>o.type==='point').length,4);validateDoc(d);
});
test('R28: malformed ownership references and edge endpoints reject import',()=>{
 const d=simple(),poly=command(d,'Polygon(A,B,C,D)'),edge=d.objects.find(o=>o.edgeOf===poly.id);
 const mutate=f=>{const copy=clone(d);f(copy.objects.find(o=>o.id===edge.id));assert.throws(()=>validateDoc(copy),/edge|owner|reference/i);};
 mutate(o=>o.edgeOf='o999');mutate(o=>o.edgeOf=d.objects[0].id);mutate(o=>o.refs=[d.objects[0].id,d.objects[2].id]);
});
test('R28: new geometric displayed labels are LaTeX by default; legacy absent mode remains valid',()=>{
 const d=simple();const seg=append(d,{type:'segment',refs:[d.objects[0].id,d.objects[1].id]});
 assert.equal(seg.displayLabelMode,'latex');assert.equal(d.objects[0].pointLabelMode,'latex');
 const legacy=clone(d);delete legacy.objects[0].pointLabelMode;delete legacy.objects.at(-1).displayLabelMode;
 assert.doesNotThrow(()=>validateDoc(legacy));
});
test('R28: angle object snapping follows its visible 26px arc, NOT the hidden defining arms',()=>{
 const d=newDoc(),ids=[[0,0],[2,0],[2,2]].map(p=>addPoint(d,p).id);
 const a=append(d,{type:'angle',refs:ids}),resolver=createResolver(d),scale=50;
 // The angle's arms point left/up, but the displayed arc is centered on (2,0).
 // A point 70px down the invisible horizontal arm must not be attracted.
 const none=nearestFreehandAttachment([.6,.05],[a],resolver,scale,12);
 assert.equal(none,null);
 // At y≈0.37, x≈1.63: exactly on the 26px-radius 135-degree arc.
 const visible=nearestFreehandAttachment([2-26/50/Math.sqrt(2),26/50/Math.sqrt(2)],[a],resolver,scale,12);
 assert.ok(visible&&visible.distancePx<1,visible);
});
test('R28: object snap works across all core geometry classes and excludes hidden, invisible, distant',()=>{
 const d=simple(),ids=d.objects.map(o=>o.id),shapes=[
  append(d,{type:'segment',refs:[ids[0],ids[1]]}),
  append(d,{type:'circle',refs:[ids[0],ids[1]]}),
  append(d,{type:'polygon',refs:[ids[0],ids[1],ids[2],ids[3]]}),
  append(d,{type:'rectangle',refs:[ids[0],ids[2]]}),
  append(d,{type:'ellipse',refs:[ids[0],ids[2]]}),
  append(d,{type:'bezier',refs:[ids[0],ids[1],ids[2],ids[3]]})
 ];
 const resolver=createResolver(d);
 for(const [o,near] of shapes.map((o,i)=>[o,[[0,0],[4,0],[0,0],[0,0],[3,1.5],[0,0]][i]])){const pos=nearestFreehandAttachment(near,[o],resolver,50,12);assert.ok(pos,o.type);}
 const segment=shapes[0];segment.hidden=true;
 assert.equal(nearestFreehandAttachment([2,.01],[segment],resolver,50,12),null);
 segment.hidden=false;segment.style.opacity=0;
 assert.equal(nearestFreehandAttachment([2,.01],[segment],resolver,50,12),null);
 segment.style.opacity=1;
 assert.equal(nearestFreehandAttachment([2,1],[segment],resolver,50,12),null);
});
test('R28: overlapping anchor cycling no longer references undefined variable',()=>{
 const d=simple(),ix=createAnchorIndex(d,createResolver(d),{cx:0,cy:0,scale:50},{w:500,h:400});
 assert.deepEqual(ix.hits(250,200),[d.objects[0].id]);
});

test('R28: polygon sides survive JSON round-trip and continue following moved anchors',()=>{
 const doc=simple(),parent=command(doc,'Polygon(A,B,C,D)');
 const restored=JSON.parse(JSON.stringify(doc));
 assert.doesNotThrow(()=>validateDoc(restored));
 const originalEdges=doc.objects.filter(o=>o.edgeOf===parent.id);
 const restoredEdges=restored.objects.filter(o=>o.edgeOf===parent.id);
 assert.deepEqual(restoredEdges,originalEdges);
 restored.objects[1].xy=[7,-1];
 assert.deepEqual(createResolver(restored).points(restoredEdges[0]),[[0,0],[7,-1]]);
 assert.deepEqual(createResolver(restored).points(restoredEdges[1]),[[7,-1],[3,3]]);
});

test('R28: visible segment snap is bounded by an exact 10px screen-space tolerance',()=>{
 const d=newDoc();const a=addPoint(d,[0,0]).id,b=addPoint(d,[4,0]).id;
 const s=append(d,{type:'segment',refs:[a,b]}),resolver=createResolver(d);
 const inside=nearestFreehandAttachment([2,0.19],[s],resolver,50,10);
 assert.ok(inside&&Math.abs(inside.world[1])<1e-12&&inside.distancePx<10);
 assert.equal(nearestFreehandAttachment([2,0.21],[s],resolver,50,10),null);
 assert.equal(nearestFreehandAttachment([2,0.05],[s],resolver,200,9),null);
});
