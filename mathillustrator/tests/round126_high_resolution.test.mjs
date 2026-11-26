import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,validateDoc} from '../src/model.mjs';
import {newScene3D,add3DPlot,validate3D,implicitGridCells,project3DScene,create3DProjectionTask,meshCacheStats,MAX_3D_EVALUATIONS,MAX_3D_FACES,MAX_3D_MULTI_FACES} from '../src/plot3d.mjs';
const build=(kind,expr,detail)=>{const scene=newScene3D();add3DPlot(scene,kind,[expr]);scene.options.detail=detail;return scene;};
test('Mesh detail accepts 96 and rejects higher or malformed values',()=>{
 const scene=build('surface3d','sin(x)*cos(y)',96);
 assert.equal(validate3D(scene),scene);
 for(const detail of [97,128,129,256,Infinity,8.2]){scene.options.detail=detail;assert.throws(()=>validate3D(scene));}
 assert.ok(implicitGridCells(96)>implicitGridCells(64));
});
test('Round126 higher-detail structured mesh yields more complete triangles without silently truncating',()=>{
 const a=project3DScene(build('surface3d','sin(x)*cos(y)',64),760,540);
 const b=project3DScene(build('surface3d','sin(x)*cos(y)',96),760,540);
 assert.ok(!a.limited&&!b.limited);
 assert.equal(a.faces.length,2*64**2);assert.equal(b.faces.length,2*96**2);
 assert.ok(b.faces.length>a.faces.length*1.7);
 assert.ok(b.evaluations<=MAX_3D_EVALUATIONS && b.faces.length<=MAX_3D_FACES);
});
test('Round126 high implicit resolution preserves a complete zero-set and cache reuse',()=>{
 const a=project3DScene(build('implicit3d','x^2+y^2+z^2=4',64),760,540);
 const scene=build('implicit3d','x^2+y^2+z^2=4',96);
 const b=project3DScene(scene,760,540);
 assert.ok(!a.limited&&!b.limited,'valid high resolution must not degrade to incomplete output');
 assert.ok(b.faces.length>a.faces.length*1.4,`64=${a.faces.length} 96=${b.faces.length}`);
 assert.ok(b.evaluations<=MAX_3D_EVALUATIONS && b.faces.length<=MAX_3D_FACES);
 scene.options.yaw=47;
 const rotated=project3DScene(scene,760,540);
 assert.equal(rotated.evaluations,0);
 assert.equal(rotated.faces.length,b.faces.length);
 assert.ok(meshCacheStats().estimatedBytes<=meshCacheStats().limitBytes);
});
test('96-detail cooperative tasks remain cancellable and budgeted',()=>{
 const scene=build('implicit3d','x^2+y^2+z^2=4',96);
 const task=create3DProjectionTask(scene,760,540);
 for(let i=0;i<12;i++)assert.equal(task.step(0).done,false);
 task.cancel();assert.deepEqual(task.step(0),{done:true,cancelled:true,result:null});
 const multi=newScene3D();add3DPlot(multi,'surface3d',['sin(x)']);add3DPlot(multi,'surface3d',['cos(y)']);multi.options.detail=96;
 const result=project3DScene(multi,760,540);
 assert.ok(!result.limited);
 assert.equal(result.faces.length,4*96*96);
 assert.ok(result.faces.length<=MAX_3D_MULTI_FACES);
});

test('mesh detail bound is 96 including rendering and persisted document migration',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);
 scene.options.detail=96;assert.equal(validate3D(scene),scene);
 assert.equal(project3DScene(scene,760,540).faces.length,2*96**2);
 scene.options.detail=97;assert.throws(()=>validate3D(scene));
 const legacy=newDoc();legacy.settings.plot3dEnabled=true;legacy.scene3d=scene;
 legacy.scene3d.options.detail=128;
 const migrated=validateDoc(legacy);
 assert.equal(migrated.scene3d.options.detail,96);
 assert.equal(legacy.scene3d.options.detail,128,'migration must not mutate caller input');
 legacy.scene3d.options.detail=129;assert.throws(()=>validateDoc(legacy));
});
