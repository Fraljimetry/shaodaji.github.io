import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,project3DScene,create3DProjectionTask} from '../src/plot3d.mjs';
const bounds=(lo,hi)=>({xMin:lo,xMax:hi,yMin:lo,yMax:hi,zMin:lo,zMax:hi});
function scene(kind,inputs){
 const s=newScene3D();Object.assign(s.options,{fixRegion:true,fixedBounds:bounds(-1,1),yaw:90,pitch:0,detail:8});
 add3DPlot(s,kind,inputs,bounds(-7,7));return s;
}
function check(r){
 assert.ok(r.primitives.length>0);
 for(const p of r.primitives){
  const points=p.kind==='face'?p.value.points:[p.value.start,p.value.end];
  assert.ok(Number.isFinite(p.depth));
  for(const v of points){assert.ok(v.every(Number.isFinite));assert.ok(v[2]<=3+1e-12);}
 }
}
for(const [kind,inputs] of [['vector3d',['1','0','0']],['surface3d',['0']]]){
 test(`R334 fixed perspective clips ${kind} at the near plane`,()=>{
  const s=scene(kind,inputs),before=JSON.stringify(s),r=project3DScene(s,800,600);
  check(r);assert.ok(r.primitives.some(p=>(p.kind==='face'?p.value.points:[p.value.start,p.value.end]).some(v=>Math.abs(v[2]-3)<1e-12)));
  const task=create3DProjectionTask(s,800,600);while(!task.done)task.step(10);
  assert.deepEqual(task.result.primitives,r.primitives);assert.equal(JSON.stringify(s),before);
  s.options.projection='orthographic';const ortho=project3DScene(s,800,600);
  assert.ok(ortho.primitives.some(p=>p.depth>3));assert.ok(ortho.primitives.length>0);
 });
}
