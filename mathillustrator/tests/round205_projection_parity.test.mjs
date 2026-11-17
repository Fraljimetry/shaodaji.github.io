import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,project3DScene,create3DProjectionTask} from '../src/plot3d.mjs';
// Golden output captured before Round 205 from the cumulative Round 204 source.
// Full sorted projected geometry + camera guides, not just approximate counts.
const cases=[
 ['surface3d',['sin(x)*cos(y)'],90,['6e087b5c1fc246689cd3e0397b1df5681801c67c53790279c6f14bca17302237','d4653af04694c7b6485d2c496301b9566a503e26494bd652e83226a41fd670f9','f65b8a24198d1d75e19c322aa1081fc045136a1af8701483645546e097b35cd9']],
 ['parametric3d',['cos(u)*sin(v)','sin(u)*sin(v)','cos(v)'],44,['b51235991ecaa9a13191a4645f7ec30df0d95c1d135b676b84dfbb28bf44cd38','cc5307e85e039382e6979cc1b5649dfb22621533546949b9f9da21050b45a9b4','be2c9ede78416b1ba27c531ff493449dded0fd79b35764006bd1e45401e35dad']],
 ['implicit3d',['x^2+y^2+z^2=4'],48,['c5cb241ee66ea63cfbc70c40a09a1b3b9f09db565aa42a226189b80a421e3d20','80ef2025bce7e12f9afeb5920f2d3d7092631a33c968264e158628204c715499','876013086abd328e6dac7bc67d4e9866a8d61723fb72c748909567cca929dbe8']],
 ['domain3d',['z^2+1'],64,['524e12410f85984e42cb05a3d9c70610726a4066cb0e820bf36a75f818f8e73a','f2641a24b0e9a8fb9b455e186e35728629e4bc711c2582a4197c12a8ac28a82c','1979ae49ac0a8232f2b0324fd8f25693e1b1ba95b8826fc391d0c2ccf8461c39']],
 ['vector3d',['x','y','z'],32,['2a93b3593ececd7e2e402241a570aaca916680e29458360e8493d523c3f4d316','9262f5b3a5c0f2aae608c93256ed43650d60b9351f2741d5d066c5b708846e74','e0b8397c5d20f54501d28ae2b5ca55fbc872936aa5520ffb95a774a82373694d']]
];
for(const [kind,expr,detail,hashes] of cases){
 test(`R205 exact projection/lighting/render ordering: ${kind}`,()=>{
  const scene=newScene3D(),plot=add3DPlot(scene,kind,expr);
  if(kind==='domain3d'){plot.heightMode='argument';plot.colorMode='phase';}
  if(kind==='vector3d'){plot.density=10;plot.colorRange=true;}
  scene.options.detail=detail;
  for(const [i,yaw] of [-38,25,113].entries()){
   scene.options.yaw=yaw;
   const result=project3DScene(scene,1000,700);
   assert.ok(result.faces.length+result.lines.length>0);
   const hash=createHash('sha256').update(JSON.stringify({faces:result.faces,lines:result.lines,primitives:result.primitives,cube:result.cube})).digest('hex');
   assert.equal(hash,hashes[i],`Unexpected geometry/lighting change at yaw=${yaw}`);
   if(i>0)assert.equal(result.evaluations,0,'Camera orbit should not resample');
  }
 });
}
test('R205 short-lived tasks do not publish cancelled partial projection or mutate scene',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);scene.options.detail=128;
 const original=JSON.stringify(scene);
 for(let i=0;i<12;i++){scene.options.yaw=-120+i*18;const task=create3DProjectionTask(scene,1000,700);
  task.step(0);task.cancel();assert.equal(task.result,null);assert.equal(task.step().cancelled,true);}
 const task=create3DProjectionTask(scene,1000,700);let result;
 for(let i=0;i<100000;i++){const state=task.step(1);if(state.done){result=state.result;break;}}
 assert.equal(result.faces.length,32768);assert.equal(JSON.stringify(scene),original.replace('"yaw":-38',`"yaw":${scene.options.yaw}`));
});
