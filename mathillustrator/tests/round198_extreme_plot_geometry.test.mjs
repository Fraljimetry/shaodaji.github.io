import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleExplicitPlot} from '../src/plot.mjs';
import {parseCurveExpression,parseImplicit,sampleImplicitPlot,sampleParametricPlot,sampleDomainColors,parseComplexExpression,sampleVectorField} from '../src/plot_modes.mjs';
import {newScene3D,add3DPlot,sample3DPlot,project3DScene,set3DFixRegion,validate3D} from '../src/plot3d.mjs';
import {triangleCenter,transformPoint,circleTangents} from '../src/geometry_round50.mjs';
const x=p=>(p-600)/60, y=v=>450-v*45;
test('R198 explicit 2D: 40 simultaneous high-curvature/singularity functions remain bounded and finite',()=>{
 const expressions=['sin(8x)*cos(3x)','exp(-x*x/5)*sin(20x)','tan(x)','1/(x-1)','log(abs(x))','sqrt(abs(x))','sin(1/x)','x^3-3x','atan(30x)','sin(x*x)'];
 for(let k=0;k<40;k++){
  const fn=parseCurveExpression(expressions[k%expressions.length]);
  const result=sampleExplicitPlot(v=>fn({x:v}),x,y,1200,900,{quality:k%2?'detailed':'balanced',maxEvaluations:90000});
  assert.ok(result.evaluations<=90000);
  assert.ok(result.segments.every(s=>s.length>=2&&s.every(p=>p.every(Number.isFinite))));
 }
});
test('R198 2D implicit, domain color, parametric, vector field stress stays bounded',()=>{
 const sources=['x*x+y*y-4','sin(x*y)-0.5','(x*x+y*y-1)*(x*x+y*y-9)','x*x-y*y'];
 for(const source of sources){const r=sampleImplicitPlot(parseImplicit(source),p=>(p-200)/30,p=>(p-200)/30,400,400,{quality:'balanced',maxEvaluations:120000});assert.ok(r.evaluations<=120000);}
 const f=parseComplexExpression('(z*z+1)/(z*z-1)');
 const colors=sampleDomainColors(f,{xMin:-3,xMax:3,yMin:-3,yMax:3},{resolution:256,maxEvaluations:90000});assert.ok(colors);
 const vf=sampleVectorField((x,y)=>[-y,x],{xMin:-5,xMax:5,yMin:-5,yMax:5},{density:20,maxEvaluations:30000});assert.ok(vf);
 const p=sampleParametricPlot(t=>[Math.sin(5*t),Math.cos(3*t)],0,2*Math.PI,xy=>xy,{quality:'detailed'});assert.ok(p);
});
test('R198 3D: mixed surface, implicit, parametric, vector and complex-domain sampling finite and repeatable',()=>{
 const scenes=[['surface3d',['sin(x*y)/(1+x*x+y*y)']],['implicit3d',['x*x+y*y+z*z=9']],['parametric3d',['(2+cos(v))*cos(u)','(2+cos(v))*sin(u)','sin(v)']],['vector3d',['-y','x','sin(z)']],['domain3d',['z*z+1']]];
 for(const [kind,input] of scenes){
  const scene=newScene3D();const plot=add3DPlot(scene,kind,input);validate3D(scene);
  const first=sample3DPlot(plot,18);const again=sample3DPlot(plot,18);
  assert.deepEqual(again,first,kind);
  assert.ok(first.evaluations<=1900000,kind);
  assert.ok(first.faces?.length<=240000,kind);
  assert.doesNotThrow(()=>project3DScene(scene,1200,850));
 }
});
test('R198 fixed region and visibility remain stable across repeated mixed plot changes',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x*y)']);set3DFixRegion(scene,true);const saved=structuredClone(scene.options.fixedBounds);
 for(let k=0;k<12;k++){
  add3DPlot(scene,k%2?'implicit3d':'surface3d',k%2?['x*x+y*y+z*z=4']:['sin(x)+cos(y)']);
  assert.deepEqual(scene.options.fixedBounds,saved);
  assert.ok(scene.plots.filter(p=>!p.hidden).length<=3);
  validate3D(scene);
 }
});
test('R198 geometry: repeated triangle centers and transforms stay finite for nondegenerate inputs',()=>{
 for(let i=1;i<=3000;i++){
  const a=[0,0],b=[1+i/1000,0],c=[(i%13)/17,1+(i%19)/13];
  for(const kind of ['centroid','incenter','circumcenter','orthocenter']){
   const p=triangleCenter([a,b,c],kind);if(p!==null)assert.ok(p.every(Number.isFinite),kind);
  }
  const r=transformPoint(c,'rotation',[0,0],Math.PI/3);if(r)assert.ok(r.every(Number.isFinite));
 }
});
