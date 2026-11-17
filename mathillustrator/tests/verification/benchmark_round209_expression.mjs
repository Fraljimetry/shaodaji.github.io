/** Reproducible evaluator/mesh benchmark. Optional first argument: prior plot3d.mjs path.
 * Node: node tests/verification/benchmark_round209_expression.mjs /path/to/round208/plot3d.mjs
 * This is observational, not a timing-based pass/fail test.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {add3DPlot,newScene3D,parse3D,sample3DPlot} from '../../src/plot3d.mjs';
const baseline=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2])).href):null;
const modes=[baseline,{add3DPlot,newScene3D,parse3D,sample3DPlot}].filter(Boolean);
const cases=[
 ['polynomial','x^2+y^2+z^2=4',80],
 ['oscillatory','sin(3*x)*cos(3*y)+z/2',80],
 ['folded','cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)',60]
];
const median=a=>{const x=[...a].sort((a,b)=>a-b);return (x[3]+x[4])/2;};
for(const [name,expression,detail] of cases){
 const durations=modes.map(()=>[]),evaluations=[];
 for(let trial=0;trial<8;trial++)for(const idx of (trial%2?[...modes.keys()].reverse():[...modes.keys()])){
  const m=modes[idx],plot=m.add3DPlot(m.newScene3D(),'implicit3d',[expression]);
  const started=performance.now(),mesh=m.sample3DPlot(plot,detail);
  durations[idx].push(performance.now()-started);
  if(mesh.limited)throw Error('Incomplete sample: '+name);
  evaluations[idx]=mesh.evaluations;
 }
 console.log(JSON.stringify({name,detail,evaluations,median_ms:durations.map(x=>+median(x).toFixed(2)),raw_ms:durations.map(x=>x.map(v=>+v.toFixed(2)))}));
}
