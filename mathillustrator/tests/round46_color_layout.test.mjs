import test from 'node:test';
import assert from 'node:assert/strict';
import {rampColor,newScene3D,add3DPlot,validate3D,meshKey,project3DScene,create3DProjectionTask} from '../src/plot3d.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
const sceneOf=(kind,inputs)=>{const s=newScene3D();add3DPlot(s,kind,inputs);s.options.detail=18;return s;};
const colors=result=>[...new Set(result.faces.map(face=>face.color))];
function drain(task){for(let i=0;i<100000;i++){const s=task.step(0);if(s.done)return s.result;}throw Error('Task did not finish');}
test('R46 stable red-purple-blue palette, including constant and extreme cases',()=>{
 assert.equal(rampColor(0,0,100),'#ef4444');assert.equal(rampColor(50,0,100),'#a855f7');assert.equal(rampColor(100,0,100),'#3b82f6');
 assert.equal(rampColor(-20,0,100),'#ef4444');assert.equal(rampColor(900,0,100),'#3b82f6');
 assert.equal(rampColor(NaN,0,100),'#a855f7');assert.equal(rampColor(2,2,2),'#a855f7');
 for(let i=0;i<=100;i++)assert.match(rampColor(i,0,100),/^#[0-9a-f]{6}$/);
});
test('R46 surface, parametric, implicit meshes use a height ramp and preserve solid defaults',()=>{
 for(const [kind,formula] of [['surface3d',['x+y']],['parametric3d',['u','v','u']],['implicit3d',['x^2+y^2+z^2=4']]]){
  const s=sceneOf(kind,formula),p=s.plots[0];
  const solid=project3DScene(s,700,500);assert.ok(solid.faces.length>100,kind);
  assert.equal(new Set(solid.faces.map(face=>face.color)).size,1,kind);
  const key=meshKey(p,18);p.colorRange=true;validate3D(s);assert.equal(meshKey(p,18),key,kind);
  const colored=project3DScene(s,700,500);assert.ok(colors(colored).length>3,kind);
  assert.equal(colored.faces.length,solid.faces.length,kind);
  s.options.yaw=112;s.options.pitch=-36;
  const rotated=project3DScene(s,700,500);
  assert.deepEqual(colors(rotated).sort(),colors(colored).sort(),'orbit must not remap world height colors');
 }
});
test('R46 vector field arrows color by magnitude even when lengths are normalized',()=>{
 const s=sceneOf('vector3d',['x','y','z']);s.plots[0].colorRange=true;s.plots[0].normalized=true;
 const result=project3DScene(s,700,500);assert.ok(result.lines.length>20);
 assert.ok(new Set(result.lines.map(line=>line.color)).size>3,'3D magnitude variety');
 assert.ok(result.lines.every(line=>/^#[0-9a-f]{6}$/.test(line.color)));
 const p=s.plots[0],key=meshKey(p,18);p.colorRange=false;assert.equal(meshKey(p,18),key);
 assert.deepEqual(new Set(project3DScene(s,700,500).lines.map(line=>line.color)),new Set([p.color]));
});
test('R46 domain phase mode survives default, new solid and ramp choices',()=>{
 const s=sceneOf('domain3d',['z+1']);const p=s.plots[0];
 const phase=project3DScene(s,700,500);assert.ok(phase.faces.some(f=>f.domainColoring));
 p.colorRange=true;const ramp=project3DScene(s,700,500);assert.ok(ramp.faces.every(f=>!f.domainColoring));assert.ok(colors(ramp).length>3);
 p.colorRange=false;p.colorMode='solid';p.color='#226688';const solid=project3DScene(s,700,500);
 assert.ok(solid.faces.every(f=>f.color==='#226688'&&!f.domainColoring));
});
test('R46 validation rejects malformed flags and unrelated 2D objects',()=>{
 const scene=sceneOf('vector3d',['x','y','z']);scene.plots[0].colorRange='yes';assert.throws(()=>validate3D(scene));
 const d=newDoc();const obj=append(d,{type:'vectorField',xExpr:'x',yExpr:'y',region:{xMin:-2,xMax:2,yMin:-2,yMax:2},density:5,normalized:true});
 assert.doesNotThrow(()=>validateDoc(d));obj.colorRange=true;assert.equal(validateDoc(d).objects[0].colorRange,true);
 obj.colorRange=2;assert.throws(()=>validateDoc(d));delete obj.colorRange;
 const point=append(d,{type:'point',xy:[0,0]});point.colorRange=true;assert.throws(()=>validateDoc(d));
});
test('R46 color toggle remains independent of camera, caches, and cancellation',()=>{
 const s=sceneOf('implicit3d',['x^2+y^2+z^2=4']);s.options.detail=24;
 const p=s.plots[0],key=meshKey(p,24);p.colorRange=true;assert.equal(meshKey(p,24),key);
 const interrupted=create3DProjectionTask(s,700,520,{interactive:true});interrupted.step(.1);interrupted.cancel();assert.equal(interrupted.result,null);
 const colored=drain(create3DProjectionTask(s,700,520));assert.ok(colors(colored).length>5);
});
