/** Round 76 — separate green regressions for the seven remaining R75 cases.
 * This suite intentionally does not weaken the original discovery oracles.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,validateDoc} from '../src/model.mjs';
import {circleTangents,polylineCrossings,generalCrossings,pointOnObject,bezierLineCrossings,circlePolylineCrossings,r50SourceShape} from '../src/geometry_round50.mjs';
import {polygonArea} from '../src/geometry_measurements.mjs';
const p=(d,x,y)=>append(d,{type:'point',xy:[x,y]});
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);

test('R75-02 outside tiny circle: two exact distinct tangent feet with near-contact geometry',()=>{
 const point=[.0010001,0],circle={center:[0,0],radius:.001},feet=circleTangents(point,circle);
 assert.equal(feet.length,2);
 assert.ok(feet[0][1]<0&&feet[1][1]>0);
 for(const t of feet){near(Math.hypot(t[0],t[1]),.001,1e-15);near((t[0]-point[0])*t[0]+(t[1]-point[1])*t[1],0,1e-18);}
 assert.equal(circleTangents([.0009999,0],circle).length,0);
 assert.deepEqual(circleTangents([0,0],circle),[]);
});

test('R75-03 on-circle tangent: one contact, perpendicular resolvable line and stable legacy branch',()=>{
 const d=newDoc(),c=p(d,0,0),q=p(d,1,0),circ=append(d,{type:'circle',refs:[c.id,q.id]});
 const t=append(d,{type:'tangentCircle',refs:[q.id,circ.id],branch:-1});
 const old=append(d,{type:'tangentCircle',refs:[q.id,circ.id],branch:1});
 const r=createResolver(d),line=r.line(t),legacy=r.line(old);
 assert.deepEqual(circleTangents([1,0],r.circle(circ)),[[1,0]]);
 for(const tangent of [line,legacy]){
  assert.ok(tangent&&tangent.domain==='infinite');
  near(tangent.a[0],1);near(tangent.a[1],0);
  near(Math.abs(tangent.d[0]),0);near(Math.abs(tangent.d[1]),1);
 }
 assert.doesNotThrow(()=>validateDoc(d));
});

test('R75-04 tiny polygon shoelace remains nonzero and degeneracy/self-intersection still refused',()=>{
 const micro=[[0,0],[1e-7,0],[1e-7,1e-7],[0,1e-7]];
 near(polygonArea(micro),1e-14,1e-27);
 near(polygonArea(micro.map(([x,y])=>[x+0.1,y+0.1])),1e-14,1e-22);
 assert.equal(polygonArea([[0,0],[1e-7,1e-7],[0,1e-7],[1e-7,0]]),null);
 assert.equal(polygonArea([[0,0],[1e-7,0],[2e-7,0]]),null);
 assert.equal(polygonArea([[0,0],[1e-7,0],[1e-7,0],[0,1e-7]]),null);
});

test('R75-05 microscopic orthogonal segments intersect; parallel near misses do not',()=>{
 assert.deepEqual(polylineCrossings([[-5e-8,0],[5e-8,0]],[[0,-5e-8],[0,5e-8]]),[[0,0]]);
 assert.deepEqual(polylineCrossings([[-5e-8,0],[5e-8,0]],[[-5e-8,1e-10],[5e-8,1e-10]]),[]);
 assert.equal(polylineCrossings([[0,0],[1,1]],[[0,1],[1,0]]).length,1);
});

test('R75-07 new unbounded fixed-angle distance with old v1 parameter-only compatibility',()=>{
 const d=newDoc(),vertex=p(d,0,0),guide=p(d,1,0);
 const ray=append(d,{type:'fixedAngle',refs:[guide.id,vertex.id],angle:Math.PI/2});
 const legacy=append(d,{type:'pointOnObject',refs:[ray.id],parameter:1,constraintMode:'angleRay'});
 const modern=append(d,{type:'pointOnObject',refs:[ray.id],parameter:1,constraintMode:'angleRay',distance:100});
 const zero=append(d,{type:'pointOnObject',refs:[ray.id],parameter:1,constraintMode:'angleRay',distance:0});
 assert.ok(pointOnObject(ray,1,createResolver(d),r50SourceShape,'angleRay')[1]>=100);
 let r=createResolver(d);near(r.at(legacy.id)[1],30);near(r.at(modern.id)[1],100);near(r.at(zero.id)[1],0);
 const opened=validateDoc(JSON.parse(JSON.stringify(d)));r=createResolver(opened);
 near(r.at(legacy.id)[1],30);near(r.at(modern.id)[1],100);near(r.at(zero.id)[1],0);
 assert.equal(opened.objects.find(o=>o.id===legacy.id).distance,undefined);
 assert.equal(opened.objects.find(o=>o.id===modern.id).distance,100);
 const malformed=JSON.parse(JSON.stringify(d));malformed.objects.find(o=>o.id===modern.id).distance=-1;
 assert.throws(()=>validateDoc(malformed),/distance must be nonnegative/);
});

test('R75-08 cubic Bézier: close three real roots, tangencies and line argument symmetry',()=>{
 const a=.5002,b=.5004,c=.8,A=-a*b*c,B=a*b+a*c+b*c,C=-(a+b+c);
 const ys=[A,A+B/3,A+2*B/3+C/3,A+B+C+1];
 const d=newDoc(),ps=ys.map((y,i)=>p(d,i/3,y));
 const curve=append(d,{type:'bezier',refs:ps.map(p=>p.id)}),u=p(d,0,0),v=p(d,1,0),line=append(d,{type:'line',refs:[u.id,v.id]});
 const r=createResolver(d),roots=generalCrossings(line,curve,r),swap=generalCrossings(curve,line,r);
 assert.equal(roots.length,3);assert.deepEqual(roots,swap);
 for(const [x,expected] of roots.map(x=>x[0]).sort((x,y)=>x-y).map((x,i)=>[x,[a,b,c][i]]))near(x,expected,1e-7);
 const tangent=bezierLineCrossings([[0,.25],[1/3,-1/12],[2/3,-1/12],[1,.25]],r.line(line));
 // y=(t-.5)^2 has a unique root at t=.5.
 assert.equal(tangent.length,1);near(tangent[0][0],.5,1e-9);
 assert.deepEqual(bezierLineCrossings([[0,1],[1/3,1],[2/3,1],[1,1]],r.line(line)),[]);
});

test('R75-09 exact circle–polyline crossings and tangencies with signed coordinates',()=>{
 const d=newDoc(),o=p(d,0,0),q=p(d,1,0),circle=append(d,{type:'circle',refs:[o.id,q.id]});
 const a=p(d,-2,.5),b=p(d,2,.5),poly=append(d,{type:'polyline',refs:[a.id,b.id]});
 const r=createResolver(d),roots=generalCrossings(circle,poly,r);
 assert.equal(roots.length,2);assert.deepEqual(roots,generalCrossings(poly,circle,r));
 for(const [k,pt] of roots.entries()){near(Math.hypot(...pt),1,1e-12);near(pt[1],.5);near(pt[0],(k?1:-1)*Math.sqrt(.75),1e-12);}
 assert.deepEqual(circlePolylineCrossings({center:[0,0],radius:1},[[-2,1],[2,1]]),[[0,1]]);
 assert.deepEqual(circlePolylineCrossings({center:[0,0],radius:1},[[-2,1.1],[2,1.1]]),[]);
});
