import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,sample3DPlot,sample3DPlotSteps,project3DScene} from '../src/plot3d.mjs';

// SHA-256 of unmodified Round 114 face arrays, generated using the Round 114
// sampler itself. These cover near/far zero sets, zero-valued lattice points,
// poles, and an all-zero tangent degeneracy. A performance-only optimization
// must not alter triangulation, winding, clipping, or evaluation accounting.
const fixtures=[
 ['x^2+y^2+z^2=1',2928,'42619adf2542a5932f27'],
 ['x^2+y^2+z^2=4',11976,'5fad23cdd27aeae96615'],
 ['x^2+y^2+z^2=1000',0,'4f53cda18c2baa0c0354'],
 ['x*y*z=0',39372,'1463eccbab4a2fe18e14'],
 ['1/x=0',0,'4f53cda18c2baa0c0354'],
 ['x^2+y^2+z^2=0',0,'4f53cda18c2baa0c0354'],
];
for(const [expression,count,prefix] of fixtures){
 test(`Round115 implicit pruning preserves Round114 geometry: ${expression}`,()=>{
  const scene=newScene3D();const plot=add3DPlot(scene,'implicit3d',[expression]);
  const mesh=sample3DPlot(plot,40);
  assert.equal(mesh.faces.length,count);
  assert.equal(createHash('sha256').update(JSON.stringify(mesh.faces)).digest('hex').slice(0,20),prefix);
  assert.equal(mesh.limited,false);
  const warm=project3DScene(scene,640,480);
  assert.ok(warm.evaluations>0);
  assert.equal(project3DScene(scene,640,480).evaluations,0);
 });
}
test('Round115 implicit sampling can be cancelled without publishing a partial mesh',()=>{
 const scene=newScene3D();const plot=add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=4']);
 const generator=sample3DPlotSteps(plot,65);
 for(let i=0;i<12;i++)assert.equal(generator.next().done,false);
 generator.return();
 const mesh=sample3DPlot(plot,40);
 assert.equal(mesh.faces.length,11976);
});
