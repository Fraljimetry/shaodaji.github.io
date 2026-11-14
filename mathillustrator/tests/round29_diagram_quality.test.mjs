import test from 'node:test';
import assert from 'node:assert/strict';
import {labelOnPolyline,labelOnQuadratic,labelDragOffset} from '../src/diagram_routing.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';

test('R29 swap mirrors signed label normals on straight, curved and polyline arrows',()=>{
 const a=[0,0],c=[5,0],b=[10,0];
 assert.deepEqual(labelOnQuadratic(a,c,b,.5,17,false),[5,17]);
 assert.deepEqual(labelOnQuadratic(a,c,b,.5,17,true),[5,-17]);
 const upper=labelOnQuadratic(a,[5,-3],b,.5,17,false,2,-36);
 const lower=labelOnQuadratic(a,[5,-3],b,.5,17,true,2,-36);
 assert.equal(upper[0],lower[0]);assert.ok(Math.abs(upper[1]-lower[1]-34)<1e-9);
 assert.deepEqual(labelOnPolyline([[0,0],[10,0],[10,10]],.25,17,false),[5,17]);
 assert.deepEqual(labelOnPolyline([[0,0],[10,0],[10,10]],.25,17,true),[5,-17]);
 assert.deepEqual(labelOnPolyline([[0,0],[10,0],[10,10]],.75,17,false),[-7,5]);
 assert.deepEqual(labelOnPolyline([[0,0],[10,0],[10,10]],.75,17,true),[27,5]);
});

test('R29 signed arrow-label offsets preserve negative values, cancellation and bounds',()=>{
 assert.deepEqual(labelDragOffset(0,-36,[10,10],[11,11]),[0,-36]); // subpixel jitter
 assert.deepEqual(labelDragOffset(0,-36,[10,10],[51,29]),[41,-17]);
 assert.deepEqual(labelDragOffset(-8.75,-0.125,[10,10],[10,10]),[-8.75,-0.125]);
 assert.deepEqual(labelDragOffset(299,-299,[0,0],[100,-100]),[300,-300]);
 assert.equal(labelDragOffset(0,-36,[10,10],[Infinity,0]),null);
});

test('R29 old/new diagram JSON retains labels, routing, styles and independent side toggles',()=>{
 for(const routing of ['direct','avoid','avoid-crossings','scene-crossings']){
  const d=newDoc(),a=append(d,{type:'node',xy:[-3,0],text:'A'}),b=append(d,{type:'node',xy:[3,0],text:'B'});
  const morph=append(d,{type:'morphism',refs:[a.id,b.id],text:String.raw`\varphi`,textMode:'latex',arrowStyle:'hook-dashed',routing,labelAvoid:true,swap:true,labelDy:-36});
  const revived=validateDoc(JSON.parse(JSON.stringify(d)));
  const actual=revived.objects.find(o=>o.id===morph.id);
  assert.equal(actual.arrowStyle,'hook-dashed');assert.equal(actual.routing,routing);
  assert.equal(actual.labelDy,-36);assert.equal(actual.swap,true);assert.equal(actual.labelAvoid,true);
  assert.deepEqual(actual.refs,[a.id,b.id]);
 }
});
