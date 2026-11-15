/** Round 73: analytic line/circle/point incidences must be scale-safe.
 * Regression oracles originated as RED Round 72 counterexamples. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,validateDoc,intersectLineCircle,intersectCircles} from '../src/model.mjs';
import {generalCrossings} from '../src/geometry_round50.mjs';

const p=(doc,x,y)=>append(doc,{type:'point',xy:[x,y]});
const line=(doc,a,b,type='line')=>append(doc,{type,refs:[a.id,b.id]});
const circle=(doc,a,b)=>append(doc,{type:'circle',refs:[a.id,b.id]});
const crossings=(doc,a,b)=>generalCrossings(a,b,createResolver(doc));
const close=(actual,expected,tol=1e-7)=>assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<=tol,`expected ${expected}, got ${actual}`);

test('R72-04: a distant off-line point must not be accepted by a growing incidence tolerance',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),l=line(d,a,b),q=p(d,1e6,0.05);
 assert.deepEqual(crossings(d,q,l),[]);
 assert.deepEqual(crossings(d,l,q),[]);
});
test('R73: truly incident far points still intersect; ray and segment end domains remain respected',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),l=line(d,a,b),ray=line(d,a,b,'ray'),seg=line(d,a,b,'segment');
 const q=p(d,1e6,0),negative=p(d,-2,0),outside=p(d,2,0);
 close(crossings(d,q,l)[0],[1e6,0]);
 close(crossings(d,q,ray)[0],[1e6,0]);
 assert.deepEqual(crossings(d,negative,ray),[]);
 assert.deepEqual(crossings(d,outside,seg),[]);
});
test('R72-06: a line slightly outside a small circle has no fictitious tangent root',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,0.001,0),c=circle(d,a,b),u=p(d,-1,0.0010001),v=p(d,1,0.0010001),l=line(d,u,v);
 assert.equal(intersectLineCircle(createResolver(d).line(l),createResolver(d).circle(c)).minus,null);
 assert.deepEqual(crossings(d,l,c),[]);assert.deepEqual(crossings(d,c,l),[]);
});
test('R72-07: disjoint tiny circles have no midpoint intersection',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,.001,0),u=p(d,.0020000001,0),v=p(d,.0030000001,0),c=circle(d,a,b),e=circle(d,u,v);
 assert.equal(intersectCircles(createResolver(d).circle(c),createResolver(d).circle(e)).minus,null);
 assert.deepEqual(crossings(d,c,e),[]);assert.deepEqual(crossings(d,e,c),[]);
});
test('R73: tiny point just outside circle is not counted as incident',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,.001,0),c=circle(d,a,b),off=p(d,0,.00100005),on=p(d,0,.001);
 assert.deepEqual(crossings(d,off,c),[]);
 assert.deepEqual(crossings(d,c,off),[]);
 close(crossings(d,on,c)[0],[0,.001]);
});
test('R73: near-miss unit circles must not be clamped to external or internal tangency',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),u=p(d,2+2e-10,0),v=p(d,3+2e-10,0),c=circle(d,a,b),e=circle(d,u,v);
 assert.deepEqual(crossings(d,c,e),[]);
 const f=p(d,0.5+2e-10,0),g=p(d,1+2e-10,0),outer=circle(d,a,b),inner=circle(d,f,g);
 // Radii 1 and 0.5, distance 0.5000000002: these DO intersect.
 assert.equal(crossings(d,outer,inner).length,2);
});
test('R73: real circle-circle secants, external tangents, internal tangents, concentric circles',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),u=p(d,1,0),v=p(d,2,0),c=circle(d,a,b),e=circle(d,u,v);
 const roots=crossings(d,c,e);assert.equal(roots.length,2);for(const r of roots)close([Math.abs(r[0]),Math.abs(r[1])],[.5,Math.sqrt(3)/2]);
 const x=p(d,2,0),y=p(d,3,0),t=circle(d,x,y);close(crossings(d,c,t)[0],[1,0]);assert.equal(crossings(d,c,t).length,1);
 const z=p(d,.5,0),w=p(d,1,0),inside=circle(d,z,w); // internal tangency at x=1
 assert.equal(crossings(d,c,inside).length,1);close(crossings(d,c,inside)[0],[1,0]);
 const k=p(d,.2,0),h=p(d,.4,0),small=circle(d,k,h);assert.deepEqual(crossings(d,c,small),[]);
 const r=p(d,0,.5),nested=circle(d,a,r);assert.deepEqual(crossings(d,c,nested),[]);
});
test('R73: real line-circle secants/tangents, segment/ray domain clipping and input reversal',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),c=circle(d,a,b),l=line(d,p(d,-2,0),p(d,2,0));
 assert.equal(crossings(d,l,c).length,2);assert.equal(crossings(d,c,l).length,2);
 const tangent=line(d,p(d,-2,1),p(d,2,1));assert.equal(crossings(d,tangent,c).length,1);close(crossings(d,tangent,c)[0],[0,1]);
 const miss=line(d,p(d,-2,1+2e-10),p(d,2,1+2e-10));assert.deepEqual(crossings(d,miss,c),[]);
 const ray=line(d,p(d,2,0),p(d,3,0),'ray');assert.deepEqual(crossings(d,ray,c),[]);
 const seg=line(d,p(d,0,0),p(d,.25,0),'segment');assert.deepEqual(crossings(d,seg,c),[]);
});
test('R73: two close but genuine roots on a tiny near-tangent circle must not be merged',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,.001,0),c=circle(d,a,b);
 const y=.001-1e-12,along=line(d,p(d,-.1,y),p(d,.1,y));
 const roots=crossings(d,c,along);
 assert.equal(roots.length,2,`Two mathematical crossings were merged: ${JSON.stringify(roots)}`);
 assert.ok(roots[0][0]<0&&roots[1][0]>0,JSON.stringify(roots));
});
test('R73: derived general-intersection point stays unresolved when two tiny circles do not meet',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,.001,0),u=p(d,.0020000001,0),v=p(d,.0030000001,0),c=circle(d,a,b),e=circle(d,u,v);
 const derived=append(d,{type:'generalIntersection',refs:[c.id,e.id],rootIndex:0});
 assert.doesNotThrow(()=>validateDoc(d));assert.equal(createResolver(d).at(derived.id),null);
});
