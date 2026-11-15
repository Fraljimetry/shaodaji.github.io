import test from 'node:test';
import assert from 'node:assert/strict';
import {shapeFromStroke} from '../src/freehand_shapes.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
const near=(a,b,e=.000001)=>Math.abs(a-b)<e;
const circle=Array.from({length:101},(_,i)=>[3+2*Math.cos(2*Math.PI*i/100),-1+4*Math.sin(2*Math.PI*i/100)]);
const stroke=points=>points.flatMap((p,i)=>i===points.length-1?[]:Array.from({length:16},(_,j)=>{const b=points[i+1],t=j/16;return [p[0]*(1-t)+b[0]*t,p[1]*(1-t)+b[1]*t];}));
test('Ellipse/circle preserve centering and force closure',()=>{
 const ellipse=shapeFromStroke(circle,'ellipse',false),round=shapeFromStroke(circle,'ellipse',true);
 assert.ok(ellipse.closed&&round.closed);assert.deepEqual(ellipse.path[0],ellipse.path.at(-1));
 const ex=ellipse.path.map(p=>p[0]),ey=ellipse.path.map(p=>p[1]);
 assert.ok(near((Math.max(...ex)-Math.min(...ex))/2,2));assert.ok(near((Math.max(...ey)-Math.min(...ey))/2,4));
 const rx=(Math.max(...round.path.map(p=>p[0]))-Math.min(...round.path.map(p=>p[0])))/2;
 const ry=(Math.max(...round.path.map(p=>p[1]))-Math.min(...round.path.map(p=>p[1])))/2;
 assert.ok(near(rx,ry));
});
test('Polygon preserves corners; regular polygons equalize edges',()=>{
 for(const vertices of [ [[0,0],[4,0],[2,3],[0,0]], [[0,0],[6,0],[6,3],[0,3],[0,0]] ]){
  const raw=stroke(vertices),p=shapeFromStroke(raw,'polygon',false),r=shapeFromStroke(raw,'polygon',true);
  assert.ok(p&&r);assert.equal(p.path.length,vertices.length);assert.equal(r.path.length,vertices.length);
  const lengths=r.path.slice(0,-1).map((v,i)=>Math.hypot(v[0]-r.path[i+1][0],v[1]-r.path[i+1][1]));
  assert.ok(lengths.every(l=>near(l,lengths[0])));
 }
});
test('Reject degenerate or invalid gestures',()=>{
 assert.equal(shapeFromStroke([[0,0],[1,0]],'ellipse'),null);
 assert.equal(shapeFromStroke([[0,0],[0,0],[0,0]],'polygon'),null);
 assert.equal(shapeFromStroke([[0,0],[Infinity,1]],'ellipse'),null);
});
test('Roundtrip shaped strokes in v1 JSON without changing old Free curves',()=>{
 const d=newDoc();append(d,{type:'freehand',path:[[0,0],[1,1]],closed:false});
 const raw=circle,shape=shapeFromStroke(raw,'ellipse',true);
 append(d,{type:'freehand',...shape,curveShape:'ellipse',curveRegular:true,rawPath:raw,curveLine:'dotted',curveHeads:'none'});
 validateDoc(d);validateDoc(JSON.parse(JSON.stringify(d)));
 for(const modify of [o=>o.curveShape='bad',o=>o.curveRegular='true',o=>o.rawPath=[[NaN,0]],o=>o.closed=false]){
  const bad=structuredClone(d);modify(bad.objects[1]);assert.throws(()=>validateDoc(bad));
 }
});
