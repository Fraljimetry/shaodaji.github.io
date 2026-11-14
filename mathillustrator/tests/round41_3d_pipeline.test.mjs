import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,validateDoc} from '../src/model.mjs';
import {newScene3D,add3DPlot,sample3DPlot,project3DScene,create3DProjectionTask,MAX_3D_EVALUATIONS,MAX_3D_FACES,MAX_3D_LINES} from '../src/plot3d.mjs';

const edgeKey=p=>p.map(x=>x.toFixed(6)).join(',');
function countLooseEdges(faces){
 const tally=new Map();
 for(const tri of faces)for(let i=0;i<3;i++){
  const edge=[edgeKey(tri[i]),edgeKey(tri[(i+1)%3])].sort().join(' | ');
  tally.set(edge,(tally.get(edge)||0)+1);
 }
 return [...tally.values()].filter(n=>n!==2).length;
}
test('Round41 implicit meshing: closed sphere has no broken edges at coarse and maximum detail',()=>{
 const scene=newScene3D();const sphere=add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=4']);
 for(const detail of [16,22,44]){
  const mesh=sample3DPlot(sphere,detail);
  assert.ok(mesh.faces.length>500,'Nonempty high-order surface');
  assert.equal(countLooseEdges(mesh.faces),0,`Unexpected crack or T-junction at detail ${detail}`);
  assert.ok(mesh.faces.every(t=>t.length===3&&t.every(v=>v.every(Number.isFinite))));
 }
});
test('Round41 partial cell clipping retains finite surface slices without crossing the plot region',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'surface3d',['x+y']);
 plot.bounds.zMin=-.25;plot.bounds.zMax=.25;
 const mesh=sample3DPlot(plot,20);
 assert.ok(mesh.faces.length>=10,'Partially clipped cells should not disappear as entire quads');
 assert.ok(mesh.faces.every(f=>f.every(pt=>pt[2]>=-.25000001&&pt[2]<=.25000001)));
 assert.ok(mesh.faces.every(f=>f.every(pt=>pt.every(Number.isFinite))));
 const pole=add3DPlot(scene,'surface3d',['1/(x-x)']);assert.equal(sample3DPlot(pole,24).faces.length,0);
});
test('Round41 per-scene work cap limits dense implicit projects and refuses incomplete exports',()=>{
 const scene=newScene3D();scene.options.detail=44;
 for(let i=0;i<80;i++)add3DPlot(scene,'implicit3d',[`x^2+y^2+z^2=${1+(i%15)/4}`]);
 // Pre-R42 imported project with 80 visible entries must render safely, then normalize.
 for(const p of scene.plots)p.hidden=false;
 const render=project3DScene(scene,900,700);
 assert.equal(render.limited,true);
 assert.ok(render.evaluations<=MAX_3D_EVALUATIONS);
 assert.ok(render.faces.length<=MAX_3D_FACES&&render.lines.length<=MAX_3D_LINES);
 assert.ok(render.evaluations>0);
 // Existing JSON scene format is unchanged, so even incomplete *visual* views
 // remain saveable and reloadable; SVG/bitmap export is rejected by app.mjs.
 const document=newDoc();document.settings.plot3dEnabled=true;document.scene3d=scene;
 assert.doesNotThrow(()=>validateDoc(JSON.parse(JSON.stringify(document))));
});
test('Round41 depth order interleaves vectors and surfaces; lighting and camera remain finite',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);add3DPlot(scene,'vector3d',['x','y','z']);
 const result=project3DScene(scene,900,670);
 assert.ok(result.faces.length>100&&result.lines.length>50);
 assert.equal(result.primitives.length,result.faces.length+result.lines.length);
 assert.ok(result.primitives.every((p,i)=>i===0||result.primitives[i-1].depth<=p.depth));
 assert.ok(result.faces.every(f=>Number.isFinite(f.shade)&&f.shade>=0&&f.shade<=1));
 assert.ok(result.primitives.some(p=>p.kind==='line'&&result.primitives.findIndex(q=>q===p)<result.primitives.length-1));
 scene.options.projection='orthographic';scene.options.yaw=60;
 const changed=project3DScene(scene,900,670);
 assert.notDeepEqual(changed.faces[0].points,result.faces[0].points);
 assert.ok(changed.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))));
});
test('Round41 cooperative task cancels without partial success and matches synchronous output',()=>{
 const scene=newScene3D(),sphere=add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=2']);scene.options.detail=44;
 const task=create3DProjectionTask(scene,790,590);
 assert.equal(task.step(0).done,false,'A long job should have a yielding checkpoint');
 task.cancel();assert.equal(task.cancelled,true);
 const canceled=task.step(7);assert.equal(canceled.cancelled,true);assert.equal(canceled.result,null);
 const retry=create3DProjectionTask(scene,790,590);let result=null,steps=0;
 while(!retry.done){const state=retry.step(1);result=state.result;steps++;assert.ok(steps<10000,'Cooperative task should converge');}
 assert.ok(steps>1);
 const immediate=project3DScene(scene,790,590);
 assert.deepEqual(result.faces,immediate.faces);
 assert.deepEqual(result.lines,immediate.lines);
 assert.deepEqual(result.primitives,immediate.primitives);
 assert.equal(result.limited,false);
 // Hidden plots must not consume work or count toward truncation.
 sphere.hidden=true;const hidden=project3DScene(scene,790,590);
 assert.equal(hidden.evaluations,0);assert.equal(hidden.faces.length,0);
});
