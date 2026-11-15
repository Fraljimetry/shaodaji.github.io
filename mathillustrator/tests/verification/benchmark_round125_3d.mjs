import {performance} from 'node:perf_hooks';
import {newScene3D,add3DPlot,project3DScene,create3DProjectionTask,meshCacheStats} from '../../src/plot3d.mjs';
const cases=[['surface3d',['sin(x)*cos(y)'],72],['implicit3d',['x^2+y^2+z^2=4'],56],['vector3d',['y','-x','z'],64],['domain3d',['z^2+1'],64]];
const output=[];
for(const [kind,expr,detail] of cases){
 const scene=newScene3D(),plot=add3DPlot(scene,kind,expr);
 if(kind==='domain3d'){plot.heightMode='argument';plot.colorMode='phase';}
 scene.options.detail=detail;
 const start=performance.now(),first=project3DScene(scene,900,600),coldMs=performance.now()-start;
 const secondStart=performance.now();scene.options.yaw=scene.options.yaw+30;
 const warm=project3DScene(scene,900,600),warmMs=performance.now()-secondStart;
 const task=create3DProjectionTask(scene,900,600);let increments=0,state;
 const taskStart=performance.now();do{state=task.step(0);increments++;if(increments>200000)throw Error('task did not terminate');}while(!state.done);
 const taskMs=performance.now()-taskStart;
 if(warm.evaluations!==0||first.faces.length!==warm.faces.length||task.result.faces.length!==warm.faces.length)throw Error('cache or projection parity failure '+kind);
 output.push({kind,detail,coldMs:+coldMs.toFixed(2),warmMs:+warmMs.toFixed(2),taskMs:+taskMs.toFixed(2),increments,coldEvaluations:first.evaluations,warmEvaluations:warm.evaluations,faces:first.faces.length,lines:first.lines.length});
}
console.log(JSON.stringify({cases:output,cache:meshCacheStats()},null,2));
