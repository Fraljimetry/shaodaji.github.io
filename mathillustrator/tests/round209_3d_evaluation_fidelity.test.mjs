import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,sample3DPlot,sample3DPlotSteps,parse3D} from '../src/plot3d.mjs';

// Goldens captured using unmodified Round 208 (before the evaluator fast paths).
// Hashes include face/line coordinates, order, and evaluation counters.
const cases=
[
 [
  "surface3d",
  [
   "sin(x)*cos(y)"
  ],
  56,
  "0c2d34887f5b75903ff1174c236fb51a037bb3ad1fae8f0bbb424cfd792ddd63"
 ],
 [
  "surface3d",
  [
   "sqrt(abs(x*y))+log(1+x^2+y^2)"
  ],
  48,
  "eafb953abcfe24ce7cb15f3a77e560ddb44b9a8b19f433fd3460eb7f30328728"
 ],
 [
  "parametric3d",
  [
   "cos(u)*sin(v)",
   "sin(u)*sin(v)",
   "cos(v)"
  ],
  36,
  "90c0f3306f07ab1fe328541c14dd5e5c38588561e5f2fe8fb51a414ff13612b8"
 ],
 [
  "parametric3d",
  [
   "u*cos(v)",
   "u*sin(v)",
   "u/3"
  ],
  38,
  "69fddc542bd7bd6daae5992d0bbf94df0bbe36e6d7ee6fee6ac1339a4f5b7f2e"
 ],
 [
  "implicit3d",
  [
   "x^2+y^2+z^2=4"
  ],
  50,
  "cae8dfca50f0106f10fdc13c7c260ca6cceef947878889ae0fa7bd73a5d82960"
 ],
 [
  "implicit3d",
  [
   "sin(3*x)*cos(3*y)+z/2"
  ],
  38,
  "311b3329e4cea9fe1c46c93bdc93fd5dc6cd6271333cb1d1ce4647409a2de795"
 ],
 [
  "implicit3d",
  [
   "cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)"
  ],
  34,
  "4844704febc67d83a71a40dab139e7948fbdd55341603720814bbbae79a410fd"
 ],
 [
  "vector3d",
  [
   "sin(x)",
   "cos(y)",
   "z/2"
  ],
  40,
  "fc04bd9e4278dfe2036b3c8b84e0a3155bed3d199663cb25e9e24d1ade483c59"
 ],
 [
  "vector3d",
  [
   "x*y",
   "y*z",
   "z*x"
  ],
  30,
  "59e0b749a992cbe077053bb334a2e5dd072ad5de80c4e586072395eb3c955485"
 ],
 [
  "domain3d",
  [
   "z^2+1"
  ],
  36,
  "d26a4ddcf43c712c9300dd487caf65df23f013f430b3e520a1f04fa62e19ae7b"
 ]
];
for (const [kind,inputs,detail,expected] of cases){
 test(`R209 exact Round208 mesh parity: ${kind} / ${inputs.join(',')}`,()=>{
  const scene=newScene3D(),plot=add3DPlot(scene,kind,inputs);
  if(kind==='vector3d')plot.density=9;
  const result=sample3DPlot(plot,detail);
  assert.equal(result.limited,false);
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),expected);
 });
}
test('R209 reusable expression variables do not leak values across interleaved samples',()=>{
 const surface=parse3D(add3DPlot(newScene3D(),'surface3d',['sin(x)+cos(y)']));
 const param=parse3D(add3DPlot(newScene3D(),'parametric3d',['u+v','u-v','u*v']));
 const vector=parse3D(add3DPlot(newScene3D(),'vector3d',['x+y','y+z','z+x']));
 for(let i=0;i<1000;i++){
  const x=i/13-10,y=i%17-8,z=i%23-11;
  assert.deepEqual(surface(x,y),[x,y,Math.sin(x)+Math.cos(y)]);
  assert.deepEqual(param(x,y),[x+y,x-y,x*y]);
  assert.deepEqual(vector(x,y,z),[x+y,y+z,z+x]);
 }
});
test('R209 cancellation and restart have identical complete results',()=>{
 const plot=add3DPlot(newScene3D(),'implicit3d',['sin(3*x)*cos(3*y)+z/2']);
 const canceled=sample3DPlotSteps(plot,76);
 for(let i=0;i<130;i++)assert.equal(canceled.next().done,false);
 assert.equal(canceled.return().done,true);
 const restarts=[sample3DPlot(plot,36),sample3DPlot(plot,36)];
 assert.deepEqual(restarts[0],restarts[1]);
 assert.ok(restarts[0].faces.length>1000);
});
