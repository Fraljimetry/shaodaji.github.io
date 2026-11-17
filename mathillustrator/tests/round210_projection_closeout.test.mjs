import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,project3DScene,create3DProjectionTask} from '../src/plot3d.mjs';
// Goldens captured from the unchanged Round 209 implementation.
const cases=[
 ['mixed', ['da4bc318618f70ff188de919cf5ff093ad618011d88639f1744854572aa4273f','6645cb46fbf3a9d3eea8057f8dc5b703c150f8bcd32420408d38dacf6d330137','363f2d82967d388446e3679486bca0f9ee9c51026aa3f6ef828bdaade977510b']],
 ['twosurfaces',['74250587712c7de1d73f8b33892c369cdb5435fdff10d4a8758faad546cdc766','858bca9661c24e77c9bf1abc1952dbba08a99ab309e0e5b98460c0fb2f19666d','d2d90191b2de1c109692488e62380ba04991ddf9f022703c22710cfd82df7350']],
 ['vectors',['e9ffc0dfcabce301ba31d1ec6ae75e333368859126228702186ef683b94f7949','0457b86462156c6ab4a1de02cbc7011158b6392dd2e0b69506f5ab60f0d8fe57','1555ef0b67a207b38c0d9d780f872a5149f51caf74eb575e499a3b5589dc02b2']]
];
function sceneFor(name){
 const scene=newScene3D();
 if(name==='vectors'){const v=add3DPlot(scene,'vector3d',['x','y','z']);v.density=12;v.colorRange=true;}
 else {
  add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);
  if(name==='mixed'){const v=add3DPlot(scene,'vector3d',['x','y','z']);v.density=12;v.colorRange=true;}
  else add3DPlot(scene,'surface3d',['cos(x*y/2)']);
 }
 scene.options.detail=70;return scene;
}
const hash=r=>createHash('sha256').update(JSON.stringify({faces:r.faces,lines:r.lines,primitives:r.primitives,cube:r.cube})).digest('hex');
for(const [name,goldens] of cases){
 test(`R210 Round209 exact depth-order and shading fidelity: ${name}`,()=>{
  const scene=sceneFor(name);
  for(const [i,yaw] of [-38,25,113].entries()){
   scene.options.yaw=yaw;const r=project3DScene(scene,1000,700);
   assert.equal(hash(r),goldens[i]);
   assert.equal(r.primitives.length,r.faces.length+r.lines.length);
   if(i)assert.equal(r.evaluations,0,'Camera-only edit must not resample cached meshes');
   const task=create3DProjectionTask(scene,1000,700);let state;
   for(let k=0;k<200000;k++){state=task.step(2);if(state.done)break;}
   assert.ok(state.done,'Cooperative projection must finish');assert.equal(hash(state.result),goldens[i]);
  }
 });
}
test('R210 repeated lighting toggles preserve exact settled output',()=>{
 const scene=sceneFor('mixed');const baseline=hash(project3DScene(scene,1000,700));
 for(let i=0;i<20;i++){
  scene.options.lighting=false;const unlit=project3DScene(scene,1000,700);
  assert.ok(unlit.faces.every(f=>f.shade===1));
  scene.options.lighting=true;
  assert.equal(hash(project3DScene(scene,1000,700)),baseline);
 }
});
