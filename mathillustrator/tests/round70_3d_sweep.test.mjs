import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,sample3DPlot,project3DScene,create3DProjectionTask,MAX_3D_EVALUATIONS,validate3D} from '../src/plot3d.mjs';
const sceneWith=(kind,expression)=>{const scene=newScene3D();const plot=add3DPlot(scene,kind,[expression]);return {scene,plot};};
test('Round70 3D implicit poles and discontinuities never become false surfaces',()=>{
 for(const detail of [23,45]){
  const {plot}=sceneWith('implicit3d','1/x');
  const mesh=sample3DPlot(plot,detail);
  assert.equal(mesh.faces.length,0,`1/x at detail ${detail} produced a fictitious plane`);
 }
 for(const expr of ['1/(x-0.13)','1/(x*x-1)']){
  const {plot}=sceneWith('implicit3d',expr);
  assert.equal(sample3DPlot(plot,23).faces.length,0,`${expr} must have no zero set`);
 }
});
test('Round70 true 3D zero sets and mixed surfaces remain complete and budgeted',()=>{
 for(const expr of ['x','x-0.13','x^2+y^2+z^2=4']){
  const {plot}=sceneWith('implicit3d',expr);
  assert.ok(sample3DPlot(plot,23).faces.length>300,expr);
 }
 const {scene}=sceneWith('implicit3d','x^2+y^2+z^2=4');
 add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);
 scene.options.detail=56;validate3D(scene);
 const image=project3DScene(scene,640,500);
 assert.ok(image.faces.length>300);
 assert.ok(image.evaluations<=MAX_3D_EVALUATIONS);
 assert.equal(image.primitives.length,image.faces.length+image.lines.length);
 assert.ok(image.faces.every(face=>Number.isFinite(face.depth)&&face.points.every(p=>p.every(Number.isFinite))));
 const task=create3DProjectionTask(structuredClone(scene),640,500);
 task.step(0);task.cancel();assert.equal(task.result,null);assert.equal(task.step().cancelled,true);
});
test('Round70 failed 3D additions do not consume IDs, append plots, or hide existing surfaces',()=>{
 const s=newScene3D();
 for(let i=0;i<3;i++)add3DPlot(s,'surface3d',[`x+${i}`]);
 const before=structuredClone(s);
 for(const [kind,inputs,bounds] of [
  ['surface3d',['1/('],undefined],
  ['implicit3d',['x^2+y^2+z^2='],undefined],
  ['surface3d',['x'],{...s.plots[0].bounds,zMin:3,zMax:-3}],
  ['bogus3d',['x'],undefined],
 ]){
  assert.throws(()=>add3DPlot(s,kind,inputs,bounds));
  assert.deepEqual(s,before,`Failed ${kind} addition modified the scene`);
 }
});
