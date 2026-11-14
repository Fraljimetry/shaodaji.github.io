import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,command,createResolver,validateDoc,remove,clone} from '../src/model.mjs';
import {reorderVisible,shiftVisible} from '../src/object_order.mjs';
import {newScene3D,add3DPlot,project3DScene,implicitGridCells,MAX_3D_FACES,MAX_3D_EVALUATIONS} from '../src/plot3d.mjs';
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('R47: angle-bisector is an actual dependency-driven ray defined by three anchors',()=>{
 const d=newDoc();const a=addPoint(d,[1,0],'A'),b=addPoint(d,[0,0],'B'),c=addPoint(d,[0,1],'C');
 const bisector=command(d,'AngleBisector(A,B,C)');
 assert.equal(bisector.type,'angleBisector');assert.deepEqual(bisector.refs,[a.id,b.id,c.id]);
 let r=createResolver(d).line(bisector);assert.equal(r.domain,'ray');assert.deepEqual(r.a,[0,0]);approx(r.d[0],Math.SQRT1_2);approx(r.d[1],Math.SQRT1_2);
 a.xy=[3,0];b.xy=[2,0];c.xy=[2,5];r=createResolver(d).line(bisector);
 assert.deepEqual(r.a,[2,0]);approx(r.d[0],Math.SQRT1_2);approx(r.d[1],Math.SQRT1_2);
 assert.deepEqual(validateDoc(clone(d)).objects.at(-1).refs,bisector.refs);
 assert.throws(()=>command(d,'AngleBisector(B,B,C)'),/angle/i);
 const rejected=JSON.stringify(d);assert.throws(()=>command(d,'AngleBisector(A,B,missing)'),/unknown point/i);assert.equal(JSON.stringify(d),rejected);
 assert.equal(remove(d,b.id),2);assert.equal(d.objects.some(o=>o.id===bisector.id),false);
});
test('R47: visible panel reorder changes stable draw order without rewriting IDs/references',()=>{
 const d=newDoc();const p=[addPoint(d,[0,0],'A'),addPoint(d,[1,0],'B'),addPoint(d,[0,1],'C')];
 const seg=command(d,'Segment(A,B)');const before=clone(d.objects);
 assert.equal(reorderVisible(d.objects,p[0].id,seg.id,true),true);
 assert.equal(d.objects.at(-1).id,p[0].id);
 assert.equal(shiftVisible(d.objects,p[0].id,false),true);
 assert.equal(d.objects.at(-2).id,p[0].id);
 assert.equal(reorderVisible(d.objects,'absent',seg.id),false);
 assert.equal(reorderVisible(d.objects,seg.id,seg.id),false);
 assert.deepEqual(new Set(d.objects.map(o=>o.id)),new Set(before.map(o=>o.id)));
 assert.deepEqual(command(d,'Angle(A,B,C)').refs,[p[0].id,p[1].id,p[2].id]);
 assert.doesNotThrow(()=>validateDoc(clone(d)));
 const scene=newScene3D();for(const f of ['x','y','x+y'])add3DPlot(scene,'surface3d',[f]);
 const ids=scene.plots.map(o=>o.id);assert.equal(reorderVisible(scene.plots,ids[0],ids[2],true),true);
 assert.deepEqual(scene.plots.map(o=>o.id),[ids[1],ids[2],ids[0]]);
 assert.equal(shiftVisible(scene.plots,ids[0],false),true);
 assert.deepEqual(scene.plots.map(o=>o.id),[ids[1],ids[0],ids[2]]);
});
test('R47: higher mesh settings increase implicit resolution; no backwards collapse at max detail',()=>{
 assert.ok(implicitGridCells(96)>implicitGridCells(80)&&implicitGridCells(80)>implicitGridCells(44));
 const s=newScene3D();add3DPlot(s,'implicit3d',['cos(x+y+z)=cos(x)+cos(y)+cos(z)']);
 const counts=[];
 for(const detail of [22,44,65,80,96]){
  s.options.detail=detail;
  const r=project3DScene(s,700,500);counts.push(r.faces.length);
  assert.ok(!r.limited,`Unexpected incomplete mesh at detail ${detail}`);
  assert.ok(r.evaluations<=MAX_3D_EVALUATIONS&&r.faces.length<=MAX_3D_FACES);
 }
 assert.ok(counts.every((n,i)=>i===0||n>counts[i-1]),`Non-monotonic implicit detail: ${counts}`);
 const mixed=newScene3D();mixed.options.detail=96;
 for(let i=0;i<3;i++)add3DPlot(mixed,'implicit3d',['cos(x+y+z)=cos(x)+cos(y)+cos(z)']);
 const full=project3DScene(mixed,700,500);
 assert.equal(full.limited,false);assert.equal(full.faces.length>90000,true);
 assert.equal(full.faces.length<=MAX_3D_FACES,true);assert.equal(full.evaluations<=MAX_3D_EVALUATIONS,true);
});
