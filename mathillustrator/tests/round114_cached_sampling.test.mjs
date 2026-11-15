import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D, add3DPlot, project3DScene, create3DProjectionTask, meshCacheStats} from '../src/plot3d.mjs';

const makeScene=()=>{
 const scene=newScene3D();
 add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=4']);
 add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);
 scene.options.detail=46;
 return scene;
};

test('Round114 cached complete meshes and pilots require zero fresh evaluations',()=>{
 const s=makeScene();
 const first=project3DScene(s,720,530);
 assert.ok(first.evaluations>2000&&first.faces.length>1000&&!first.limited);
 const before=JSON.stringify(s),count=first.faces.length;
 const repeated=project3DScene(s,720,530);
 assert.equal(repeated.evaluations,0,'Cached meshes and implicit pilot must not be charged again');
 assert.equal(repeated.faces.length,count);
 assert.equal(repeated.limited,false);
 s.options.yaw=134;s.options.pitch=-32;
 const orbited=project3DScene(s,720,530);
 assert.equal(orbited.evaluations,0,'Camera movement must reproject rather than resample');
 assert.equal(orbited.faces.length,count);
 assert.equal(orbited.limited,false);
 s.options.yaw=-38;s.options.pitch=26;
 assert.equal(JSON.stringify(s),before,'Rendering must not alter persisted scene state');
 assert.ok(meshCacheStats().estimatedBytes<=meshCacheStats().limitBytes);
});

test('Round114 changing one expression resamples only that plot; cancelled jobs cannot publish',()=>{
 const s=makeScene();project3DScene(s,720,530);
 s.plots[1].a='cos(x)*sin(y)';
 const partial=project3DScene(s,720,530);
 assert.ok(partial.evaluations>0&&partial.evaluations<3000,`Unexpected resampling: ${partial.evaluations}`);
 assert.ok(partial.faces.length>1000&&!partial.limited);
 assert.equal(project3DScene(s,720,530).evaluations,0);
 const task=create3DProjectionTask(s,720,530);task.step(0);task.cancel();
 assert.deepEqual(task.step(),{done:true,cancelled:true,result:null});
});
