import test from 'node:test';
import assert from 'node:assert/strict';
import {compileRestrictedGPUExpression,compileRestrictedGPUImplicit} from '../src/gpu_expression3d.mjs';
import {parse3D} from '../src/plot3d.mjs';
const accepted=['x^2+y^2+z^2-1','2x(y+z)','(x-y)^3','x^0+y','Pi+E*z','1e-3*x','-(x+2)^2','xyz'];
test('restricted compiler accepts canonical arithmetic and emits safe float GLSL',()=>{
 for(const expr of accepted){const c=compileRestrictedGPUExpression(expr);assert.ok(c,expr);assert.match(c.glsl,/^[a-z0-9.()+*\-e]+$/i);assert.ok(!c.glsl.includes('^'));}
});
test('fail closed for divergent, unsupported, unsafe and malformed expressions',()=>{
 for(const expr of ['x/y','sin(x)','sqrt(x)','x^-1','x^5','x^(y)','x^2.5','x^3^3','x^9','x;discard','x//y','x_z','1e999','(x+1','2^(-1)','x^2^2^2','x^8','foo','x%y','']){
  assert.equal(compileRestrictedGPUExpression(expr),null,expr);
 }
});
test('compiled CPU reference retains existing parser precedence and implied multiplication',()=>{
 for(const expr of accepted){const c=compileRestrictedGPUExpression(expr);
  for(let i=0;i<80;i++){const x=(i%11-5)/3,y=(i%9-4)/5,z=(i%7-3)/4;
   assert.equal(c.cpu({x,y,z}),parse3D({kind:'implicit3d',a:expr}) (x,y,z),expr);
  }
 }
});
test('implicit equation compiles only when both sides qualify',()=>{
 const c=compileRestrictedGPUImplicit('x^2+y^2+z^2=1');assert.ok(c);assert.match(c.glsl,/^\(/);
 for(const v of [[0,0,0],[1,0,0],[.5,.5,.5]])assert.equal(c.cpu(...v),parse3D({kind:'implicit3d',a:'x^2+y^2+z^2=1'})(...v));
 for(const e of ['x=sin(y)','x=y=z','x/2=1','x='])assert.equal(compileRestrictedGPUImplicit(e),null);
});
test('compiler bounds output growth and does not inject shader statements',()=>{
 assert.equal(compileRestrictedGPUExpression('x^4^4'),null);
 assert.equal(compileRestrictedGPUExpression('x'.repeat(401)),null);
 assert.equal(compileRestrictedGPUExpression('x); gl_FragColor=vec4(1);'),null);
});
