import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,createResolver,validateDoc} from '../src/model.mjs';
import {measureGeometry,polygonArea} from '../src/geometry_measurements.mjs';
const near=(v,w)=>assert.ok(Math.abs(v-w)<1e-7*Math.max(1,Math.abs(w)),`${v} != ${w}`);
function scene(){const d=newDoc();const a=addPoint(d,[0,0]),b=addPoint(d,[4,0]),c=addPoint(d,[0,3]);return {d,a,b,c};}
test('Round51: live polygon, regular polygon, rectangle, parallelogram and ellipse areas',()=>{
 const {d,a,b,c}=scene(),quad=addPoint(d,[4,3]),f=addPoint(d,[-3,0]),g=addPoint(d,[3,0]),q=addPoint(d,[0,4]);
 const shapes=[
  [append(d,{type:'polygon',refs:[a.id,b.id,c.id]}),6],
  [append(d,{type:'polygon',refs:[a.id,b.id,quad.id,c.id]}),12],
  [append(d,{type:'rectangle',refs:[a.id,b.id,c.id]}),12],
  [append(d,{type:'parallelogram',refs:[a.id,b.id,quad.id]}),12],
  [append(d,{type:'regularPolygon',refs:[a.id,b.id],sides:4}),32],
  [append(d,{type:'ellipse',refs:[f.id,g.id,q.id]}),Math.PI*5*4],
  [append(d,{type:'ellipse',refs:[a.id,quad.id]}),Math.PI*3],
 ];
 const r=createResolver(d);for(const [obj,expected] of shapes){const actual=measureGeometry(obj,r);assert.equal(actual.kind,'area');near(actual.value,expected);}
 b.xy=[6,0];near(measureGeometry(shapes[0][0],createResolver(d)).value,9);
 assert.ok(validateDoc(d));
});
test('Round51: circles, dynamic sizes, segment length and angle survive document save and changes',()=>{
 const {d,a,b,c}=scene();const circle=append(d,{type:'circle',refs:[a.id,b.id]});
 const seg=append(d,{type:'segment',refs:[a.id,b.id]});
 const angle=append(d,{type:'angle',refs:[b.id,a.id,c.id]});
 const r=createResolver(d);near(measureGeometry(circle,r).value,16*Math.PI);near(measureGeometry(seg,r).value,4);near(measureGeometry(angle,r).value,90);
 const loaded=validateDoc(JSON.parse(JSON.stringify(d)));
 loaded.objects.find(o=>o.id===b.id).xy=[2,0];
 near(measureGeometry(loaded.objects.find(o=>o.id===circle.id),createResolver(loaded)).value,4*Math.PI);
 near(measureGeometry(loaded.objects.find(o=>o.id===seg.id),createResolver(loaded)).value,2);
});
test('Round51: reject self-crossing, repeated, collapsed and nonfinite outlines',()=>{
 assert.equal(polygonArea([[0,0],[2,2],[0,2],[2,0]]),null);
 assert.equal(polygonArea([[0,0],[1,0],[1,0],[0,2]]),null);
 assert.equal(polygonArea([[0,0],[1,0],[2,0]]),null);
 assert.equal(polygonArea([[0,0],[Infinity,1],[2,0]]),null);
 const {d,a,b,c}=scene(),ellipse=append(d,{type:'ellipse',refs:[a.id,b.id,c.id]});
 c.xy=[2,0];assert.equal(measureGeometry(ellipse,createResolver(d)).value,null);
});
