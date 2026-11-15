import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newScene3D,add3DPlot,sample3DPlot,project3DScene,validate3D,parse3DRangeExpression,create3DProjectionTask} from '../src/plot3d.mjs';
import {parseCurveExpression,parseParametric,parseImplicit,parseVectorField,parseComplexExpression,sampleVectorField,sampleDomainColors} from '../src/plot_modes.mjs';
import {sampleExplicitPlot,plotPath} from '../src/plot.mjs';

const near=(a,b)=>Math.abs(a-b)<1e-9;
test('Round62: a single undefined 3D surface corner does not erase a valid triangle',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'surface3d',['sqrt(x+y+0.2)']);
 const mesh=sample3DPlot(plot,8);
 // In the [-1,0] x [0,1] cell only (-1,0) is outside the real domain.
 const corner=[[0,0],[0,1],[-1,1]];
 assert.ok(mesh.faces.some(tri=>corner.every(([x,y])=>tri.some(p=>near(p[0],x)&&near(p[1],y)))), 'Three finite corner samples must produce the one valid triangle');
 assert.ok(mesh.faces.every(tri=>tri.length===3&&tri.every(p=>p.every(Number.isFinite))));
 const pole=add3DPlot(scene,'surface3d',['1/(x-x)']);
 assert.equal(sample3DPlot(pole,8).faces.length,0,'Fully undefined surface stays empty');
});
test('Round62: numeric plotting parser safety across all five 2D and 3D modes',()=>{
 assert.equal(parseCurveExpression('sin(x)+2pi',['x'])({x:0}),2*Math.PI);
 const f=parseParametric('cos(t)','sin(t)','t');assert.ok(near(f(0)[0],1)&&near(f(Math.PI/2)[1],1));
 assert.ok(near(parseImplicit('x^2+y^2=1')(1,0),0));
 assert.deepEqual(parseVectorField('-y','x')(2,3),[-3,2]);
 assert.ok(parseComplexExpression('z^2+1')(0,1).every(value=>Math.abs(value)<1e-9));
 for(const bad of ['constructor(1)','x.__proto__','sqrt(1,2)'])assert.throws(()=>parseCurveExpression(bad,['x']));
 for(const bad of ['1/0','pi/0','x','alert(1)'])assert.throws(()=>parse3DRangeExpression(bad));
 assert.ok(near(parse3DRangeExpression('2pi'),2*Math.PI));
 const scene=newScene3D();for(const [kind,args] of [['surface3d',['x+y']],['parametric3d',['cos(u)','sin(v)','u+v']],['implicit3d',['x^2+y^2+z^2=1']],['vector3d',['x','y','z']],['domain3d',['z^2+1']]]){
  assert.doesNotThrow(()=>add3DPlot(scene,kind,args));
 }assert.doesNotThrow(()=>validate3D(scene));
});
test('Round62: finite 2D sampling, discontinuity bounds and region work limits',()=>{
 const q=sampleExplicitPlot(x=>1/x,px=>(px-100)/20,y=>100-20*y,200,200,{quality:'balanced'});
 assert.ok(q.segments.length>0&&q.segments.every(s=>s.every(pt=>pt.every(Number.isFinite))));
 assert.ok(!plotPath(q.segments).includes('NaN'));
 const vector=sampleVectorField(parseVectorField('-y','x'),{xMin:-2,xMax:2,yMin:-2,yMax:2},{density:8});
 assert.ok(vector.arrows.length>0&&!vector.limited);
 const colored=sampleDomainColors(parseComplexExpression('z'),{xMin:-2,xMax:2,yMin:-2,yMax:2},{resolution:32,maxEvaluations:2000});
 assert.equal(colored.rgba.length,colored.width*colored.height*4);
 const limited=sampleDomainColors(parseComplexExpression('z'),{xMin:-2,xMax:2,yMin:-2,yMax:2},{resolution:128,maxEvaluations:2000});
 assert.equal(limited.limited,true);assert.equal(limited.rgba.length,0);
});
test('Round62: 3D camera, clipping and cancellation preserve finite complete output',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sqrt(x+y+0.2)']);scene.options.detail=22;
 const projected=project3DScene(scene,720,540);
 assert.ok(projected.faces.length>0&&!projected.limited);
 assert.ok(projected.primitives.every(x=>x.kind==='face'||x.kind==='line'));
 assert.ok(projected.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))));
 const job=create3DProjectionTask(structuredClone(scene),720,540);job.step(0);job.cancel();
 assert.equal(job.step(4).cancelled,true);
});
test('Round62: public tutorials do not instruct unsupported geometry command entry',()=>{
 const guide=readFileSync(new URL('../tutorial.html',import.meta.url),'utf8');
 const archive=readFileSync(new URL('../docs/reference/tutorial-extended.html',import.meta.url),'utf8');
 for(const source of [guide,archive]){
  assert.doesNotMatch(source,/<pre>\s*A\s*=\s*\(0,\s*0\)/);
  assert.doesNotMatch(source,/<h2[^>]*>[^<]*Programmatic constructions/);
 }
 assert.match(guide,/2D plotting/);assert.match(guide,/二维绘图/);
 assert.doesNotMatch(guide,/Redraw region<\/strong>/);
});
