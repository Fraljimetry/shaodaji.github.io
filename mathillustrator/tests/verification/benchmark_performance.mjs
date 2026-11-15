#!/usr/bin/env node
// Round 103: measured, reproducible, opt-in performance gate. No fixed machine-speed assumption.
import {performance} from 'node:perf_hooks';
import {newScene3D,add3DPlot,project3DScene,meshCacheStats,MAX_3D_FACES,MAX_3D_EVALUATIONS} from '../../src/plot3d.mjs';
const iterations = Number(process.env.MI_PERF_ITERATIONS || 5);
if(!Number.isInteger(iterations)||iterations<3||iterations>30)throw Error('MI_PERF_ITERATIONS must be 3..30');
const budgetMs=Number(process.env.MI_PERF_P95_MS || 10000);
if(!(budgetMs>0&&Number.isFinite(budgetMs)))throw Error('Invalid MI_PERF_P95_MS');
function percentile(values,p){let s=[...values].sort((a,b)=>a-b);return Math.round(s[Math.ceil(s.length*p)-1]*100)/100;}
const scenarios=[
 {name:'surface24',kind:'surface3d',expr:'sin(x)*cos(y)',detail:24},
 {name:'domain48',kind:'domain3d',expr:'z^2+1',detail:48},
 {name:'implicit32',kind:'implicit3d',expr:'x^2+y^2+z^2=5',detail:32},
];
const results=[];
for(const spec of scenarios){
 const s=newScene3D();add3DPlot(s,spec.kind,[spec.expr]);s.options.detail=spec.detail;
 const samples=[];let frame;let firstMs;
 for(let i=0;i<=iterations;i++){
  const before=performance.now();frame=project3DScene(s,800,600);const elapsed=performance.now()-before;
  if(i===0)firstMs=elapsed;else samples.push(elapsed);
  if(!frame.faces.length||frame.faces.length>MAX_3D_FACES||frame.evaluations>MAX_3D_EVALUATIONS||!frame.faces.every(f=>f.points.every(p=>p.every(Number.isFinite))))throw Error(`Invalid projection ${spec.name}`);
 }
 const stats=meshCacheStats();if(stats.estimatedBytes>stats.limitBytes)throw Error('3D mesh cache over limit');
 results.push({scenario:spec.name,detail:spec.detail,firstMs:+firstMs.toFixed(2),warmMedianMs:percentile(samples,.5),warmP95Ms:percentile(samples,.95),faces:frame.faces.length,evaluations:frame.evaluations,cacheBytes:stats.estimatedBytes,withinBudget:percentile(samples,.95)<=budgetMs&&firstMs<=budgetMs});
}
const report={round:103,environment:{node:process.version,platform:process.platform,arch:process.arch},iterations,budgetMs,heapUsedBytes:process.memoryUsage().heapUsed,scenarios:results,passed:results.every(r=>r.withinBudget)};
console.log(JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
