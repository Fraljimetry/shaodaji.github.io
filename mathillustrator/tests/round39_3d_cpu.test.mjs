import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newDoc,append,validateDoc,clone} from '../src/model.mjs';
import {newScene3D,defaultBounds3D,add3DPlot,parse3D,validate3D,sample3DPlot,project3DScene} from '../src/plot3d.mjs';
import {parseParametric,parseComplexExpression,sampleDomainColors} from '../src/plot_modes.mjs';

test('Round39 3D: four plotting families, bounded finite points, reference cube and projection',()=>{
 const scene=newScene3D();const a=add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);const b=add3DPlot(scene,'parametric3d',['2cos(u)*sin(v)','2sin(u)*sin(v)','2cos(v)']);
 const c=add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=4']);const d=add3DPlot(scene,'vector3d',['-y','x','z']);
 assert.equal(parse3D(a)(0,0)[2],0);assert.ok(Math.abs(parse3D(b)(0,Math.PI/2)[0]-2)<1e-8);
 assert.ok(sample3DPlot(a,20).faces.length>100);assert.ok(sample3DPlot(b,20).faces.length>100);
 assert.ok(sample3DPlot(c,18).faces.length>200);assert.ok(sample3DPlot(d,20).lines.length>=80);
 const persp=project3DScene(scene,1000,680);assert.equal(persp.cube.length,12);
 assert.ok(persp.faces.length>300&&persp.lines.length>80);assert.ok(persp.faces.every(f=>f.points.flat().every(Number.isFinite)));
 scene.options.projection='orthographic';const ortho=project3DScene(scene,1000,680);
 assert.notDeepEqual(persp.faces[0].points,ortho.faces[0].points);
 scene.options.cube=false;assert.equal(project3DScene(scene,1000,680).cube.length,0);
});
test('Round39 3D validation: injection blocked, invalid bounds rejected, local 2D projects preserved',()=>{
 const d=newDoc();const pt=append(d,{type:'point',xy:[2,Math.PI]});
 const f=add3DPlot(d.scene3d,'surface3d',['x^2-y^2']);d.settings.plot3dEnabled=true;
 const good=validateDoc(clone(d));assert.equal(good.objects[0].id,pt.id);assert.equal(good.scene3d.plots[0].id,f.id);
 const schema=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 assert.ok(schema.$defs.scene3d);assert.ok(schema.$defs.settings.properties.plot3dEnabled);
 const legacy=clone(d);delete legacy.scene3d;delete legacy.settings.plot3dEnabled;
 assert.equal(validateDoc(legacy).objects[0].id,pt.id);
 const badToggle=clone(legacy);badToggle.settings.plot3dEnabled=true;assert.throws(()=>validateDoc(badToggle));
 for(const patch of [{kind:'unknown'},{a:'window.alert(1)'},{bounds:{...f.bounds,xMax:-5}},{color:'#abc'},{opacity:20},{id:0}]){
  const bad=clone(d);Object.assign(bad.scene3d.plots[0],patch);assert.throws(()=>validateDoc(bad),JSON.stringify(patch));
 }
 assert.throws(()=>add3DPlot(newScene3D(),'surface3d',['process.exit()']));
 assert.throws(()=>add3DPlot(newScene3D(),'implicit3d',['x=y=z']));
 assert.throws(()=>add3DPlot(newScene3D(),'parametric3d',['u','v','t']));
 assert.throws(()=>add3DPlot(newScene3D(),'vector3d',['x','y','unknown']));
});
test('Round39 3D singularities and resource caps fail closed under dense scene',()=>{
 const s=newScene3D();const f=add3DPlot(s,'surface3d',['1/(x-x)']);assert.equal(sample3DPlot(f,44).faces.length,0);
 s.plots.length=0;s.nextId=1;
 for(let i=0;i<25;i++)add3DPlot(s,'surface3d',[`sin(x+${i/10})*cos(y)`]);
 // Simulate a pre-R42 legacy scene with more than three unhidden entries.
 for(const p of s.plots)p.hidden=false;
 s.options.detail=30;
 const result=project3DScene(s,1400,900);
 assert.equal(result.limited,true,'Global 3D geometry budget must prevent false-success heavy exports');
 assert.ok(result.faces.length<=66000,'Global face cap');
 assert.ok(result.evaluations<25*31*31,'Global scene stops sampling on limit');
 assert.ok(result.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))));
});
test('Round39 domain-coloring high resolution, legacy u=v and budget guard',()=>{
 const r={xMin:-3,xMax:3,yMin:-2,yMax:2};
 const f=parseComplexExpression('z^2+sin(z)+1');
 const high=sampleDomainColors(f,r,{resolution:768,maxEvaluations:800000});
 assert.equal(high.width,768);assert.ok(high.height>=500&&high.rgba.length>1e6&&!high.limited);
 assert.equal(sampleDomainColors(f,r,{resolution:1024,maxEvaluations:100}).limited,true);
 assert.deepEqual(parseParametric('u^2','v^2')(3),[9,9]);
});

test('Round39 all extended plotting budget choices agree between model and JSON Schema',()=>{
 const schema=JSON.parse(readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 const allowed=[20000,40000,80000,250000,500000,1000000];
 assert.deepEqual(schema.$defs.settings.properties.plotBudget.enum,allowed);
 for(const value of allowed){const doc=newDoc();doc.settings.plotBudget=value;assert.equal(validateDoc(doc).settings.plotBudget,value);}
 const invalid=newDoc();invalid.settings.plotBudget=999999;assert.throws(()=>validateDoc(invalid));
});
