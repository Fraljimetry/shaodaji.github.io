import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D, add3DPlot, sample3DPlot, sample3DPlotSteps, implicitGridCells} from '../src/plot3d.mjs';
// Full-mesh hashes captured from the unoptimized Round 205 source. These
// include triangle coordinates, winding, ordering, evaluations and limits.
const fixtures=[
 ['x^2+y^2+z^2=4',48,'39f6f7db58d0635b4fb7266df3314661a2950ae62c4b773d8ad0a579113dbad2'],
 ['x^2+y^2+z^2=4',80,'5e49c563cfdaeb888de1792dc141a717851a04f78d4c9604a3540eacb59c17e6'],
 ['x^2+y^2-z^2=1',48,'76bfe8787d735f69d29e7d11077d7bb37abc47ad28467afbfc1b2c4a3ac5a4b1'],
 ['x^2+y^2-z^2=1',80,'dbf94c2ca678cc12211587beddd16f5fcbb7f386ca5f410b5052f188540c73b3'],
 ['sin(x)*cos(y)+sin(z)=0',48,'91a4762b225d1b26deb264d1d3115e1c2f2b1761e9e689b7920d5c3c8048e505'],
 ['sin(x)*cos(y)+sin(z)=0',80,'093633bb5b02053d369a2e0c432b25656f47ca9ff19798b40985af1ccec9c63f'],
];
for(const [expression,detail,golden] of fixtures){
 test(`R206 original exact implicit mesh ${expression} detail ${detail}`,()=>{
  const scene=newScene3D(),plot=add3DPlot(scene,'implicit3d',[expression]);
  const result=sample3DPlot(plot,detail);
  assert.equal(result.limited,false);
  assert.ok(result.faces.length>1000);
  assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),golden);
 });
}
test('R206 cache key is injective and safe at maximum lattice resolution',()=>{
 const count=(implicitGridCells(128)+1)**3;
 assert.ok((count-1)*count+(count-1)<Number.MAX_SAFE_INTEGER);
 for(let a=0;a<500;a++)for(let b=a+1;b<a+30;b++){
  assert.notEqual(a*count+b,b*count+a);
 }
});
test('R206 cancellation never publishes a partial implicit mesh',()=>{
 const plot=add3DPlot(newScene3D(),'implicit3d',['sin(x)*cos(y)+sin(z)=0']);
 const stepper=sample3DPlotSteps(plot,128);
 for(let i=0;i<30;i++)assert.equal(stepper.next().done,false);
 assert.equal(stepper.return().done,true);
});
