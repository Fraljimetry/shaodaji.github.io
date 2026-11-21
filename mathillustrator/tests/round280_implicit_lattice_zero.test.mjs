import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,sample3DPlot,project3DScene} from '../src/plot3d.mjs';

const pi=Math.PI;
const bounds={xMin:-pi,xMax:pi,yMin:-pi,yMax:pi,zMin:-pi,zMax:pi};
function sample(expr,detail=16){
 const scene=newScene3D();
 const plot=add3DPlot(scene,'implicit3d',[expr],bounds);
 scene.options.detail=detail;
 scene.options.yaw=57.12011718750003;
 scene.options.pitch=11.719906005859373;
 return {mesh:sample3DPlot(plot,detail),scene};
}
function countInteriorOpenEdges(faces){
 const edges=new Map();
 const vertex=p=>p.map(v=>Math.round(v*1e7)).join(',');
 for(const face of faces){
  for(let i=0;i<3;i++){
   const a=vertex(face[i]),b=vertex(face[(i+1)%3]);
   const edge=a<b?`${a}|${b}`:`${b}|${a}`;
   edges.set(edge,(edges.get(edge)||0)+1);
  }
 }
 return [...edges].filter(([edge,count])=>count===1&&edge.split('|').every(vertex=>vertex.split(',').every(v=>Math.abs(Number(v))<pi-1e-5))).length;
}
test('Round280 uploaded sin(x)+sin(y)+sin(z) scene is crack-free at mesh detail 16',()=>{
 const {mesh,scene}=sample('sin(x)+sin(y)+sin(z)');
 assert.equal(mesh.limited,false);
 assert.ok(mesh.faces.length>8000);
 assert.equal(countInteriorOpenEdges(mesh.faces),0);
 const image=project3DScene(scene,989,693);
 assert.equal(image.limited,false);
 assert.equal(image.faces.length,mesh.faces.length);
});
test('Round280 coarse grid detail variants avoid interior seams',()=>{
 for(const detail of [8,12,16]){
  const {mesh}=sample('sin(x)+sin(y)+sin(z)',detail);
  assert.equal(mesh.limited,false);
  assert.equal(countInteriorOpenEdges(mesh.faces),0,`Mesh detail ${detail} must not retain interior cracks`);
 }
});
test('Round280 zero-level tie break is scale-invariant and preserves planar crossings',()=>{
 const original=sample('sin(x)+sin(y)+sin(z)').mesh;
 const scaled=sample('2*(sin(x)+sin(y)+sin(z))').mesh;
 assert.deepEqual(scaled.faces,original.faces);
 const plane=sample('x+y+z').mesh;
 assert.ok(plane.faces.length>1000);
 assert.equal(countInteriorOpenEdges(plane.faces),0);
});
test('Round280 nonfinite/pole rejection and closed surfaces retain previous behavior',()=>{
 assert.equal(sample('1/x=0').mesh.faces.length,0);
 const sphere=sample('x^2+y^2+z^2-4').mesh;
 assert.ok(sphere.faces.length>1000);
 assert.equal(countInteriorOpenEdges(sphere.faces),0);
});
