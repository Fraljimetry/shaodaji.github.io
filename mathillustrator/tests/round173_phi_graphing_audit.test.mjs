import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCurveExpression,parseComplexExpression,parseImplicit,parseParametric,sampleParametricPlot,sampleImplicitPlot,sampleDomainColors,sampleVectorField} from '../src/plot_modes.mjs';
import {parse3DRangeExpression,add3DPlot,newScene3D,validate3D} from '../src/plot3d.mjs';
import {compileRestrictedGPUExpression,compileRestrictedGPUImplicit} from '../src/gpu_expression3d.mjs';
import {polynomial2,recognizedPlotGeometry} from '../src/plot_geometry.mjs';
const phi=(1+Math.sqrt(5))/2;
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('R173 golden ratio across main parser, Unicode aliases, complex and explicit/implicit plotting',()=>{
 for(const name of ['phi','PHI','Phi','φ','ϕ'])near(parseCurveExpression(name,[])({}),phi);
 near(parseCurveExpression('phi^2-phi-1',[])({}),0);
 near(parseCurveExpression('2phi*x+e',['x'])({x:3}),6*phi+Math.E);
 near(parseCurveExpression('1e-3+phi',[])({}),.001+phi);
 near(parseCurveExpression('2e+3+phi',[])({}),2000+phi);
 near(parseComplexExpression('phi*z+e')(2,3)[0],2*phi+Math.E);
 near(parseComplexExpression('phi*z+e')(2,3)[1],3*phi);
 near(parseImplicit('x^2+y^2=phi')(Math.sqrt(phi),0),0);
 near(parseParametric('phi*cos(t)','phi*sin(t)','t')(Math.PI/2)[1],phi);
 for(const bad of ['phix','Math.phi','phi()','ph1','1e999','2/0']){
  if(bad==='2/0')assert.equal(parseCurveExpression(bad,[])({}),Infinity);
  else assert.throws(()=>parseCurveExpression(bad,[]),undefined,bad);
 }
});
test('R173 golden ratio in GPU safe subset and 3D fields',()=>{
 const g=compileRestrictedGPUExpression('phi*x^2+φ*y+1e-3');assert.ok(g);near(g.cpu({x:2,y:3,z:0}),7*phi+.001);
 assert.ok(g.glsl.includes('1.618'));
 const eq=compileRestrictedGPUImplicit('x^2+y^2=phi');assert.ok(eq);near(eq.cpu(Math.sqrt(phi),0,0),0);
 assert.equal(compileRestrictedGPUExpression('phi/(x+1)'),null);
 near(parse3DRangeExpression('phi+1'),phi+1);
 const scene=newScene3D();add3DPlot(scene,'surface3d',['phi*sin(x)+e']);validate3D(scene);
});
test('R173 exact plotted geometry uses same phi constant without confusing exponents',()=>{
 for(const expr of ['2phi*x+e','2φ*x+e','2ϕ*x+e']){
  const p=polynomial2(expr);assert.ok(p,expr);near(p[1],2*phi);near(p[0],Math.E);
 }
 near(polynomial2('1e-3*x+phi')[1],.001);
 near(recognizedPlotGeometry({type:'implicit',expr:'x^2+y^2=phi'}).radius,Math.sqrt(phi));
 near(recognizedPlotGeometry({type:'function',expr:'phi*x+e'}).d[1],phi);
 near(recognizedPlotGeometry({type:'parametric',polar:true,rExpr:'phi',tMin:0,tMax:2*Math.PI}).radius,phi);
 assert.equal(recognizedPlotGeometry({type:'implicit',expr:'sin(x)=phi'}),null);
});
test('R173 sample budgets and finite outputs survive golden ratio expressions',()=>{
 const curve=sampleParametricPlot(parseParametric('phi*cos(t)','phi*sin(t)','t'),0,2*Math.PI,p=>p.map(v=>150*v),{quality:'balanced'});
 assert.ok(curve.segments.length>0&&curve.evaluations<=80000&&!curve.limited);
 const imp=parseImplicit('x^2+y^2=phi');const contour=sampleImplicitPlot(imp,x=>x/30-2,y=>y/30-2,120,120,{quality:'balanced'});
 assert.ok(contour.segments.length>0&&contour.evaluations<=80000);
 const vec=sampleVectorField((x,y)=>[phi*x,-phi*y],{xMin:-2,xMax:2,yMin:-2,yMax:2});assert.ok(vec.arrows.length>0);
 const cols=sampleDomainColors(parseComplexExpression('phi*z'),{xMin:-2,xMax:2,yMin:-2,yMax:2},{resolution:40});
 assert.equal(cols.rgba.length,40*40*4);
});
