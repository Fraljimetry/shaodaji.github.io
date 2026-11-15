/** Follow-up discovery-only intersection boundary counterexamples. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {polylineCrossings,circlePolylineCrossings,generalCrossings} from '../src/geometry_round50.mjs';
test('R84-01: polygonal segments do not intersect beyond one endpoint',()=>{
 assert.deepEqual(polylineCrossings([[0,0],[1,0]],[[1+5e-10,-1],[1+5e-10,1]]),[]);
});
test('R84-02: circle does not intersect a segment that ends just before the circle',()=>{
 assert.deepEqual(circlePolylineCrossings({center:[0,0],radius:1},[[0,0],[1-5e-13,0]]),[]);
});
test('R84-03: analytic line-line crossings respect segment boundaries',()=>{
 const a={id:'a',type:'segment'},b={id:'b',type:'line'};
 const r={line(o){return o.id==='a'?{a:[0,0],d:[1,0],length:1,domain:'segment'}:{a:[1+5e-9,-1],d:[0,1],length:2,domain:'infinite'}},circle(){return null},points(){return []},at(){return null}};
 assert.deepEqual(generalCrossings(a,b,r),[]);
});
