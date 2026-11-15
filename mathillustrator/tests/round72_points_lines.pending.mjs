/**
 * ROUND 72 DOCUMENTATION-ONLY / INTENTIONALLY RED.
 * Run explicitly with `node --test tests/round72_points_lines.pending.mjs`.
 * Deliberately NOT named *.test.mjs so normal full regressions remain green.
 * Each assertion expresses intended mathematical behavior; it is NOT a claim of a fix.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,intersectStraightLines,intersectLineCircle,intersectCircles,validateDoc} from '../src/model.mjs';
import {fitSceneView} from '../src/geometry.mjs';
import {measureGeometry} from '../src/geometry_measurements.mjs';
import {generalCrossings,triangleCenter,projectToCurve,alongCurve,r50SourceShape,polylineCrossings} from '../src/geometry_round50.mjs';

const p=(d,x,y)=>append(d,{type:'point',xy:[x,y]});
const l=(d,a,b,type='line')=>append(d,{type,refs:[a.id,b.id]});
const c=(d,a,b)=>append(d,{type:'circle',refs:[a.id,b.id]});
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('R72-01 Fit should actually contain widely separated finite points',()=>{
 const d=newDoc();p(d,0,0);p(d,1000,0);
 const v=fitSceneView(d,createResolver(d),{w:900,h:600});
 const x=(1000-v.cx)*v.scale+450;
 assert.ok(x>=0&&x<=900,`Far point projected to x=${x}, viewport width=900, view=${JSON.stringify(v)}`);
});
test('R72-02 Point-on-ray drag should reach any finite on-ray position',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),ray=l(d,a,b,'ray'),r=createResolver(d);
 const path=r50SourceShape(ray,r),projection=projectToCurve([100,0],path);
 assert.ok(distance(alongCurve(path,projection.parameter),[100,0])<1e-6,`Snap limited to ${JSON.stringify(projection.position)}`);
});
test('R72-03 Nondegenerate small triangle must have in/ex/circumcenters',()=>{
 const tri=[[0,0],[1e-6,0],[0,1e-6]];
 for(const kind of ['incenter','excenterA','circumcenter']){
  const center=triangleCenter(tri,kind);
  assert.ok(center,`${kind} returned ${center}`);
 }
});
test('R72-04 A point 0.05 units off a distant horizontal line is NOT incident',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),line=l(d,a,b),point=p(d,1e6,.05);
 assert.deepEqual(generalCrossings(point,line,createResolver(d)),[]);
});
test('R72-05 Standard line intersection should agree with general intersection at a finite near-parallel crossing',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,1,0),c0=p(d,0,1e-10),d0=p(d,1,1.1e-10);
 const L=l(d,a,b),M=l(d,c0,d0),r=createResolver(d);
 const exact=intersectStraightLines(r.line(L),r.line(M));
 assert.ok(exact,`generalCrossings=${JSON.stringify(generalCrossings(L,M,r))}, standard intersection=${exact}`);
});
test('R72-06 A near-miss line must not get a false tiny-circle tangent',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,.001,0),C=c(d,a,b),u=p(d,-1,.0010001),v=p(d,1,.0010001),L=l(d,u,v),r=createResolver(d);
 assert.deepEqual(intersectLineCircle(r.line(L),r.circle(C)).minus,null);
 assert.deepEqual(generalCrossings(L,C,r),[]);
});
test('R72-07 Two disjoint tiny circles must not get a false crossing',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,.001,0),u=p(d,.0020000001,0),v=p(d,.0030000001,0),A=c(d,a,b),B=c(d,u,v),r=createResolver(d);
 assert.deepEqual(intersectCircles(r.circle(A),r.circle(B)).minus,null);
 assert.deepEqual(generalCrossings(A,B,r),[]);
});
test('R72-08 General-intersection rootIndex=0 should track one branch under a tiny circle-center perturbation',()=>{
 const root=dy=>{
  const d=newDoc(),a=p(d,0,0),b=p(d,1,0),c0=p(d,1,dy),d0=p(d,2,dy),A=c(d,a,b),B=c(d,c0,d0);
  return generalCrossings(A,B,createResolver(d))[0];
 };
 const lower=root(-.001),upper=root(+.001);
 assert.ok(distance(lower,upper)<.1,`rootIndex=0 jumped ${distance(lower,upper)}: ${lower} -> ${upper}`);
});
test('R72-09 Sampled general intersections should not silently omit crossings 33+',()=>{
 const wavy=Array.from({length:52},(_,i)=>[i,i%2?1:-1]);
 assert.equal(polylineCrossings(wavy,[[-1,0],[52,0]]).length,51);
});
test('R72-10 Affine image of a segment should expose its resolved length measurement',()=>{
 const d=newDoc(),a=p(d,0,0),b=p(d,2,0),seg=l(d,a,b,'segment');
 const img=append(d,{type:'transformCopy',refs:[seg.id,a.id],transform:'dilate',amount:3});
 assert.equal(createResolver(d).line(img)?.length,6);
 assert.equal(measureGeometry(img,createResolver(d))?.value,6);
});

test('R72-11 A schema-valid 4000-deep chain of affine point images must resolve without call-stack overflow',()=>{
 const d=newDoc(),center=p(d,0,0),start=p(d,1,2);let prev=start.id;
 // Add directly to avoid quadratic auto-name search while constructing this fixture.
 for(let i=0;i<4000;i++){const id=`o${i+3}`;d.objects.push({id,name:`Image${i}`,type:'transformCopy',refs:[prev,center.id],transform:'rotate',amount:0,hidden:false,locked:false,style:{stroke:'#000000',fill:'#000000',width:2,opacity:1,pointSize:5}});prev=id;}
 d.nextId=4003;
 assert.doesNotThrow(()=>validateDoc(d));
 assert.deepEqual(createResolver(d).at(prev),[1,2]);
});
