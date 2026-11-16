import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,scene3DBounds,set3DFixRegion,validate3D,project3DScene} from '../src/plot3d.mjs';
const far={xMin:40,xMax:80,yMin:30,yMax:70,zMin:20,zMax:60};
const bounds=s=>({...s.options.fixedBounds});
test('Fix region snapshots shared visible plot region rather than first plot',()=>{
 const s=newScene3D(); add3DPlot(s,'surface3d',['x+y']); add3DPlot(s,'surface3d',['x-y'],far);
 set3DFixRegion(s,true);
 assert.deepEqual(bounds(s),{xMin:-4,xMax:80,yMin:-4,yMax:70,zMin:-4,zMax:60});
 validate3D(s);
});
test('Adding/hiding/editing other graphs never changes locked region and new plots inherit it',()=>{
 const s=newScene3D();add3DPlot(s,'surface3d',['x+y']);set3DFixRegion(s,true);
 const frozen=bounds(s);
 add3DPlot(s,'surface3d',['x*y'],far);
 assert.deepEqual(bounds(s),frozen);
 const next=add3DPlot(s,'surface3d',['sin(x)']);assert.deepEqual(next.bounds,frozen);
 s.plots[0].hidden=true;s.plots[1].bounds={...far};assert.deepEqual(bounds(s),frozen);
 validate3D(s);
});
test('Fix region toggles reversibly, without camera mutation, and rejects malformed saved bounds',()=>{
 const s=newScene3D();add3DPlot(s,'surface3d',['x']); const camera={yaw:s.options.yaw,pitch:s.options.pitch,zoom:s.options.zoom};
 set3DFixRegion(s,true);const json=JSON.parse(JSON.stringify(s));validate3D(json);
 assert.equal(json.options.fixRegion,true);assert.deepEqual([json.options.yaw,json.options.pitch,json.options.zoom],[camera.yaw,camera.pitch,camera.zoom]);
 assert.throws(()=>validate3D({...json,options:{...json.options,fixedBounds:{...json.options.fixedBounds,xMax:Infinity}}}),/fixed 3D region/i);
 set3DFixRegion(s,false); assert.equal(s.options.fixedBounds,undefined); assert.equal(s.options.fixRegion,false); validate3D(s);
});
test('Locked projection remains stable across added plots',()=>{
 const s=newScene3D();add3DPlot(s,'surface3d',['x']);set3DFixRegion(s,true);
 const before=project3DScene(s,480,360);add3DPlot(s,'surface3d',['x+1'],far);const after=project3DScene(s,480,360);
 assert.deepEqual(after.cube,before.cube);
});
