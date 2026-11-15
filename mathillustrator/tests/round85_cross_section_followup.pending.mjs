/** Round 84 follow-up discovery: intentionally RED, no application fixes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {generalCrossings,r50SourceShape,circlePolylineCrossings} from '../src/geometry_round50.mjs';
const empty={line:()=>null,circle:()=>null,points:()=>[],at:()=>null};
test('R85-01 tiny valid axis-aligned rectangle must produce four sides',()=>{
 const rectangle={id:'r',type:'rectangle'};
 const r={...empty,points:()=>[[0,0],[1e-10,2e-10]]};
 assert.equal(r50SourceShape(rectangle,r).length,5);
});
test('R85-02 distinct transformed singleton points must not intersect',()=>{
 const a={id:'a',type:'midpoint'},b={id:'b',type:'midpoint'};
 const r={...empty,at:id=>id==='a'?[0,0]:[5e-18,0]};
 assert.deepEqual(generalCrossings(a,b,r),[]);
});
test('R85-03 small-radius circle must not touch line just outside radius',()=>{
 const r=circlePolylineCrossings({center:[0,0],radius:1e-12},[[-1e-10,1.000005e-12],[1e-10,1.000005e-12]]);
 assert.deepEqual(r,[]);
});
