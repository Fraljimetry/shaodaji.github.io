#!/usr/bin/env node
/** Round 104 reliability gate: repeated 3D scene churn, bounded mesh cache, repeatability. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {newScene3D,add3DPlot,project3DScene,meshCacheStats,MAX_3D_FACES,MAX_3D_EVALUATIONS} from '../../src/plot3d.mjs';
const scenarios=Number(process.env.MI_CACHE_SCENARIOS||24);
const passes=Number(process.env.MI_CACHE_PASSES||3);
if(!Number.isInteger(scenarios)||scenarios<8||scenarios>80||!Number.isInteger(passes)||passes<2||passes>8)throw Error('MI_CACHE_SCENARIOS: 8..80; MI_CACHE_PASSES: 2..8');
const maxHeapGrowthMiB=Number(process.env.MI_CACHE_HEAP_GROWTH_MIB||128);
if(!Number.isFinite(maxHeapGrowthMiB)||maxHeapGrowthMiB<=0)throw Error('Invalid MI_CACHE_HEAP_GROWTH_MIB');
const scenes=Array.from({length:scenarios},(_,i)=>{
 const scene=newScene3D();
 const k=i%3;
 const kind=k===0?'surface3d':k===1?'domain3d':'implicit3d';
 const formula=k===0?`sin(x*${1+i/5})*cos(y)`:k===1?`z^2+${1+i/8}`:`x^2+y^2+z^2=${2+i/10}`;
 add3DPlot(scene,kind,[formula]);scene.options.detail=k===2?16:20;
 return scene;
});
if(global.gc)global.gc();const baseline=process.memoryUsage().heapUsed;
let peakCache=0,peakHeap=baseline,totalFaces=0,totalEvaluations=0;const signatures=[];const timings=[];
for(let pass=0;pass<passes;pass++){
 const current=[];
 for(const scene of scenes){
  const start=performance.now();const frame=project3DScene(scene,800,600);
  timings.push(performance.now()-start);
  assert(frame.faces.length>0 && frame.faces.length<=MAX_3D_FACES,'invalid face count');
  assert(frame.evaluations<=MAX_3D_EVALUATIONS,'evaluation budget exceeded');
  assert(frame.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))),'nonfinite projected coordinates');
  current.push([frame.faces.length,frame.lines.length,frame.evaluations]);
  totalFaces+=frame.faces.length;totalEvaluations+=frame.evaluations;
  const cache=meshCacheStats();assert(cache.estimatedBytes>=0 && cache.estimatedBytes<=cache.limitBytes,'mesh cache exceeded budget');
  peakCache=Math.max(peakCache,cache.estimatedBytes);
 }
 if(pass>0)assert.deepEqual(current,signatures[0],'identical scene changed projected geometry after cache churn');
 signatures.push(current);
 if(global.gc)global.gc();peakHeap=Math.max(peakHeap,process.memoryUsage().heapUsed);
}
const endHeap=process.memoryUsage().heapUsed;
const growthMiB=(endHeap-baseline)/1048576;
// Garbage-collection-aware guard only: without --expose-gc, heap growth is observational.
if(global.gc)assert(growthMiB<=maxHeapGrowthMiB,`heap growth ${growthMiB.toFixed(1)} MiB exceeds ${maxHeapGrowthMiB} MiB`);
const report={round:104,scenarios,passes,projections:scenarios*passes,garbageCollectionAvailable:!!global.gc,baselineHeapMiB:+(baseline/1048576).toFixed(2),endHeapMiB:+(endHeap/1048576).toFixed(2),peakHeapMiB:+(peakHeap/1048576).toFixed(2),heapGrowthMiB:+growthMiB.toFixed(2),heapGrowthBudgetMiB:global.gc?maxHeapGrowthMiB:null,peakCacheMiB:+(peakCache/1048576).toFixed(2),cacheLimitMiB:+(meshCacheStats().limitBytes/1048576).toFixed(2),medianProjectionMs:+timings.sort((a,b)=>a-b)[Math.floor(timings.length/2)].toFixed(2),totalFaces,totalEvaluations,passed:true};
console.log(JSON.stringify(report,null,2));
