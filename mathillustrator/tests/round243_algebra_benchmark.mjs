// Repeatable diagnostic; deliberately no machine-dependent pass threshold.
import {performance} from 'node:perf_hooks';
import {evaluateAlgebra,createSlider,recalculateAlgebra} from '../src/algebra.mjs';
import {newDoc,command} from '../src/model.mjs';
const doc=newDoc();createSlider(doc,'a',{min:0,max:10,value:2});
for(let i=0;i<250;i++)command(doc,`P${i} = (a*cos(${i}/10), a*sin(${i}/10))`);
const N=3000;
let start=performance.now();for(let i=0;i<N;i++)evaluateAlgebra('hypot(clamp(a,0,10), sin(pi/4)^2)+cbrt(27)',{a:i%10});
const expressionMs=performance.now()-start;
start=performance.now();for(let i=0;i<200;i++){doc.algebra.sliders[0].value=(i%100)/10;recalculateAlgebra(doc);}
const updateMs=performance.now()-start;
console.log(JSON.stringify({expressionEvaluations:N,expressionMs:+expressionMs.toFixed(2),dependentObjects:250,sliderUpdates:200,recalculationMs:+updateMs.toFixed(2)},null,2));
