import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc, validateDoc} from '../src/model.mjs';
import {newScene3D, add3DPlot, parse3D, sample3DPlot, project3DScene,validate3D} from '../src/plot3d.mjs';

const schema=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
test('Round40 complex domain surfaces: modulus/argument, phase colors and finite mesh',()=>{
 const s=newScene3D(),p=add3DPlot(s,'domain3d',['z^2+1']);
 assert.equal(p.heightMode,'modulus');assert.equal(p.colorMode,'phase-modulus');
 assert.equal(p.bounds.zMin,0);assert.ok(p.bounds.zMax>=32,'default height should encompass typical polynomial peaks');
 assert.equal(parse3D(p)(1,0)[2],2);
 assert.ok(Math.abs(parse3D(p)(0,1)[2])<1e-10);
 const m=sample3DPlot(p,32);assert.ok(m.faces.length>250);assert.ok(m.faces.every(f=>f.color?.match(/^#[0-9a-f]{6}$/i)&&f.every(pt=>pt.every(Number.isFinite))));
 assert.ok(new Set(m.faces.map(f=>f.color)).size>5,'phase colors should vary');
 assert.ok(m.evaluations<=33**2);assert.equal(m.limited,false);
 const render=project3DScene(s,780,590);assert.ok(render.faces.length>100);assert.ok(render.faces.some(f=>f.domainColoring));
 const doc=newDoc();doc.settings.plot3dEnabled=true;doc.scene3d=s;validateDoc(doc);
 assert.ok(schema.$defs.scene3d.properties.plots.items.properties.heightMode);
 assert.ok(schema.$defs.scene3d.properties.plots.items.properties.colorMode);
});
test('Round40 argument height: phase branch cut avoids spurious vertical walls',()=>{
 const s=newScene3D(),p=add3DPlot(s,'domain3d',['z']);p.heightMode='argument';p.bounds.zMin=-3.5;p.bounds.zMax=3.5;
 const fn=parse3D(p);
 assert.ok(Math.abs(fn(0,1)[2]-Math.PI/2)<1e-12);
 assert.ok(Math.abs(fn(-1,-0.01)[2]+Math.PI)<0.02);
 const m=sample3DPlot(p,22);assert.ok(m.faces.length>150);
 assert.ok(m.faces.every(triangle=>Math.max(...triangle.map(v=>v[2]))-Math.min(...triangle.map(v=>v[2]))<=Math.PI));
 for(const mode of ['phase','contours','phase-modulus']){p.colorMode=mode;assert.ok(sample3DPlot(p,8).faces.length>0);}
});
test('Round40 invalid complex expressions and options fail closed; old 3D scenes remain valid',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['x+y']);validate3D(scene);
 assert.throws(()=>add3DPlot(scene,'domain3d',['Math.random()']));
 assert.equal(scene.plots.length,1,'invalid addition must not append to scene');
 const complex=add3DPlot(scene,'domain3d',['1/z']);
 complex.heightMode='none';assert.throws(()=>validate3D(scene));complex.heightMode='modulus';
 complex.colorMode='invalid';assert.throws(()=>validate3D(scene));complex.colorMode='phase';
 assert.doesNotThrow(()=>validate3D(scene));
 const rendered=sample3DPlot(complex,24);assert.ok(rendered.faces.length>=0);assert.ok(rendered.faces.length<=2*24*24);
});
test('Round40 dense complex surfaces have bounded projections and no failed-limit false success',()=>{
 const scene=newScene3D();for(let i=0;i<22;i++){const p=add3DPlot(scene,'domain3d',[i%2?'sin(z)':'z^2+1']);p.heightMode=i%3?'modulus':'argument';}
 scene.options.detail=28;
 const rendered=project3DScene(scene,850,660);
 assert.ok(rendered.faces.length<=12000);assert.ok(rendered.evaluations<=22*29**2);assert.ok(rendered.limited||rendered.faces.length<12000);
 assert.ok(rendered.faces.every(f=>f.points.every(pt=>pt.every(Number.isFinite))));
});
