import test from 'node:test';
import assert from 'node:assert/strict';
import {polynomial2,recognizedPlotGeometry} from '../src/plot_geometry.mjs';
import {newDoc,append,createResolver,validateDoc,geometricLine,geometricCircle} from '../src/model.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('Exact plot geometry accepts constants and implicit multiplication without scientific-notation ambiguity',()=>{
 for(const [expression,expected] of [
  ['2pi*x+e',[Math.E,2*Math.PI,0,0,0,0]],
  ['PI(x+1)',[Math.PI,Math.PI,0,0,0,0]],
  ['x(x+1)',[0,1,0,1,0,0]],
  ['xy',[0,0,0,0,1,0]],
  ['(x+1)(x-1)',[-1,0,0,1,0,0]],
  ['2e',[2*Math.E,0,0,0,0,0]],
  ['2e-3',[.002,0,0,0,0,0]],
  ['2e+3',[2000,0,0,0,0,0]],
 ]){
  const got=polynomial2(expression);
  assert.ok(got,expression);
  got.forEach((v,i)=>near(v,expected[i]));
 }
 for(const invalid of ['pi()','pi^x','Math.PI','x/y','1e999','sin(x)','x^^2','x^3','pi(', 'x+z'])
  assert.equal(polynomial2(invalid),null,invalid);
});

test('Exactly recognized pi/e plots participate in native geometric dependencies',()=>{
 const doc=newDoc();
 const line=append(doc,{type:'function',expr:'pi*x+e'});
 const circle=append(doc,{type:'implicit',expr:'x^2+y^2=pi'});
 const polar=append(doc,{type:'parametric',parameter:'t',xExpr:'cos(t)',yExpr:'sin(t)',polar:true,rExpr:'pi',tMin:0,tMax:2*Math.PI});
 validateDoc(doc);
 near(recognizedPlotGeometry(line).d[1],Math.PI);
 near(recognizedPlotGeometry(circle).radius,Math.sqrt(Math.PI));
 near(recognizedPlotGeometry(polar).radius,Math.PI);
 const resolver=createResolver(doc);
 assert.ok(geometricLine(line,resolver));
 assert.ok(geometricCircle(circle,resolver));
 assert.ok(geometricCircle(polar,resolver));
 assert.equal(recognizedPlotGeometry({type:'implicit',expr:'x^2+2xy+y^2=pi'}),null);
 assert.equal(recognizedPlotGeometry({type:'parametric',parameter:'t',xExpr:'cos(t)',yExpr:'sin(t)',polar:true,rExpr:'pi',tMin:0,tMax:Math.PI}),null);
});
