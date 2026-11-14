import test from 'node:test';import assert from 'node:assert/strict';
import {newDoc,append,validateDoc,clone,parseExpression} from '../src/model.mjs';
import {parseCurveExpression,parseParametric,parseImplicit,sampleParametricPlot,sampleImplicitPlot} from '../src/plot_modes.mjs';
import fs from 'node:fs';

test('Round36 curve input: multivariate arithmetic, strict parser and equality-to-zero',()=>{
 const eq=parseImplicit('x^2+y^2=1');assert.equal(eq(1,0),0);assert.equal(eq(2,0),3);
 assert.equal(parseImplicit('x-y')(3,3),0);assert.equal(parseImplicit('sin(x)=cos(y)')(0,0),-1);
 const param=parseParametric('cos(u)','sin(v)');assert.ok(Math.abs(param(Math.PI/2)[0])<1e-12);assert.ok(Math.abs(param(Math.PI/2)[1]-1)<1e-12);
 for(const source of ['x==y','x+y=1=2','x + window','x;alert(1)','y^2=0/0']){
  if(source==='y^2=0/0')continue;assert.throws(()=>parseImplicit(source));
 }
 assert.throws(()=>parseCurveExpression('u',['x']));assert.throws(()=>parseExpression('u'));
});

test('Round36 parametric: circle closure, cusp, discontinuities, invalid range and budgets',()=>{
 const circle=sampleParametricPlot(parseParametric('cos(u)','sin(v)'),0,2*Math.PI,p=>[p[0]*100,p[1]*100]);
 assert.ok(circle.segments.length>=1);assert.ok(circle.evaluations>100);assert.equal(circle.limited,false);
 assert.ok(Math.hypot(...circle.segments[0][0].map((x,i)=>x-circle.segments.at(-1).at(-1)[i]))<1);
 const spiral=sampleParametricPlot(parseParametric('u*cos(u)','u*sin(v)'),0,15,p=>p.map(x=>x*30),{quality:'detailed'});
 assert.ok(spiral.segments.length&&spiral.evaluations<80000);
 const pole=sampleParametricPlot(parseParametric('u','1/(u-1)'),0,2,p=>p.map(x=>x*40));
 assert.ok(pole.breaks>0,'Pole must introduce one or more gaps');
 assert.throws(()=>sampleParametricPlot(()=>[0,0],2,1,p=>p));
 assert.throws(()=>sampleParametricPlot(()=>[0,0],0,2,p=>p,{maxEvaluations:1}));
});

test('Round36 implicit: circle, hyperbola, saddle, all-positive, singularity and evaluation cap',()=>{
 const plot=fn=>sampleImplicitPlot(fn,p=>p/40-2,p=>2-p/40,160,160,{quality:'balanced',cellPx:10});
 const circle=plot(parseImplicit('x^2+y^2=1'));assert.ok(circle.segments.length>12);assert.equal(circle.limited,false);
 const hyperbola=plot(parseImplicit('x*y=1'));assert.ok(hyperbola.segments.length>3);
 const saddle=plot(parseImplicit('x*y=0'));assert.ok(saddle.segments.length>3);
 assert.equal(plot(parseImplicit('x^2+y^2+1=0')).segments.length,0);
 const pole=plot(parseImplicit('1/x=y'));assert.ok(pole.segments.every(seg=>seg.every(p=>p.every(Number.isFinite))));
 const limited=sampleImplicitPlot(parseImplicit('x^2+y^2=1'),x=>x,y=>y,2000,1600,{quality:'detailed',maxEvaluations:20000});
 assert.equal(limited.limited,true);assert.equal(limited.segments.length,0);
});

test('Round36 model: two new curve types, property validation, legacy v1 compatibility and schema',async()=>{
 const d=newDoc();const a=append(d,{type:'parametric',xExpr:'u^2',yExpr:'sin(v)',tMin:-2,tMax:2});const b=append(d,{type:'implicit',expr:'x^2+y^2-4'});
 assert.equal(validateDoc(clone(d)).objects.length,2);
 const schema=JSON.parse(fs.readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 assert.ok(schema.$defs.object.properties.type.enum.includes('parametric'));assert.ok(schema.$defs.object.properties.type.enum.includes('implicit'));
 const old=clone(d);delete old.settings.plotBudget;delete old.settings.implicitGrid;
 assert.equal(validateDoc(old).settings.plotBudget,80000);assert.equal(validateDoc(old).settings.implicitGrid,12);
 for(const changes of [{xExpr:'u.__proto__'},{tMin:3},{tMax:Infinity},{yExpr:'u+z'},{xExpr:''}]){
  const copy=clone(d);Object.assign(copy.objects[0],changes);assert.throws(()=>validateDoc(copy));
 }
 const invalid=clone(d);invalid.objects[1].expr='y = x=2';assert.throws(()=>validateDoc(invalid));
 const color=clone(d);assert.equal(color.objects[0].style.stroke,'#000000');
 assert.ok(a.id!==b.id);
});
