/** Round 80: reject newly constructed invisible hyperbolas while preserving legacy v1 files. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {checkNewGeometry,newDoc,addPoint,append,validateDoc,createResolver,position} from '../src/model.mjs';
import {hyperbolaPoints,r50Shape} from '../src/geometry_round50.mjs';

const invalid=[
 [[0,0],[0,0],[1,0]],                  // coincident foci
 [[0,0],[4,0],[0,0]],                  // anchor at a focus
 [[0,0],[4,0],[2,1]],                  // perpendicular bisector (a=0)
 [[0,0],[4,0],[2,0]],                  // anchor on focal segment
 [[0,0],[4,0],[6,0]],                  // anchor on focal ray
 [[0,0],[4,0],[4,0]],                  // other focus
];

test('R77-08: no invisible hyperbola can be created with degenerate anchors',()=>{
 for(const points of invalid){
  assert.equal(hyperbolaPoints(points,8).length,0,JSON.stringify(points));
  assert.throws(()=>checkNewGeometry('hyperbola',points),/hyperbola|foci|degenerate/i,JSON.stringify(points));
 }
});

test('R77-08: valid branches on either side pass construction and sampled geometry',()=>{
 for(const on of [[1,1],[3,1],[1,-2],[3,-2]]){
  const points=[[0,0],[4,0],on];
  assert.doesNotThrow(()=>checkNewGeometry('hyperbola',points));
  const path=hyperbolaPoints(points,32);
  assert.equal(path.length,33);assert.ok(path.every(p=>p.every(Number.isFinite)));
  assert.equal(r50Shape({type:'hyperbola'},{points:()=>points},32).length,33);
 }
});

test('R77-08: new construction rejects snapped degeneracy, but existing project schema remains compatible',()=>{
 const doc=newDoc();
 const ids=[[0,0],[4,0],[1,1]].map(p=>addPoint(doc,p).id);
 checkNewGeometry('hyperbola',ids.map(id=>position(doc,id)));
 const curve=append(doc,{type:'hyperbola',refs:ids});
 assert.doesNotThrow(()=>validateDoc(structuredClone(doc)));
 // Legacy imports that encode an invisible hyperbola remain parseable; no migration.
 doc.objects.find(o=>o.id===ids[2]).xy=[2,0];
 assert.doesNotThrow(()=>validateDoc(structuredClone(doc)));
 assert.equal(createResolver(doc).points(curve).length,3);
 assert.throws(()=>checkNewGeometry('hyperbola',[[0,0],[4,0],[2,0]]),/hyperbola/i);
});
