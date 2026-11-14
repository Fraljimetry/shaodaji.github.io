import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,validateDoc} from '../src/model.mjs';
import {newScene3D,add3DPlot,enforce3DVisibility,MAX_VISIBLE_3D_PLOTS,MAX_3D_FACES,MAX_3D_EVALUATIONS,meshCacheStats,sample3DPlot,project3DScene,create3DProjectionTask,validate3D} from '../src/plot3d.mjs';

const stored=scene=>JSON.parse(JSON.stringify(scene));
const finiteProjection=frame=>frame.faces.every(f=>f.points.every(p=>p.every(Number.isFinite)))&&frame.cube.every(l=>l.every(p=>p.every(Number.isFinite)));

test('Round42: at most three visible plots; preserve all hidden objects and order across undo/JSON',()=>{
 const scene=newScene3D();
 const ids=[];for(let i=0;i<6;i++)ids.push(add3DPlot(scene,'surface3d',[`sin(x+${i})*cos(y)`]).id);
 assert.equal(scene.plots.length,6);assert.equal(scene.plots.filter(p=>!p.hidden).length,MAX_VISIBLE_3D_PLOTS);
 assert.deepEqual(scene.plots.filter(p=>!p.hidden).map(p=>p.id),ids.slice(-3));
 scene.plots[0].hidden=false;enforce3DVisibility(scene,ids[0]);
 assert.deepEqual(scene.plots.filter(p=>!p.hidden).map(p=>p.id),[ids[0],ids[4],ids[5]]);
 const doc=newDoc();doc.settings.plot3dEnabled=true;doc.scene3d=scene;
 assert.doesNotThrow(()=>validateDoc(JSON.parse(JSON.stringify(doc))));
 assert.equal(validate3D(stored(scene)).plots.length,6);
 const snapshot=stored(scene);snapshot.plots.forEach(p=>p.hidden=false);
 const historical=project3DScene(snapshot,900,700);
 assert.equal(historical.limited,true,'Historical >3 visible is not silently exported as a full scene');
 assert.ok(historical.faces.length>0&&historical.faces.length<=MAX_3D_FACES);
 enforce3DVisibility(snapshot);assert.equal(snapshot.plots.filter(p=>!p.hidden).length,3);
 assert.equal(project3DScene(snapshot,900,700).limited,false);
});

test('Round42: camera union bounds avoids exploding projected polygons with dissimilar 3D plots',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);
 const implicit=add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=5']);
 const domain=add3DPlot(scene,'domain3d',['z^2+1']);
 domain.colorMode='contours';scene.options.detail=66;
 const frame=project3DScene(scene,960,710);
 assert.equal(frame.limited,false);assert.ok(frame.faces.length>8000);
 assert.ok(frame.faces.some(f=>f.domainColoring)&&frame.faces.some(f=>!f.domainColoring));
 assert.ok(finiteProjection(frame));
 const coords=frame.faces.flatMap(f=>f.points.flatMap(p=>p.slice(0,2)));
 assert.ok(coords.reduce((m,v)=>Math.max(m,Math.abs(v)),0)<3500,'Camera must not generate sky-high polygons on a mixed domain/surface scene');
 assert.ok(frame.evaluations<=MAX_3D_EVALUATIONS);
 assert.equal(frame.primitives.length,frame.faces.length+frame.lines.length);
 for(const yaw of [-170,-60,30,160]){
  scene.options.yaw=yaw;const revised=project3DScene(scene,960,710);
  assert.ok(finiteProjection(revised)&&revised.faces.length>8000&&!revised.limited);
 }
 scene.plots.reverse();const reversed=project3DScene(scene,960,710);
 assert.equal(reversed.faces.length,frame.faces.length);
 assert.ok(finiteProjection(reversed));
 assert.equal(implicit.hidden,false);
});

test('Round42: 96-detail domain coloring is persisted and exceeds old 44-detail coverage',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'domain3d',['z^2+1']);
 scene.options.detail=96;plot.colorMode='contours';
 validate3D(scene);
 const detailed=sample3DPlot(plot,96),old=sample3DPlot(plot,44);
 assert.ok(detailed.faces.length>old.faces.length*3);
 assert.equal(detailed.limited,false);assert.ok(detailed.faces.length>10000);
 assert.ok(detailed.faces.every(f=>/^#[a-f\d]{6}$/i.test(f.color)));
 const frame=project3DScene(scene,1024,768);
 assert.equal(frame.limited,false);assert.ok(frame.faces.length>10000);
 assert.ok(meshCacheStats().estimatedBytes<=meshCacheStats().limitBytes);
 const doc=newDoc();doc.settings.plot3dEnabled=true;doc.scene3d=scene;assert.doesNotThrow(()=>validateDoc(doc));
 const schema=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 assert.equal(schema.$defs.scene3d.properties.options.properties.detail.maximum,96);
 scene.options.detail=97;assert.throws(()=>validate3D(scene),/Invalid 3D camera/);
});

test('Round42: cancellation, singularities, and adaptive fair allocation remain bounded',()=>{
 const scene=newScene3D();const a=add3DPlot(scene,'implicit3d',['cos(x+y+z)=cos(x)+cos(y)+cos(z)']);
 const b=add3DPlot(scene,'domain3d',['z^2+1']);
 add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);scene.options.detail=96;
 const task=create3DProjectionTask(scene,880,620);
 assert.equal(task.step(0).done,false);task.cancel();assert.equal(task.step(3).result,null);
 const full=project3DScene(scene,880,620);
 assert.ok(full.faces.length>100&&full.faces.length<=MAX_3D_FACES);
 assert.ok(full.evaluations<=MAX_3D_EVALUATIONS);
 assert.ok(full.faces.some(f=>f.domainColoring)&&full.faces.some(f=>!f.domainColoring));
 assert.ok(finiteProjection(full));
 a.hidden=true;b.a='1/(z-z)';const singular=project3DScene(scene,880,620);
 assert.ok(singular.faces.length>100&&!singular.limited);
 assert.ok(meshCacheStats().estimatedBytes<=128*1024*1024);
});
