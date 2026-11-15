import test from 'node:test';
import assert from 'node:assert/strict';
import {add3DPlot,newScene3D,sample3DPlot,project3DScene} from '../src/plot3d.mjs';
const bounds={xMin:-5.1,xMax:5.1,yMin:-5.1,yMax:5.1,zMin:-5.1,zMax:5.1};
const source='cos(x)*cos(phi*y)+cos(y)*cos(phi*z)+cos(z)*cos(phi*x)';
function interiorOpenEdges(faces){
 const edges=new Map();
 const encode=point=>point.map(x=>Math.round(x*1e5)).join(',');
 for(const face of faces){
  const pts=face.map(encode);
  for(let i=0;i<3;i++){
   const a=pts[i],b=pts[(i+1)%3],key=a<b?`${a}|${b}`:`${b}|${a}`;
   edges.set(key,(edges.get(key)||0)+1);
  }
 }
 let count=0;
 for(const [edge,multiplicity] of edges){
  if(multiplicity!==1)continue;
  const points=edge.split('|').map(p=>p.split(',').map(Number).map(v=>v/1e5));
  // Exclude the intended open boundary where the surface leaves the box.
  if(points.every(p=>p.every(x=>Math.abs(x)<5.1-0.12)))count++;
 }
 return count;
}
test('Round176 implicit sample retains interior triangles for phi-based smooth surface',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'implicit3d',[source],bounds);
 const sampled=sample3DPlot(plot,22);
 assert.equal(sampled.limited,false);
 assert.ok(sampled.faces.length>46000);
 assert.equal(interiorOpenEdges(sampled.faces),0);
});
test('Round176 implicit sampler preserves discontinuity rejection and bounded scene',()=>{
 const scene=newScene3D();const pole=add3DPlot(scene,'implicit3d',['1/x=0'],bounds);
 assert.equal(sample3DPlot(pole,22).faces.length,0);
 const smooth=newScene3D();add3DPlot(smooth,'implicit3d',[source],bounds);
 smooth.options.detail=96;
 const result=project3DScene(smooth,1000,700);
 assert.equal(result.limited,false);
 assert.ok(result.faces.length>45000);
});
