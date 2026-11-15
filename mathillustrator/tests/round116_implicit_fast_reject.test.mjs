import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {newScene3D,add3DPlot,sample3DPlot,sample3DPlotSteps} from '../src/plot3d.mjs';

// Grounded against Round 115's unoptimized implementation. Fast-reject
// must change allocation cost only, not topology, winding or probe counts.
const checks=[
 ['x^2+y^2+z^2=1',40,2928,'42619adf2542a5932f27'],
 ['x^2+y^2+z^2=4',40,11976,'5fad23cdd27aeae96615'],
 ['x^2+y^2+z^2=1000',40,0,'4f53cda18c2baa0c0354'],
 ['x*y*z=0',40,39372,'1463eccbab4a2fe18e14'],
 ['1/x=0',40,0,'4f53cda18c2baa0c0354'],
 ['x^2+y^2+z^2=0',40,0,'4f53cda18c2baa0c0354'],
];
for(const [expr,detail,expectedCount,expectedHash] of checks){
 test(`Round116 fast-reject preserves implicit mesh: ${expr}`,()=>{
  const scene=newScene3D(),plot=add3DPlot(scene,'implicit3d',[expr]);
  const result=sample3DPlot(plot,detail);
  assert.equal(result.faces.length,expectedCount);
  assert.equal(createHash('sha256').update(JSON.stringify(result.faces)).digest('hex').slice(0,20),expectedHash);
  assert.equal(result.limited,false);
  assert.ok(result.evaluations>0);
 });
}
test('Round116 generator cancellation never exposes partial mesh',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'implicit3d',['x^2+y^2+z^2=1']);
 const gen=sample3DPlotSteps(plot,80);
 for(let j=0;j<10;j++)assert.equal(gen.next().done,false);
 assert.equal(gen.return().done,true);
 assert.equal(sample3DPlot(plot,40).faces.length,2928);
});
