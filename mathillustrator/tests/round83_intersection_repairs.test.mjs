/** Round 83 permanent regression tests for precise analytic and sampled point incidence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {generalCrossings} from '../src/geometry_round50.mjs';
const point={id:'p',type:'point'},segment={id:'l',type:'segment'},spline={id:'s',type:'spline'};
function resolver(position){return {
 at(id){return id==='p'?position:null},
 line(o){return o.id==='l'?{a:[0,0],d:[1,0],length:1,domain:'segment'}:null},
 circle(){return null},
 points(o){return o.id==='s'?[[0,0],[1e-11,0]]:[]}
};}
test('R83-01: point 5e-11 away from line does not intersect it',()=>{
 assert.deepEqual(generalCrossings(point,segment,resolver([.5,5e-11])),[]);
});
test('R83-02: point 5e-9 beyond segment endpoint does not intersect',()=>{
 assert.deepEqual(generalCrossings(point,segment,resolver([1+5e-9,0])),[]);
});
test('R83-03: point exactly on a 1e-11-long spline is incident',()=>{
 assert.deepEqual(generalCrossings(point,spline,resolver([5e-12,0])),[[5e-12,0]]);
});
