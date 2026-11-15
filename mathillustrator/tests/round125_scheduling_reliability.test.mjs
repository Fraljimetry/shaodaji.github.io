import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,create3DProjectionTask,project3DScene,meshCacheStats,sample3DPlotSteps,sample3DPlot} from '../src/plot3d.mjs';

const make=(kind,expr,detail=48)=>{
 const scene=newScene3D();add3DPlot(scene,kind,expr);scene.options.detail=detail;return scene;
};
test('Round125 deterministic incremental progress, bounded units and idempotent cancellation',()=>{
 const scene=make('implicit3d',['x^2+y^2+z^2=4'],72);
 const task=create3DProjectionTask(scene,800,600);
 let last=0;
 for(let n=0;n<8;n++){
  const status=task.step(0);
  assert.equal(status.done,false);
  assert.equal(task.units,last+1);
  last=task.units;
 }
 task.cancel();task.cancel();
 assert.deepEqual(task.step(20),{done:true,cancelled:true,result:null});
 assert.equal(task.units,last);
});
test('Round125 nonfinite deadline defaults safely, task completes with exact synchronous parity',()=>{
 const scene=make('surface3d',['x*y'],24),reference=project3DScene(scene,720,540);
 const task=create3DProjectionTask(scene,720,540);
 let status;
 for(let n=0;n<10000;n++){
  status=task.step(n%2?NaN:Infinity);
  if(status.done)break;
 }
 assert.ok(status.done);
 assert.deepEqual(status.result.faces,reference.faces);
 assert.deepEqual(status.result.lines,reference.lines);
 assert.deepEqual(task.step(),status);
 task.cancel();assert.deepEqual(task.step(),status);
});
test('Round125 implicit interruption does not poison complete scene cache',()=>{
 const scene=make('implicit3d',['x^2+y^2+z^2=4'],48),task=create3DProjectionTask(scene,720,540);
 for(let i=0;i<45;i++)task.step(0);
 task.cancel();
 const projected=project3DScene(scene,720,540);
 assert.ok(projected.faces.length>0);
 const again=project3DScene(scene,720,540);
 assert.equal(again.evaluations,0);
 assert.deepEqual(projected.faces,again.faces);
 assert.ok(meshCacheStats().estimatedBytes<=meshCacheStats().limitBytes);
});
test('Round125 mesh streaming parity with cancellation at intermediate voxel rows',()=>{
 const scene=make('implicit3d',['x^2+y^2+z^2=4'],56),plot=scene.plots[0];
 const it=sample3DPlotSteps(plot,56);
 for(let i=0;i<150;i++)assert.equal(it.next().done,false);
 assert.equal(it.return().done,true);
 const mesh=sample3DPlot(plot,32);
 assert.ok(mesh.faces.length>0);
 assert.equal(mesh.limited,false);
});
test('Round125 multi-plot camera changes do not resample world meshes',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x)+cos(y)']);add3DPlot(scene,'parametric3d',['cos(u)*sin(v)','sin(u)*sin(v)','cos(v)']);
 scene.options.detail=36;
 const first=project3DScene(scene,780,560);assert.ok(first.faces.length>0);
 scene.options.yaw=80;scene.options.pitch=-20;
 const second=project3DScene(scene,780,560);
 assert.equal(second.evaluations,0);
 assert.equal(second.faces.length,first.faces.length);
 assert.ok(second.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))));
});
