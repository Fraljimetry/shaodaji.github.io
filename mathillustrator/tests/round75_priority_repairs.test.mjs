/** Round 75: independent green regressions for P1 issue IDs 01, 06, 10. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,createResolver,validateDoc} from '../src/model.mjs';
import {generalCrossings,r50SourceShape,transformPoint} from '../src/geometry_round50.mjs';
import {worldBounds,fitSceneView} from '../src/geometry.mjs';

const pt=(d,x,y)=>append(d,{type:'point',xy:[x,y]});
const style={stroke:'#000000',fill:'#000000',opacity:1,width:2};
const near=(a,b,eps=1e-9)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<eps,`${a} is not ${b}`);

test('R75-01: close but distinct points do not intersect, in either argument order',()=>{
 const d=newDoc(),p=pt(d,0,0),q=pt(d,1e-8,0),r=pt(d,0,0),s=pt(d,0,1e-9);
 const resolver=createResolver(d);
 assert.deepEqual(generalCrossings(p,q,resolver),[]);
 assert.deepEqual(generalCrossings(q,p,resolver),[]);
 assert.deepEqual(generalCrossings(p,s,resolver),[]);
 near(generalCrossings(p,r,resolver)[0],[0,0]);
 // A relative tolerance alone would also falsely merge distinct stored
 // coordinates at large translations (both doubles are representable).
 const large=pt(d,1e8,0),largeNear=pt(d,1e8+1e-7,0);
 assert.deepEqual(generalCrossings(large,largeNear,createResolver(d)),[]);
 const falseRoot=append(d,{type:'generalIntersection',refs:[p.id,q.id],rootIndex:0});
 const trueRoot=append(d,{type:'generalIntersection',refs:[p.id,r.id],rootIndex:0});
 const reopened=createResolver(validateDoc(JSON.parse(JSON.stringify(d))));
 assert.equal(reopened.at(falseRoot.id),null,'saved false root must be unresolved but retained');
 near(reopened.at(trueRoot.id),[0,0]);
});

test('R75-06: Fit includes actual transformed polyline extents, not source refs',()=>{
 const d=newDoc(),o=pt(d,0,0),p=pt(d,100,0),q=pt(d,100,100);
 const poly=append(d,{type:'polyline',refs:[o.id,p.id,q.id]});
 const expanded=append(d,{type:'transformCopy',refs:[poly.id,o.id],transform:'dilate',amount:3});
 const transformed=append(d,{type:'transformCopy',refs:[expanded.id,o.id,p.id],transform:'translate',amount:0});
 const resolver=createResolver(d),bounds=worldBounds(d,resolver);
 assert.ok(bounds.maxX>=400&&bounds.maxY>=300,JSON.stringify(bounds));
 const fit=fitSceneView(d,resolver,{w:900,h:600});
 assert.ok(fit.scale>0&&!fit.clipped);
 for(const point of r50SourceShape(transformed,resolver,64)){
  const px=(point[0]-fit.cx)*fit.scale+450,py=(fit.cy-point[1])*fit.scale+300;
  assert.ok(px>=-1e-8&&px<=900+1e-8&&py>=-1e-8&&py<=600+1e-8,`${point}: ${px},${py}`);
 }
 // A newly created resolver after a point edit must recompute bounds.
 q.xy=[100,200];assert.ok(worldBounds(d,createResolver(d)).maxY>=600,'stale transform cache across edits');
});

test('R75-06: hidden transformed outlier does not distort Fit; reflection reverses orientation',()=>{
 const d=newDoc(),o=pt(d,0,0),p=pt(d,2,0),q=pt(d,2,1);
 const poly=append(d,{type:'polyline',refs:[o.id,p.id,q.id]});
 const far=append(d,{type:'transformCopy',refs:[poly.id,o.id],transform:'dilate',amount:1e5,hidden:true});
 const line=append(d,{type:'line',refs:[o.id,p.id]});
 const mirror=append(d,{type:'transformCopy',refs:[poly.id,line.id],transform:'reflect'});
 const initial=worldBounds(d,createResolver(d));assert.ok(initial.maxX<10,JSON.stringify(initial));
 const path=r50SourceShape(mirror,createResolver(d),12);
 near(path[2],[2,-1]);
 far.hidden=false;assert.ok(worldBounds(d,createResolver(d)).maxX>=200000);
});

test('R75-10: 1,500 affine nonpoint images resolve without recursion or vertex drift',()=>{
 const d=newDoc(),o=pt(d,0,0),p=pt(d,1,0),q=pt(d,1,1);
 let id=append(d,{type:'polyline',refs:[o.id,p.id,q.id]}).id;
 for(let i=0;i<1500;i++){
  const next=`o${d.nextId++}`;
  d.objects.push({id:next,name:`Image ${i}`,type:'transformCopy',refs:[id,o.id],transform:'dilate',amount:1,hidden:false,locked:false,style:{...style}});
  id=next;
 }
 const reopened=validateDoc(JSON.parse(JSON.stringify(d))),r=createResolver(reopened);
 const actual=r50SourceShape(r.object(id),r,12);
 assert.equal(actual.length,3);near(actual[0],[0,0]);near(actual[1],[1,0]);near(actual[2],[1,1]);
});

test('R75-10: mixed affine + inversion curves preserve finite branches and analytic images',()=>{
 const d=newDoc(),o=pt(d,0,0),one=pt(d,1,0),p=pt(d,2,0),q=pt(d,2,1);
 const circle=append(d,{type:'circle',refs:[o.id,one.id]});
 const poly=append(d,{type:'polyline',refs:[p.id,q.id]});
 const twice=append(d,{type:'transformCopy',refs:[poly.id,o.id],transform:'dilate',amount:2});
 const inverse=append(d,{type:'transformCopy',refs:[twice.id,circle.id],transform:'invert'});
 const move=append(d,{type:'transformCopy',refs:[inverse.id,o.id,one.id],transform:'translate'});
 const path=r50SourceShape(move,createResolver(d),12);
 assert.ok(path.length>=2);
 for(const xy of path)assert.ok(xy.every(Number.isFinite),`Invalid inverse path vertex ${xy}`);
 near(path[0],transformPoint(transformPoint([4,0],'invert',[0,0],1), 'translate',[0,0],0,[1,0]));
});
