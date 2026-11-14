import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,project3DScene,create3DProjectionTask,validate3D,meshCacheStats,meshKey} from '../src/plot3d.mjs';

function drain(task){let result;for(let i=0;i<500000;i++){const state=task.step(0);if(state.done){result=state.result;break;}}assert.ok(result,'Projection must complete');return result;}
function scene(){const s=newScene3D();add3DPlot(s,'implicit3d',['cos(x+y+z)=cos(x)+cos(y)+cos(z)']);s.options.detail=88;return s;}

test('Round45 interactive orbit uses complete bounded preview without changing final resolution or the saved scene',()=>{
 const s=scene(),before=JSON.stringify(s);
 const full=project3DScene(s,850,600),preview=drain(create3DProjectionTask(s,850,600,{interactive:true}));
 assert.ok(full.faces.length>15000,'Full intricate implicit surface exists');
 assert.ok(preview.faces.length>100&&preview.faces.length<full.faces.length/3,`preview=${preview.faces.length}, full=${full.faces.length}`);
 assert.equal(preview.limited,false);
 assert.equal(JSON.stringify(s),before,'Temporary preview must not mutate saved mesh detail or camera');
 assert.ok(preview.primitives.every(p=>p.value&&Number.isFinite(p.depth)));
 const statistics=meshCacheStats();assert.ok(statistics.estimatedBytes<=statistics.limitBytes);
});

test('Round45 world-fixed shading stays stable at both preview and full detail as camera moves',()=>{
 const s=scene();s.options.detail=22;
 for(const interactive of [true,false]){
  const get=()=>drain(create3DProjectionTask(s,720,510,{interactive}));
  const first=get().faces.map(f=>f.shade).sort((a,b)=>a-b);
  s.options.yaw=155;s.options.pitch=-67;
  const second=get().faces.map(f=>f.shade).sort((a,b)=>a-b);
  assert.ok(first.length>100);assert.deepEqual(first,second);
  s.options.yaw=-38;s.options.pitch=26;
 }
 validate3D(s);
});

test('Round45 aborted preview cannot publish stale surfaces or affect later full rendering',()=>{
 const s=scene();const pending=create3DProjectionTask(s,600,400,{interactive:true});
 pending.step(.1);pending.cancel();assert.equal(pending.step().cancelled,true);assert.equal(pending.result,null);
 const result=drain(create3DProjectionTask(s,600,400));
 assert.ok(result.faces.length>1000);
});

test('Round45 camera, lock and styling changes reuse identical expensive mesh samples',()=>{
 const s=scene(),p=s.plots[0],detail=26;
 const key=meshKey(p,detail);
 project3DScene(s,680,510);const entries=meshCacheStats().entries;
 p.name='Renamed surface';p.locked=true;p.color='#bb33aa';p.opacity=.45;
 assert.equal(meshKey(p,detail),key);
 s.options.yaw=93;s.options.pitch=-20;
 project3DScene(s,680,510);
 assert.equal(meshCacheStats().entries,entries,'Lock/color/camera must not create redundant mesh variants');
 p.bounds.xMin-=.25;assert.notEqual(meshKey(p,detail),key,'Changing bounds must invalidate geometry cache');
});
