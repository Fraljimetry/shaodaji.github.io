import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCurveExpression,parseComplexExpression,parseImplicit,parseVectorField} from '../src/plot_modes.mjs';
const real=(s,vars={x:2,y:3,z:4})=>parseCurveExpression(s,['x','y','z'])(vars);
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const complex=(s,re=0.4,im=0.2)=>parseComplexExpression(s)(re,im);
const cnear=(a,b,t=1e-8)=>{near(a[0],b[0],t);near(a[1],b[1],t);};
test('all real function names compile and produce expected finite values',()=>{
 const cases={sin:['sin(0)',0],cos:['cos(0)',1],tan:['tan(0)',0],sec:['sec(0)',1],csc:['csc(pi/2)',1],cot:['cot(pi/4)',1],asin:['asin(0)',0],acos:['acos(1)',0],atan:['atan(0)',0],atan2:['atan2(1,1)',Math.PI/4],sinh:['sinh(0)',0],cosh:['cosh(0)',1],tanh:['tanh(0)',0],asinh:['asinh(0)',0],acosh:['acosh(1)',0],atanh:['atanh(0)',0],sqrt:['sqrt(9)',3],cbrt:['cbrt(-8)',-2],pow:['pow(3,2)',9],exp:['exp(0)',1],expm1:['expm1(0)',0],log:['log(e)',1],ln:['ln(e)',1],log10:['log10(100)',2],log2:['log2(8)',3],log1p:['log1p(0)',0],abs:['abs(-3)',3],sign:['sign(-3)',-1],floor:['floor(-1.2)',-2],ceil:['ceil(-1.2)',-1],round:['round(-1.5)',-1],trunc:['trunc(-1.7)',-1],min:['min(3,-2,5)',-2],max:['max(3,-2,5)',5],clamp:['clamp(5,-1,1)',1],hypot:['hypot(3,4)',5],mod:['mod(-5,3)',1]};
 for(const [name,[expr,expected]] of Object.entries(cases))near(real(expr),expected,1e-8);
 assert.equal(Object.keys(cases).length,37);
});
test('parameter syntax, commas, implicit, mixed function names',()=>{
 near(real('2max(x,0)+min(2,x)'),6);near(real('MAX(0,Sin(PI/2))'),1);
 near(parseImplicit('max(x,0)=2')(2,3),0);
 assert.deepEqual(parseVectorField('max(x,0)','min(y,0)')(-3,4),[0,0]);
 for(const s of ['max(1)','min()','min(1,)','max(1,2,)','atan2(1)','clamp(1,2)','pow(2,3,4)','sin(1,2)','max(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33)','min(1,2);alert(1)'])assert.throws(()=>parseCurveExpression(s,['x']));
});
test('complex functions and principal branches',()=>{
 const z=[.4,.2];cnear(complex('conj(conj(z))'),z);
 cnear(complex('pow(z,2)'),complex('z^2'));
 cnear(complex('exp(log(z))'),z);
 cnear(complex('sin(asin(z))'),z);
 cnear(complex('tan(atan(z))'),z);
 cnear(complex('sinh(asinh(z))'),z);
 cnear(complex('cosh(acosh(z))'),z);
 cnear(complex('tanh(atanh(z))'),z);
 cnear(complex('log10(z)*log(10)'),complex('log(z)'));
 cnear(complex('log2(z)*log(2)'),complex('log(z)'));
 cnear(complex('expm1(z)'),[complex('exp(z)')[0]-1,complex('exp(z)')[1]]);
 cnear(complex('cbrt(z)^3'),z);
 cnear(complex('sec(z)*cos(z)'),[1,0]);
 cnear(complex('csc(z)*sin(z)'),[1,0]);
 cnear(complex('cot(z)*tan(z)'),[1,0]);
 cnear(complex('norm(z)'),[.2,0]);
 cnear(complex('sign(z)*abs(z)'),z);
 cnear(complex('log1p(z)'),complex('log(1+z)'));
 for(const s of ['min(z,1)','max(z,2)','floor(z)','atan2(z,z)','pow(z)','sin(z,z)'])assert.throws(()=>parseComplexExpression(s));
});

test('complex log1p and expm1 preserve small real and imaginary components',()=>{
 for(const x of [1e-250,-1e-250,1e-100,-1e-100,1e-16,-1e-16]){
  for(const name of ['log1p','expm1']){
   const [re,im]=complex(`${name}(z)`,x,0);
   assert.ok(Math.abs(re/Math[name](x)-1)<1e-14,`${name}(${x}) = ${re}`);
   assert.equal(Math.abs(im),0);
   const [u,v]=complex(`${name}(z)`,x,x);
   assert.ok(Math.abs(u/x-1)<1e-14 && Math.abs(v/x-1)<1e-14);
  }
 }
 for(const y of [1e-100,1e-20,1e-10]){
  const [a,b]=complex('log1p(z)',0,y),[c,d]=complex('expm1(z)',0,y);
  assert.ok(Math.abs(a/(y*y/2)-1)<1e-14);
  assert.ok(Math.abs(c/(-y*y/2)-1)<1e-14);
  assert.ok(Math.abs(b/y-1)<1e-14 && Math.abs(d/y-1)<1e-14);
 }
 for(const [x,y] of [[-.9,.1],[-1,0],[-2,.1],[-2,-.1],[2,3]]){
  const expected=complex('log(1+z)',x,y),actual=complex('log1p(z)',x,y);
  if(x===-1&&y===0)assert.equal(actual[0],-Infinity);else cnear(actual,expected);
 }
});
