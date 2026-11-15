import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,sample3DPlot,sample3DPlotSteps,create3DProjectionTask,project3DScene} from '../src/plot3d.mjs';
// Hashes generated from the untouched Round 122 authoritative sampler.
const fixtures=[
  {
    "kind": "surface3d",
    "expr": [
      "sin(x)*cos(y)"
    ],
    "detail": 32,
    "faces": 2048,
    "lines": 0,
    "evaluations": 1089,
    "hash": "4977c754ffd5e1a56c45bbfcf6150687b67653b2016c0591048d8e18221717c9"
  },
  {
    "kind": "surface3d",
    "expr": [
      "1/(x*y)"
    ],
    "detail": 48,
    "faces": 4216,
    "lines": 0,
    "evaluations": 2401,
    "hash": "c41a8e35a4859b2f2925a84157b0a1e2393d730f1de8579ab66c718c19710bd8"
  },
  {
    "kind": "parametric3d",
    "expr": [
      "cos(u)*sin(v)",
      "sin(u)*sin(v)",
      "cos(v)"
    ],
    "detail": 36,
    "faces": 2448,
    "lines": 0,
    "evaluations": 1369,
    "hash": "1f37657a74f78f3006c67667313e08632f503973002787f18ba936ac30b05f69"
  },
  {
    "kind": "domain3d",
    "expr": [
      "z^2+1"
    ],
    "detail": 36,
    "faces": 2536,
    "lines": 0,
    "evaluations": 1369,
    "hash": "d1e934e6e9a4399759bf327d15fb7bacb228b4cc1cbf68407f90f20ddd86c824"
  },
  {
    "kind": "vector3d",
    "expr": [
      "x",
      "y",
      "z"
    ],
    "detail": 32,
    "faces": 0,
    "lines": 728,
    "evaluations": 729,
    "hash": "94f34e6ee4b805e3eb13e0413e3e0ef3617c27997b07aa0e803cfa4e1154e776"
  },
  {
    "kind": "implicit3d",
    "expr": [
      "x^2+y^2+z^2=4"
    ],
    "detail": 32,
    "faces": 8664,
    "lines": 0,
    "evaluations": 59530,
    "hash": "52693f7a8f565cb2ad4a6b8eb19eb89e8c5e15e11e871ff61bc4846ce8ab9691"
  }
];
for(const fixture of fixtures){
 test(`Round123 exact mesh parity: ${fixture.kind}: ${fixture.expr[0]}`,()=>{
  const scene=newScene3D(),plot=add3DPlot(scene,fixture.kind,fixture.expr);
  if(fixture.kind==='domain3d'){plot.heightMode='argument';plot.colorMode='phase';}
  if(fixture.kind==='vector3d')plot.density=9;
  const mesh=sample3DPlot(plot,fixture.detail);
  assert.equal(mesh.faces.length,fixture.faces);
  assert.equal(mesh.lines.length,fixture.lines);
  assert.equal(mesh.evaluations,fixture.evaluations);
  assert.equal(createHash('sha256').update(JSON.stringify({faces:mesh.faces,lines:mesh.lines})).digest('hex'),fixture.hash);
 });
}
for(const kind of ['surface3d','parametric3d','domain3d','vector3d']){
 test(`Round123 early generator abort: ${kind}`,()=>{
  const scene=newScene3D();const expressions={surface3d:['sin(x)*cos(y)'],parametric3d:['u','v','u+v'],domain3d:['z^2+1'],vector3d:['x','y','z']};
  const plot=add3DPlot(scene,kind,expressions[kind]);
  const iterator=sample3DPlotSteps(plot,80);
  assert.equal(iterator.next().done,false);
  assert.equal(iterator.return().done,true);
  assert.equal(sample3DPlot(plot,16).limited,false);
 });
}
test('Round123 repeated camera moves use cache and preserve geometry',()=>{
 const scene=newScene3D();add3DPlot(scene,'surface3d',['sin(x)*cos(y)']);
 scene.options.detail=64;
 const original=project3DScene(scene,800,600);
 assert.ok(original.faces.length>0);
 for(let yaw=-170;yaw<=170;yaw+=17){scene.options.yaw=yaw;
  const projected=project3DScene(scene,800,600);
  assert.equal(projected.evaluations,0);
  assert.equal(projected.faces.length,original.faces.length);
  assert.ok(projected.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))));
 }
 const task=create3DProjectionTask(scene,800,600);task.step(0);task.cancel();
 assert.deepEqual(task.step(),{done:true,cancelled:true,result:null});
});
