import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {add3DPlot,newScene3D,sample3DPlot,sample3DPlotSteps} from '../src/plot3d.mjs';

// Exact Round 207 output baselines: the refinement optimization must not
// change numeric roots, face order, cancellation, or evaluation accounting.
const baseline=[
 ['x*y*z=0',40,null,null,'49b047d0c529e280e9570547c73f6fcfd4cbb5ff590c77024c28a29a3aeab7a5'],
 ['1/x=0',40,null,null,'2f076f91274b0c5d4148e1c5b79fbfdb3ee071e6ec5d8effb1ca6a92506729c5'],
 ['x^2+y^2+z^2=4',30,'x>0',null,'b39d2ad1a257f5713ae9229a7f396d2b3416a1a6fe3845e63f8d3f6c337d85af'],
 ['x^2+y^2+z^2=4',40,null,{xMin:-2,xMax:2,yMin:-2,yMax:2,zMin:-2,zMax:2},'578e30741953c35b1106bebe673212c09c3f0d7dd2f61217b8e1c4eb098ce98f'],
 ['cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)',22,null,{xMin:-5.1,xMax:5.1,yMin:-5.1,yMax:5.1,zMin:-5.1,zMax:5.1},'202d0295572d36721de3518eba1fa1f7ef7fd1eb002a3ecbac9d490d318f5265'],
];
function fixture(expr,bounds,condition){
 const plot=add3DPlot(newScene3D(),'implicit3d',[expr],bounds??undefined);
 if(condition)plot.regionCondition=condition;
 return plot;
}
for(const [expr,detail,condition,bounds,hash] of baseline){
 test(`R208 refinement remains byte-for-byte identical: ${expr} ${detail}`,()=>{
  const mesh=sample3DPlot(fixture(expr,bounds,condition),detail);
  assert.equal(mesh.limited,false);
  assert.equal(createHash('sha256').update(JSON.stringify(mesh)).digest('hex'),hash);
 });
}
test('R208 yielded sampler agrees with synchronous sampler after full drain',()=>{
 const plot=fixture('x^2+y^2-z^2=1');
 const sync=sample3DPlot(plot,44);
 const iter=sample3DPlotSteps(plot,44);
 let steps=0,result;
 for(;;){const next=iter.next();if(next.done){result=next.value;break;}steps++;}
 assert.ok(steps>30);
 assert.deepEqual(result,sync);
});
test('R208 interruption followed by fresh solve cannot leave partial output',()=>{
 const plot=fixture('sin(3*x)*cos(3*y)+z/2');
 const iter=sample3DPlotSteps(plot,80);
 for(let i=0;i<150;i++)assert.equal(iter.next().done,false);
 assert.equal(iter.return().done,true);
 const completed=sample3DPlot(plot,28);
 assert.equal(completed.limited,false);
 assert.ok(completed.faces.length>0);
});
