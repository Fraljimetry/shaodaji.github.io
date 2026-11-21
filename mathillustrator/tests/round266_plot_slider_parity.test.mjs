import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc,functionSliderParameters} from '../src/model.mjs';
import {createSlider} from '../src/algebra.mjs';
import {parseParametric,parseImplicit,parseVectorField,parseComplexExpression} from '../src/plot_modes.mjs';
import {constructionExpression,applyConstructionExpression} from '../src/construction_expression.mjs';

const docWith=()=>{const d=newDoc();createSlider(d,'b',{min:0,max:20,value:2});createSlider(d,'Amp',{min:0,max:20,value:3});return d;};
test('all four formerly missing 2D plot modes accept sliders with dynamic recompile',()=>{
 const d=docWith();const params=()=>functionSliderParameters(d);
 let f=parseParametric('Amp*cos(b*t)','sin(t)','t',params());assert.ok(Math.abs(f(0)[0]-3)<1e-10);
 let g=parseImplicit('x^2+y^2=b^2',params());assert.ok(Math.abs(g(0,0)+4)<1e-10);
 let v=parseVectorField('-b*y','Amp*x',params());assert.deepEqual(v(1,2),[-4,3]);
 let c=parseComplexExpression('b*z+Amp',params());assert.deepEqual(c(1,2),[5,4]);
 d.algebra.sliders[0].value=4;validateDoc(d);
 f=parseParametric('Amp*cos(b*t)','sin(t)','t',params());assert.ok(Math.abs(f(Math.PI/4)[0]+3)<1e-10);
 g=parseImplicit('x^2+y^2=b^2',params());assert.equal(g(0,0),-16);
 v=parseVectorField('-b*y','Amp*x',params());assert.deepEqual(v(1,2),[-8,3]);
 c=parseComplexExpression('b*z+Amp',params());assert.deepEqual(c(1,2),[7,8]);
});
test('all 2D plot object schemas remain valid with slider references',()=>{
 const d=docWith();const region={xMin:-2,xMax:2,yMin:-2,yMax:2};
 const objects=[
 {type:'function',expr:'sin(b*x)'},
 {type:'parametric',xExpr:'b*cos(t)',yExpr:'Amp*sin(t)',parameter:'t',tMin:0,tMax:6},
 {type:'implicit',expr:'x^2+y^2=b^2'},
 {type:'vectorField',xExpr:'-b*y',yExpr:'Amp*x',region,density:12,normalized:false},
 {type:'domainColoring',expr:'b*z+Amp',region,resolution:32,colorMode:'phase-modulus'},
 ];
 for(const shape of objects)append(d,shape);
 validateDoc(d);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(d))),validateDoc(d));
 const before=JSON.stringify(d);d.algebra.sliders[0].value=5;validateDoc(d);assert.notEqual(JSON.stringify(d),before);
 d.algebra.sliders=[];assert.throws(()=>validateDoc(d),/Unknown symbol/);
});
test('expression roundtrip for editable 2D plot types preserves live sliders',()=>{
 const d=docWith();const region={xMin:-2,xMax:2,yMin:-2,yMax:2};
 for(const shape of [
 {type:'parametric',xExpr:'b*t',yExpr:'Amp*t',parameter:'t',tMin:0,tMax:6},
 {type:'implicit',expr:'x^2+y^2=b^2'},
 {type:'vectorField',xExpr:'b*x',yExpr:'Amp*y',region,density:12,normalized:false},
 {type:'domainColoring',expr:'b*z+Amp',region,resolution:32,colorMode:'phase-modulus'}
 ]){
  const o=append(d,shape);const text=constructionExpression(d,o);assert.ok(text);applyConstructionExpression(d,o.id,text);validateDoc(d);
 }
});
test('unbound identifiers rejected; real x/y and complex z keep their plotting meaning',()=>{
 assert.throws(()=>parseParametric('b*t','t','t'),/Unknown symbol/);
 assert.throws(()=>parseImplicit('x+b'),/Unknown symbol/);
 assert.throws(()=>parseVectorField('b*x','y'),/Unknown symbol/);
 assert.throws(()=>parseComplexExpression('b*z'),/Unknown symbol/);
 assert.equal(parseImplicit('x+y',{x:999,b:4})(1,2),3);
 assert.ok(parseComplexExpression('z^2',{z:4,b:5})(1,2).every((v,i)=>Math.abs(v-[-3,4][i])<1e-10));
 assert.deepEqual(parseComplexExpression('i*z',{i:4})(1,0),[0,1]);
});
