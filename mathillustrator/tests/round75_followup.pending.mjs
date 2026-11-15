/** Round 75 discovery ONLY: intentionally failing oracles, NOT release gates.
 * These tests document post-Round-74 defects and must not be made green by
 * weakening assertions, changing expected values, or disabling tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver} from '../src/model.mjs';
import {generalCrossings,circleTangents,polylineCrossings,r50SourceShape,pointOnObject} from '../src/geometry_round50.mjs';
import {polygonArea} from '../src/geometry_measurements.mjs';
import {worldBounds} from '../src/geometry.mjs';
const p=(d,x,y)=>append(d,{type:'point',xy:[x,y]});

test('R75-01 separate nearby points are not their own general intersection',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1e-8,0);
 assert.deepEqual(generalCrossings(a,b,createResolver(d)),[]);
});
test('R75-02 a genuinely outside near-contact point has two real circle tangents',()=>{
 const roots=circleTangents([.0010001,0],{center:[0,0],radius:.001});
 assert.equal(roots.length,2);
});
test('R75-03 a point on the circle should admit its unique tangent',()=>{
 const roots=circleTangents([1,0],{center:[0,0],radius:1});
 assert.equal(roots.length,1);
});
test('R75-04 a valid tiny square has a positive measurable area',()=>{
 const area=polygonArea([[0,0],[1e-7,0],[1e-7,1e-7],[0,1e-7]]);
 assert.ok(area!==null&&Math.abs(area-1e-14)<1e-20,`tiny area=${area}`);
});
test('R75-05 true microscopic perpendicular polyline segments intersect',()=>{
 const roots=polylineCrossings([[-5e-8,0],[5e-8,0]],[[0,-5e-8],[0,5e-8]]);
 assert.equal(roots.length,1);
});
test('R75-06 Fit bounds include the extent of transformed polylines',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,100,0),c=p(d,100,100);
 const poly=append(d,{type:'polyline',refs:[a.id,b.id,c.id]});
 append(d,{type:'transformCopy',refs:[poly.id,a.id],transform:'dilate',amount:3});
 const bounds=worldBounds(d,createResolver(d));
 assert.ok(bounds.maxX>=300&&bounds.maxY>=300,JSON.stringify(bounds));
});
test('R75-07 a constrained point on a Fixed angle ray can reach distance 100',()=>{
 const d=newDoc(),vertex=p(d,0,0),guide=p(d,1,0);
 const ray=append(d,{type:'fixedAngle',refs:[guide.id,vertex.id],angle:0});
 const reachable=pointOnObject(ray,1,createResolver(d),r50SourceShape,'angleRay');
 assert.ok(reachable&&reachable[0]>=100,`angle-ray constrained point stops at ${reachable}`);
});
test('R75-08 a close pair of genuine cubic Bézier crossings cannot vanish between sampling ticks',()=>{
 const [a,b,c]=[.5002,.5004,.8],A=-a*b*c,B=a*b+a*c+b*c,C=-(a+b+c);
 const ys=[A,A+B/3,A+2*B/3+C/3,A+B+C+1];
 const d=newDoc(),controls=ys.map((y,i)=>p(d,i/3,y));
 const curve=append(d,{type:'bezier',refs:controls.map(o=>o.id)});
 const u=p(d,0,0),v=p(d,1,0),line=append(d,{type:'line',refs:[u.id,v.id]});
 const roots=generalCrossings(line,curve,createResolver(d));
 assert.equal(roots.length,3,`only ${JSON.stringify(roots)} instead of 3 real roots`);
});
test('R75-09 sampled circle–polyline intersections must lie on the exact circle',()=>{
 const d=newDoc(),o=p(d,0,0),q=p(d,1,0),a=p(d,-2,.5),b=p(d,2,.5);
 const circle=append(d,{type:'circle',refs:[o.id,q.id]});
 const poly=append(d,{type:'polyline',refs:[a.id,b.id]});
 const roots=generalCrossings(circle,poly,createResolver(d));
 assert.equal(roots.length,2);
 for(const root of roots)assert.ok(Math.abs(Math.hypot(...root)-1)<1e-8,`not on circle: ${root}`);
});
test('R75-10 long chains of nonpoint affine curve images must not overflow the stack',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),c=p(d,1,1);
 let last=append(d,{type:'polyline',refs:[a.id,b.id,c.id]}).id;
 for(let i=0;i<1500;i++){
  const id=`o${d.nextId++}`;
  d.objects.push({id,name:`Curve image ${i}`,type:'transformCopy',refs:[last,a.id],transform:'dilate',amount:1,hidden:false,locked:false,style:{stroke:'#000000',fill:'#000000',width:2,opacity:1}});
  last=id;
 }
 assert.doesNotThrow(()=>r50SourceShape(d.objects.at(-1),createResolver(d),12));
});
