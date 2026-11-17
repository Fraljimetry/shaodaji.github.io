import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,sample3DPlot,sample3DPlotSteps} from '../src/plot3d.mjs';
// Complete output hashes from the unchanged Round 206 sampler. Cover zero
// lattice values, rejected discontinuities, strict region clipping, an exact
// clipping-box boundary and the highly folded periodic implicit surface.
const fixtures=[
 ['x*y*z=0',40,null,null,'49b047d0c529e280e9570547c73f6fcfd4cbb5ff590c77024c28a29a3aeab7a5'],
 ['1/x=0',40,null,null,'2f076f91274b0c5d4148e1c5b79fbfdb3ee071e6ec5d8effb1ca6a92506729c5'],
 ['x^2+y^2+z^2=4',30,'x>0',null,'b39d2ad1a257f5713ae9229a7f396d2b3416a1a6fe3845e63f8d3f6c337d85af'],
 ['x^2+y^2+z^2=4',40,null,{xMin:-2,xMax:2,yMin:-2,yMax:2,zMin:-2,zMax:2},'578e30741953c35b1106bebe673212c09c3f0d7dd2f61217b8e1c4eb098ce98f'],
 ['cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)',22,null,{xMin:-5.1,xMax:5.1,yMin:-5.1,yMax:5.1,zMin:-5.1,zMax:5.1},'202d0295572d36721de3518eba1fa1f7ef7fd1eb002a3ecbac9d490d318f5265'],
];
for(const [expr,detail,condition,bounds,expected] of fixtures){
 test(`R207 implicit output fidelity: ${expr} detail ${detail} condition ${condition||'none'}`,()=>{
  const plot=add3DPlot(newScene3D(),'implicit3d',[expr],bounds ?? undefined);
  if(condition)plot.regionCondition=condition;
  const result=sample3DPlot(plot,detail);
  assert.equal(result.limited,false);
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),expected);
 });
}
test('R207 interrupted high-detail construction publishes no partial mesh',()=>{
 const plot=add3DPlot(newScene3D(),'implicit3d',['x^2+y^2-z^2=1']);
 const generator=sample3DPlotSteps(plot,120);
 for(let i=0;i<200;i++)assert.equal(generator.next().done,false);
 assert.equal(generator.return().done,true);
 // A completed low-detail solve still works after cancellation.
 const mesh=sample3DPlot(plot,24);
 assert.ok(mesh.faces.length>1000);
 assert.equal(mesh.limited,false);
});
