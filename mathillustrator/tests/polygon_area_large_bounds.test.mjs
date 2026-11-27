import test from 'node:test';
import assert from 'node:assert/strict';
import {polygonArea} from '../src/geometry_measurements.mjs';

// Large imported polygons should remain responsive without relaxing the
// exact segment-intersection test or accepting a crossed outline.
test('large simple polygon preserves area at the upper interactive scale',()=>{
 const n=2000;
 const vertices=Array.from({length:n},(_,i)=>[Math.cos(2*Math.PI*i/n),Math.sin(2*Math.PI*i/n)]);
 const area=polygonArea(vertices);
 assert.ok(Math.abs(area-n*Math.sin(2*Math.PI/n)/2)<1e-9);
});
test('large polygon with distant crossing edges still rejects area',()=>{
 const n=1200;
 const vertices=Array.from({length:n},(_,i)=>[Math.cos(2*Math.PI*i/n),Math.sin(2*Math.PI*i/n)]);
 [vertices[300],vertices[900]]=[vertices[900],vertices[300]];
 assert.equal(polygonArea(vertices),null);
});
test('micro-scale overlap and separated edges remain distinguishable',()=>{
 assert.equal(polygonArea([[0,0],[1e-8,1e-8],[0,1e-8],[1e-8,0]]),null);
 assert.ok(Math.abs(polygonArea([[0,0],[1e-8,0],[1e-8,1e-8],[0,1e-8]])-1e-16)<1e-28);
});
