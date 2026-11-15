/** Round 74: green reproductions of the remaining Round 72 defects. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,validateDoc,intersectStraightLines} from '../src/model.mjs';
import {fitSceneView} from '../src/geometry.mjs';
import {r50SourceShape,projectToCurve,alongCurve,generalCrossings,triangleCenter} from '../src/geometry_round50.mjs';
import {measureGeometry} from '../src/geometry_measurements.mjs';
const point=(d,x,y)=>append(d,{type:'point',xy:[x,y]});
const straight=(d,a,b,type='line')=>append(d,{type,refs:[a.id,b.id]});
const circle=(d,a,b)=>append(d,{type:'circle',refs:[a.id,b.id]});
const near=(a,b,eps=1e-7)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<eps,`${a} != ${b}`);

test('R72-01/12: Fit includes widely separated points and does not blame labels',()=>{
 const d=newDoc();point(d,0,0);point(d,1e6,0);
 const v=fitSceneView(d,createResolver(d),{w:825,h:660});
 assert.ok(v.scale<5&&v.scale>0);assert.equal(v.clipped,false);
 for(const x of [0,1e6]){const projected=(x-v.cx)*v.scale+825/2;assert.ok(projected>=0&&projected<=825,`${x} outside: ${projected}`);}
});
test('R72-02: unbounded ray projection and line projection travel beyond drawing samples',()=>{
 const d=newDoc(),a=point(d,0,0),b=point(d,1,0),ray=straight(d,a,b,'ray'),line=straight(d,a,b);
 const r=createResolver(d),rp=r50SourceShape(ray,r),lp=r50SourceShape(line,r);
 const projected=projectToCurve([100,2],rp);near(projected.position,[100,0]);near(alongCurve(rp,projected.parameter),[100,0]);
 near(projectToCurve([-100,0],rp).position,[0,0]);
 const negative=projectToCurve([-100,0],lp);near(negative.position,[-100,0]);near(alongCurve(lp,negative.parameter),[-100,0]);
 const legacy=append(d,{type:'pointOnObject',refs:[ray.id],parameter:.5});
 const unbounded=append(d,{type:'pointOnObject',refs:[ray.id],parameter:1,distance:100});
 const reversed=append(d,{type:'pointOnObject',refs:[line.id],parameter:.5,distance:-100});
 validateDoc(d);const resolved=createResolver(d);
 near(resolved.at(legacy.id),[7.5,0]);near(resolved.at(unbounded.id),[100,0]);near(resolved.at(reversed.id),[-100,0]);
 const reopened=validateDoc(JSON.parse(JSON.stringify(d)));near(createResolver(reopened).at(unbounded.id),[100,0]);
 const invalid=JSON.parse(JSON.stringify(d));invalid.objects.find(o=>o.id===unbounded.id).distance=Infinity;assert.throws(()=>validateDoc(invalid));
});
test('R72-03: small non-collinear triangle has all centers; collinear remains undefined',()=>{
 const triangle=[[0,0],[1e-6,0],[0,1e-6]];
 for(const kind of ['circumcenter','orthocenter','incenter','excenterA','excenterB','excenterC']){
  const center=triangleCenter(triangle,kind);assert.ok(center,kind);assert.ok(center.every(Number.isFinite),kind);
 }
 near(triangleCenter(triangle,'circumcenter'),[5e-7,5e-7],1e-12);
 assert.equal(triangleCenter([[0,0],[1,0],[2,0]],'circumcenter'),null);
});
test('R72-05: near-parallel finite line intersection agrees with general solver',()=>{
 const d=newDoc(),l=straight(d,point(d,0,0),point(d,1,0)),m=straight(d,point(d,0,1e-10),point(d,1,1.1e-10));
 const r=createResolver(d),a=intersectStraightLines(r.line(l),r.line(m)),b=generalCrossings(l,m,r);
 assert.ok(a);assert.equal(b.length,1);near(a,b[0],1e-3);
});
test('R72-08: circle branches and moving line-circle branches use stable orientation',()=>{
 const crossing=dy=>{const d=newDoc(),o=point(d,0,0),r=point(d,1,0),p=point(d,1,dy),q=point(d,2,dy),a=circle(d,o,r),b=circle(d,p,q);return generalCrossings(a,b,createResolver(d));};
 const minus=crossing(-.001),plus=crossing(.001);
 assert.equal(minus.length,2);assert.equal(plus.length,2);
 near(minus[0],plus[0],.01);near(minus[1],plus[1],.01);
 const lineCrossing=theta=>{const d=newDoc(),o=point(d,0,0),radius=point(d,1,0),c=circle(d,o,radius);const dx=Math.cos(theta),dy=Math.sin(theta);const l=straight(d,point(d,-2*dx,-2*dy),point(d,2*dx,2*dy));return generalCrossings(l,c,createResolver(d));};
 const before=lineCrossing(Math.PI/2-.001),after=lineCrossing(Math.PI/2+.001);
 near(before[0],after[0],.01);near(before[1],after[1],.01);
});
test('R72-09: 51 real crossings with an infinite support are returned and persistable',()=>{
 const d=newDoc();const verts=Array.from({length:52},(_,i)=>point(d,i,i%2?1:-1));
 const zigzag=append(d,{type:'polyline',refs:verts.map(p=>p.id)});
 const horizontal=straight(d,point(d,0,0),point(d,1,0));
 const roots=generalCrossings(horizontal,zigzag,createResolver(d));
 assert.equal(roots.length,51);near(roots[50],[50.5,0]);
 const indexed=append(d,{type:'generalIntersection',refs:[horizontal.id,zigzag.id],rootIndex:50});
 const reloaded=validateDoc(JSON.parse(JSON.stringify(d)));
 near(createResolver(reloaded).at(indexed.id),[50.5,0]);
});
test('R72-10: an affine segment image has live 6-unit length without misclassifying rays',()=>{
 const d=newDoc(),a=point(d,0,0),b=point(d,2,0),segment=straight(d,a,b,'segment'),ray=straight(d,a,b,'ray');
 const copy=append(d,{type:'transformCopy',refs:[segment.id,a.id],transform:'dilate',amount:3});
 const rayCopy=append(d,{type:'transformCopy',refs:[ray.id,a.id],transform:'dilate',amount:3});
 assert.equal(measureGeometry(copy,createResolver(d)).value,6);
 assert.equal(measureGeometry(rayCopy,createResolver(d)),null);
});
test('R72-11: 4,000-deep chained point images resolve and can be sampled without recursion',()=>{
 const d=newDoc(),c=point(d,0,0),p=point(d,1,2);let latest=p.id;
 for(let i=0;i<4000;i++){const id=`o${d.nextId++}`;d.objects.push({id,name:`Image ${i}`,type:'transformCopy',refs:[latest,c.id],transform:'rotate',amount:0,hidden:false,locked:false,style:{stroke:'#000000',fill:'#000000',width:2,opacity:1,pointSize:5}});latest=id;}
 validateDoc(d);const r=createResolver(d);near(r.at(latest),[1,2]);near(r50SourceShape(r.object(latest),r,2)[0],[1,2]);
});
