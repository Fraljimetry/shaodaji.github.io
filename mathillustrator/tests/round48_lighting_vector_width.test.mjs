import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,validate3D,project3DScene,meshKey} from '../src/plot3d.mjs';
import {newDoc,validateDoc} from '../src/model.mjs';

test('R48 stable two-sided lighting adds substantial world-space contrast in multicolor mode',()=>{
 const scene=newScene3D();const plot=add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);scene.options.detail=30;plot.colorRange=true;
 const lit=project3DScene(scene,720,530).faces;
 assert.ok(lit.length>400);
 assert.ok(Math.max(...lit.map(f=>f.shade))-Math.min(...lit.map(f=>f.shade))>.35,'strong directional contrast');
 assert.ok(lit.every(f=>f.rangeColor&&Number.isFinite(f.shade)&&f.shade>=.26&&f.shade<=1));
 scene.options.yaw=155;scene.options.pitch=-44;
 const turned=project3DScene(scene,720,530).faces;
 assert.deepEqual(lit.map(f=>[f.color,f.shade]).sort(),turned.map(f=>[f.color,f.shade]).sort(),'orbit may not change world-space light or color');
 scene.options.lighting=false;
 const unlit=project3DScene(scene,720,530).faces;
 assert.ok(unlit.every(f=>f.shade===1));
 scene.options.lighting=true;assert.equal(project3DScene(scene,720,530).faces.length,lit.length);
});
test('R48 3D vector width defaults, serializes, validates, and never invalidates the cached vector mesh',()=>{
 const scene=newScene3D();const p=add3DPlot(scene,'vector3d',['x','y','z']);
 assert.equal(p.lineWidth,1.5);
 const key=meshKey(p,20);
 p.lineWidth=5.5;validate3D(scene);
 assert.equal(meshKey(p,20),key);
 const lines=project3DScene(scene,700,500).lines;
 assert.ok(lines.length>20);assert.ok(lines.every(line=>line.width===5.5));
 const doc=newDoc();doc.scene3d=scene;doc.settings.plot3dEnabled=true;
 const roundtrip=JSON.parse(JSON.stringify(doc));validateDoc(roundtrip);
 assert.equal(roundtrip.scene3d.plots[0].lineWidth,5.5);
 delete p.lineWidth;validate3D(scene);
 assert.ok(project3DScene(scene,700,500).lines.every(line=>line.width===1.5),'old JSON default');
 for(const val of [0,-1,12.01,NaN,Infinity,'2']){p.lineWidth=val;assert.throws(()=>validate3D(scene),String(val));}
});
