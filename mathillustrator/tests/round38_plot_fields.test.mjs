import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,clone,validateDoc,parseExpression} from '../src/model.mjs';
import {parseCurveExpression,parseParametric,parseImplicit,parseVectorField,parseComplexExpression,renameCurveParameter,validatePlotRegion,sampleVectorField,sampleDomainColors,domainColor} from '../src/plot_modes.mjs';
import fs from 'node:fs';
const near=(a,b,eps=1e-10)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`);
const region={xMin:-4,xMax:4,yMin:-3,yMax:3};
test('Round38 safe real math: juxtaposition, case-insensitive constants, precedence and strict rejection',()=>{
 near(parseExpression('2PI+E')(0),2*Math.PI+Math.E);
 near(parseExpression('3sin(pi/2)+2x')(4),11);
 near(parseCurveExpression('xy+2pi',['x','y'])({x:2,y:3}),6+2*Math.PI);
 near(parseExpression('(x+1)(x-1)')(3),8);
 near(parseExpression('-x^2')(3),-9);
 near(parseExpression('2^-2')(0),.25);
 near(parseExpression('sin(x)cos(x)')(Math.PI/4),.5);
 near(parseImplicit('x^2+y^2=4')(0,2),0);
 near(parseImplicit('x^2+y^2-4')(0,2),0);
 for(const bad of ['window.alert(1)','window','x;return 10','constructor','x**2','x+unknown','x==y','x+y=1=2']){
  assert.throws(()=>parseImplicit(bad));
 }
});
test('Round38 parametric: exactly one selected parameter, legacy import, lossless token-safe substitution',()=>{
 const fn=parseParametric('2t*cos(t)','2t*sin(t)','t');const p=fn(Math.PI/2);near(p[0],0);near(p[1],Math.PI);
 const u=parseParametric('u^2','sin(u)','u');near(u(2)[0],4);
 assert.throws(()=>parseParametric('u','v','u'));assert.throws(()=>parseParametric('t','sin(t)','v'));
 assert.deepEqual(parseParametric('u','v')(3),[3,3],'legacy u=v remains readable');
 assert.equal(renameCurveParameter('2t+sqrt(t)+tpi+1e-3*t','t','u'),'2u+sqrt(u)+upi+1e-3*u');
});
test('Round38 vector field: density, normalized and non-normalized, singularities and field bounds',()=>{
 const f=parseVectorField('-y','x');const arrows=sampleVectorField(f,region,{density:8,normalized:false});
 assert.ok(arrows.arrows.length>20&&arrows.arrows.length<=8*60);
 assert.ok(arrows.arrows.every(a=>a.start.every(Number.isFinite)&&a.end.every(Number.isFinite)));
 const n=sampleVectorField(f,region,{density:8,normalized:true});assert.equal(arrows.arrows.length,n.arrows.length);
 const norm=n.arrows.map(a=>Math.hypot(a.end[0]-a.start[0],a.end[1]-a.start[1]));near(Math.min(...norm),Math.max(...norm));
 assert.throws(()=>parseVectorField('x','u'));assert.throws(()=>sampleVectorField(f,region,{density:200}));
 assert.equal(sampleVectorField(parseVectorField('1/(x-x)','y'),region).arrows.length,0);
});
test('Round38 complex arithmetic: i, pi/e, holomorphic and real-valued functions',()=>{
 const sq=parseComplexExpression('Z^2+I');let r=sq(1,1);near(r[0],0);near(r[1],3);
 r=parseComplexExpression('e^(i*PI)')(1,0);near(r[0],-1);near(r[1],0);
 r=parseComplexExpression('1/z')(1,1);near(r[0],.5);near(r[1],-.5);
 r=parseComplexExpression('conj(z)+abs(z)')(3,4);near(r[0],8);near(r[1],-4);
 near(parseComplexExpression('arg(i)')(1,1)[0],Math.PI/2);
 assert.throws(()=>parseComplexExpression('window.location'));
 assert.throws(()=>parseComplexExpression('x+y'));
 assert.equal(domainColor(1,0)?.length,4);
 assert.notDeepEqual(domainColor(1,0),domainColor(0,1));
});
test('Round38 domain coloring: sample sizes, nonfinite holes, budget and color variations',()=>{
 const fn=parseComplexExpression('z^2+1'),samples=sampleDomainColors(fn,region,{resolution:128});
 assert.equal(samples.width,128);assert.ok(samples.height>60);assert.equal(samples.rgba.length,128*samples.height*4);
 assert.ok(samples.rgba.some((v,i)=>i%4===3&&v===255));
 const band=sampleDomainColors(fn,region,{resolution:40,mode:'contours'});
 assert.equal(band.limited,false);assert.ok(band.rgba.some(v=>v>0));
 assert.equal(sampleDomainColors(fn,region,{resolution:256,maxEvaluations:100}).limited,true);
 assert.throws(()=>sampleDomainColors(fn,region,{resolution:10}));
 assert.throws(()=>validatePlotRegion({xMin:2,xMax:1,yMin:-1,yMax:2}));
});
test('Round38 native v1 model and schema agree; malformed fields never persist',()=>{
 const d=newDoc();const p=append(d,{type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:2*Math.PI});
 const vf=append(d,{type:'vectorField',xExpr:'-y',yExpr:'x',region,density:12,normalized:true});
 const c=append(d,{type:'domainColoring',expr:'z^2+1',region,resolution:128,colorMode:'contours'});
 assert.equal(validateDoc(clone(d)).objects.length,3);
 assert.ok(d.objects.every(o=>o.style.stroke==='#000000'));
 const schema=JSON.parse(fs.readFileSync(new URL('../docs/schemas/project-v1.schema.json',import.meta.url)));
 for(const kind of ['parametric','vectorField','domainColoring'])assert.ok(schema.$defs.object.properties.type.enum.includes(kind));
 for(const [i,patch] of [[0,{parameter:'x'}],[0,{yExpr:'sin(u)'}],[1,{density:100}],[1,{normalized:'true'}],[1,{region:{...region,xMin:9}}],[2,{expr:'fetch(z)'}],[2,{colorMode:'fancy'}],[2,{resolution:2048}]]){
  const bad=clone(d);Object.assign(bad.objects[i],patch);assert.throws(()=>validateDoc(bad),JSON.stringify(patch));
 }
 // Imported legacy dual-named one-parameter objects remain loadable unchanged.
 const legacy=clone(d);delete legacy.objects[0].parameter;legacy.objects[0].xExpr='u';legacy.objects[0].yExpr='v';assert.equal(validateDoc(legacy).objects.length,3);
 assert.notEqual(p.id,vf.id);assert.notEqual(c.id,vf.id);
});
