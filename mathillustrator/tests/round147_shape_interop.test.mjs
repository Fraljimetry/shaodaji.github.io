import test from 'node:test';
import assert from 'node:assert/strict';
import {shapeFromStroke} from '../src/freehand_shapes.mjs';
import {newDoc,append,createResolver,geometricCircle,intersectLineCircle} from '../src/model.mjs';
import {r50SourceShape,generalCrossings} from '../src/geometry_round50.mjs';
const close=(a,b,eps=1e-6)=>Math.abs(a-b)<=eps;
const add=(d,o)=>append(d,o);
const rawCircle=Array.from({length:65},(_,i)=>[3+2*Math.cos(i*Math.PI/32),-1+2*Math.sin(i*Math.PI/32)]);
test('regular freehand ellipse is analytic circle for native constructions',()=>{
 const d=newDoc();const c=add(d,{type:'freehand',...shapeFromStroke(rawCircle,'ellipse',true),curveShape:'ellipse',curveRegular:true,rawPath:rawCircle});
 const a=add(d,{type:'point',xy:[-10,-1]}),b=add(d,{type:'point',xy:[10,-1]});const l=add(d,{type:'line',refs:[a.id,b.id]});
 const r=createResolver(d);assert.ok(geometricCircle(c,r));const cc=r.circle(c);assert.ok(close(cc.center[0],3)&&close(cc.center[1],-1));
 const roots=intersectLineCircle(r.line(l),cc);assert.ok(roots.minus&&roots.plus);assert.ok([roots.minus[0],roots.plus[0]].sort((a,b)=>a-b).every((x,i)=>close(x,i?5:1)));
 const constrained=add(d,{type:'pointOnObject',refs:[c.id],parameter:0});assert.ok(close(createResolver(d).at(constrained.id)[0],5));
});
test('drawn polygon shares curve geometry with native lines and polygons',()=>{
 const d=newDoc();const raw=[[0,0],[4,0],[4,3],[0,3],[0,0]];
 const p=add(d,{type:'freehand',...shapeFromStroke(raw,'polygon',false),curveShape:'polygon',curveRegular:false,rawPath:raw});
 const a=add(d,{type:'point',xy:[2,-2]}),b=add(d,{type:'point',xy:[2,5]}),l=add(d,{type:'line',refs:[a.id,b.id]});
 const r=createResolver(d);assert.equal(r50SourceShape(p,r).length,5);
 const roots=generalCrossings(p,l,r);assert.equal(roots.length,2);assert.ok(roots.every(x=>close(x[0],2)));
 const on=add(d,{type:'pointOnObject',refs:[p.id],parameter:.125});assert.ok(createResolver(d).at(on.id));
});
test('nonregular drawn ellipse participates in curve intersections but not exact circle roles',()=>{
 const d=newDoc();const raw=rawCircle.map(([x,y])=>[x,(y+1)*2-1]);
 const e=add(d,{type:'freehand',...shapeFromStroke(raw,'ellipse',false),curveShape:'ellipse',curveRegular:false,rawPath:raw});
 const a=add(d,{type:'point',xy:[-10,-1]}),b=add(d,{type:'point',xy:[10,-1]}),l=add(d,{type:'line',refs:[a.id,b.id]});const r=createResolver(d);
 assert.equal(geometricCircle(e,r),false);assert.equal(generalCrossings(e,l,r).length,2);
});
test('drawn circles intersect native circles, and drawn polygons intersect native polygons',()=>{
 const d=newDoc();const first=add(d,{type:'freehand',...shapeFromStroke(rawCircle,'ellipse',true),curveShape:'ellipse',curveRegular:true,rawPath:rawCircle});
 const center=add(d,{type:'point',xy:[5,-1]}),radius=add(d,{type:'point',xy:[7,-1]});
 const native=add(d,{type:'circle',refs:[center.id,radius.id]});let r=createResolver(d);
 const roots=generalCrossings(first,native,r);assert.equal(roots.length,2);
 const cross=add(d,{type:'circleCircleIntersection',refs:[first.id,native.id],branch:-1});assert.ok(createResolver(d).at(cross.id));
 const raw=[[0,0],[4,0],[4,3],[0,3],[0,0]];
 const drawn=add(d,{type:'freehand',...shapeFromStroke(raw,'polygon',false),curveShape:'polygon',curveRegular:false,rawPath:raw});
 const nativePoints=[[-1,1],[2,5],[5,1]].map(xy=>add(d,{type:'point',xy}));
 const polygon=add(d,{type:'polygon',refs:nativePoints.map(p=>p.id)});r=createResolver(d);
 assert.ok(generalCrossings(drawn,polygon,r).length>=2);
});
test('forged freehand circles do not gain a circle geometric role',()=>{
 const d=newDoc();const forged=add(d,{type:'freehand',path:[[0,0],[1,0],[1,1],[0,1],[0,0]],closed:true,curveShape:'ellipse',curveRegular:true});
 const r=createResolver(d);assert.equal(geometricCircle(forged,r),false);
});
