/** Round 77 discovery-only: intentionally RED mathematical oracles.
 * Do not include this .pending.mjs in release-green *.test.mjs runs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {intersectCircles,intersectLineCircle,circleGeometry,circumcircle,checkNewGeometry} from '../src/model.mjs';
import {circleArcPoints} from '../src/geometry_round50.mjs';

test('R77-01 near-tangent line has two distinct secant roots, not tangent status',()=>{
 const result=intersectLineCircle({a:[0,1-1e-12],d:[1,0],domain:'infinite'},{center:[0,0],radius:1});
 assert.ok(result.minus&&result.plus);
 assert.equal(result.tangent,false);
 assert.ok(result.plus[0]-result.minus[0]>2e-6);
});

test('R77-02 near-tangent circles retain two mathematically distinct roots',()=>{
 const result=intersectCircles({center:[0,0],radius:1},{center:[2-1e-12,0],radius:1});
 assert.equal(result.tangent,false);
 assert.ok(result.minus&&result.plus);
 assert.ok(Math.abs(result.plus[1]-result.minus[1])>2e-6);
});

test('R77-03 externally tangent circles return only the unique geometric root',()=>{
 const result=intersectCircles({center:[0,0],radius:1},{center:[2,0],radius:1});
 assert.equal(result.tangent,true);
 assert.deepEqual(result.minus,[1,0]);
 assert.equal(result.plus,null);
});

test('R77-04 equal near-concentric circles must not disappear when intersections exist',()=>{
 const result=intersectCircles({center:[0,0],radius:1},{center:[1e-11,0],radius:1});
 assert.ok(result.minus&&result.plus);
 assert.ok(Math.abs(result.minus[1])>.99);
 assert.ok(Math.abs(result.plus[1])>.99);
});

test('R77-05 tiny nonzero circle remains mathematically valid in resolver geometry',()=>{
 const center='a',radial='b';
 const result=circleGeometry({type:'circle',refs:[center,radial]},id=>id===center?[0,0]:[1e-10,0]);
 assert.ok(result);
 assert.ok(Math.abs(result.radius-1e-10)<1e-20);
});

test('R77-06 tiny noncollinear three-point circle has a finite circumcircle',()=>{
 const result=circumcircle([[0,0],[1e-9,0],[0,1e-9]]);
 assert.ok(result);
 assert.ok(Math.abs(result.radius-Math.SQRT1_2*1e-9)<1e-20);
});

test('R77-07 sampled circular arc actually includes its middle construction point',()=>{
 const points=[[1,0],[0,1],[-1,0]];
 const path=circleArcPoints(points,24);
 assert.ok(path.some(p=>Math.hypot(p[0],p[1]-1)<1e-12));
});


test('R77-08 degenerate hyperbola cannot be accepted as a new drawable object',()=>{
 assert.throws(()=>checkNewGeometry('hyperbola',[[0,0],[0,0],[1,0]]),/hyperbola|focus|distinct|degenerate/i);
 assert.throws(()=>checkNewGeometry('hyperbola',[[0,0],[4,0],[0,0]]),/hyperbola|focus|degenerate/i);
});

test('R77-09 arc and three-point circle reject the same nearly collinear triple',()=>{
 const points=[[0,0],[0.1,0],[0.2,1e-10]];
 assert.equal(circumcircle(points),null);
 assert.deepEqual(circleArcPoints(points,8),[]);
});
