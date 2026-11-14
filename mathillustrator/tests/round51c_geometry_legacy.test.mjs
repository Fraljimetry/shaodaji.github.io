import test from 'node:test';
import assert from 'node:assert/strict';
import {addPoint,append,createResolver,newDoc,validateDoc} from '../src/model.mjs';
import {r50SourceShape,polylineCrossings,r50Shape} from '../src/geometry_round50.mjs';
const near=(p,q)=>assert.ok(p&&Math.hypot(p[0]-q[0],p[1]-q[1])<1e-5,`${p} != ${q}`);
test('Round51C: legacy two-corner rectangles are available as Geometry intersection, point-on-object and inversion sources',()=>{
 const d=newDoc(),a=addPoint(d,[-2,-1]),b=addPoint(d,[2,1]);
 const rect=append(d,{type:'rectangle',refs:[a.id,b.id]});
 const vertices=r50SourceShape(rect,createResolver(d),96);
 assert.equal(vertices.length,5,'legacy rectangle must be a closed source path');
 for(const pt of [[-2,-1],[2,-1],[2,1],[-2,1],[-2,-1]])assert.ok(vertices.some(p=>Math.hypot(...p.map((v,i)=>v-pt[i]))<1e-8));
 const center=addPoint(d,[0,0]),radiusPoint=addPoint(d,[0,3]),circle=append(d,{type:'circle',refs:[center.id,radiusPoint.id]});
 const inverted=append(d,{type:'transformCopy',refs:[rect.id,circle.id],transform:'invert',amount:0});
 assert.ok(r50Shape(inverted,createResolver(d)).length>10,'inversion of an old rectangle must be a sampled curved outline');
 assert.ok(validateDoc(d));
});
test('Round51C: legacy two-corner ellipse is a sampled closed path with working curve intersection',()=>{
 const d=newDoc(),a=addPoint(d,[-3,-2]),b=addPoint(d,[3,2]);
 const ellipse=append(d,{type:'ellipse',refs:[a.id,b.id]});
 const shape=r50SourceShape(ellipse,createResolver(d),128);
 assert.equal(shape.length,129,'legacy ellipse must be a closed source path');
 near(shape[0],[3,0]);near(shape[32],[0,2]);near(shape.at(-1),[3,0]);
 const p=addPoint(d,[-4,0]),q=addPoint(d,[4,0]),segment=append(d,{type:'segment',refs:[p.id,q.id]});
 const roots=polylineCrossings(shape,r50SourceShape(segment,createResolver(d),96));
 assert.equal(roots.length,2);near(roots[0],[-3,0]);near(roots[1],[3,0]);
 assert.ok(validateDoc(d));
 // Moving a legacy definition anchor must update its sampled geometry.
 b.xy=[5,4];const moved=r50SourceShape(ellipse,createResolver(d),128);near(moved[0],[5,1]);
 assert.ok(validateDoc(JSON.parse(JSON.stringify(d))));
});
test('Round51C: all newly created label-capable object types have a LaTeX default, preserving explicit legacy plain',()=>{
 const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[4,0]),c=addPoint(d,[0,3]);
 for(const [type,refs] of [['segment',[a.id,b.id]],['circle',[a.id,b.id]],['polygon',[a.id,b.id,c.id]],['ellipse',[a.id,b.id,c.id]],['line',[a.id,b.id]],['angle',[a.id,b.id,c.id]]]){
  const object=append(d,{type,refs});assert.equal(object.displayLabelMode,'latex',type);
 }
 for(const type of ['text','node']){
  const object=append(d,{type,xy:[6,6],text:'x',fontSize:18});assert.equal(object.textMode,'latex',type);
 }
 const secondNode=append(d,{type:'node',xy:[7,7],text:'y',fontSize:18});
 const morph=append(d,{type:'morphism',refs:[d.objects.find(o=>o.type==='node').id,secondNode.id],text:'f'});
 assert.equal(morph.textMode,'latex');
 const midpoint=append(d,{type:'midpoint',refs:[a.id,b.id]});assert.equal(midpoint.pointLabelMode,'latex');
 a.pointLabelMode='plain';const legacy={...d,objects:d.objects.map(o=>({...o}))};delete legacy.objects[1].pointLabelMode;
 assert.equal(validateDoc(legacy).objects[1].pointLabelMode,undefined,'legacy unformatted labels remain valid and unchanged');
});
