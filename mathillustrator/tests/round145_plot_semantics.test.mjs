import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizedPlotGeometry,polynomial2} from '../src/plot_geometry.mjs';
import {newDoc,append,validateDoc,createResolver,geometricLine,geometricCircle} from '../src/model.mjs';
test('Recognize exactly affine function, implicit line/circle, bounded parametric line and full circle',()=>{
 const examples=[
  [{type:'function',expr:'2*x+3'},'line'],
  [{type:'implicit',expr:'2*x+3*y=6'},'line'],
  [{type:'implicit',expr:'2x+3y=6'},'line'],
  [{type:'implicit',expr:'(x-2)^2+(y+3)^2=25'},'circle'],
  [{type:'parametric',parameter:'t',xExpr:'t',yExpr:'2*t+1',tMin:0,tMax:1},'line'],
  [{type:'parametric',parameter:'t',xExpr:'cos(t)',yExpr:'sin(t)',tMin:0,tMax:2*Math.PI},'circle'],
  [{type:'parametric',parameter:'t',xExpr:'2cos(t)+1',yExpr:'-2sin(t)-3',tMin:0,tMax:2*Math.PI},'circle'],
  [{type:'parametric',parameter:'t',xExpr:'t',yExpr:'t',polar:true,rExpr:'2',rMin:0,rMax:4,tMin:0,tMax:2*Math.PI},'circle'],
 ];
 for(const [o,k] of examples)assert.equal(recognizedPlotGeometry(o)?.kind,k,JSON.stringify(o));
});
test('Never classify noncircles from near-equality, incomplete arcs, poles, or unsupported functions',()=>{
 for(const o of [
  {type:'implicit',expr:'x^2+1.00000000001*y^2=4'},
  {type:'implicit',expr:'-x^2+y^2=4'},
  {type:'function',expr:'x^2'},
  {type:'function',expr:'tan(x)'},
  {type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:Math.PI},
  {type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:2*Math.PI-1e-9},
  {type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:Math.PI,polar:true,rExpr:'2'},
 ])assert.equal(recognizedPlotGeometry(o),null,JSON.stringify(o));
});
test('Recognized curves participate in exact geometric intersection dependencies',()=>{
 const d=newDoc();const line=append(d,{type:'function',expr:'x'}),circle=append(d,{type:'implicit',expr:'x^2+y^2=4'});
 let r=createResolver(d);assert.ok(geometricLine(line,r));assert.ok(geometricCircle(circle,r));
 const root=append(d,{type:'circleIntersection',refs:[line.id,circle.id],branch:-1});
 const constrained=append(d,{type:'pointOnObject',refs:[line.id],parameter:.5,distance:2});
 validateDoc(d);r=createResolver(d);assert.ok(r.at(constrained.id));const point=r.at(root.id);
 assert.ok(Math.abs(point[0]+Math.SQRT2)<1e-9&&Math.abs(point[1]+Math.SQRT2)<1e-9);
});
test('Polar uses parameter bounds, preserves cartesian components, and ignores legacy radial clipping',()=>{
 const d=newDoc();const o=append(d,{type:'parametric',xExpr:'cos(t)',yExpr:'sin(t)',parameter:'t',tMin:0,tMax:2*Math.PI,polar:true,rExpr:'2',rMin:0,rMax:5});
 validateDoc(d);assert.equal(JSON.parse(JSON.stringify(d)).objects[0].yExpr,'sin(t)');
 assert.equal(recognizedPlotGeometry(o).radius,2);
 assert.equal(recognizedPlotGeometry({...o,rMin:3,rMax:4}).radius,2); // legacy fields never clip
 for(const mutate of [p=>p.tMin=8,p=>p.rExpr='foo(t)',p=>p.polar='yes']){
  const bad=structuredClone(d);mutate(bad.objects[0]);assert.throws(()=>validateDoc(bad));
 }
});
