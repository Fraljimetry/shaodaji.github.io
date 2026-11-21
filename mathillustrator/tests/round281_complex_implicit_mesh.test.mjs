import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,sample3DPlot,project3DScene} from '../src/plot3d.mjs';

const pi=Math.PI;
const bounds={xMin:-pi,xMax:pi,yMin:-pi,yMax:pi,zMin:-pi,zMax:pi};
const cases=[
 ['Schwarz-D periodic minimal surface', 'sin(x)*sin(y)*sin(z)+sin(x)*cos(y)*cos(z)+cos(x)*sin(y)*cos(z)+cos(x)*cos(y)*sin(z)'],
 ['Neovius periodic minimal surface', '3*(cos(x)+cos(y)+cos(z))+4*cos(x)*cos(y)*cos(z)'],
 ['oscillatory high-frequency implicit field','sin(7*x)*sin(7*y)+sin(7*z)'],
];
function sample(expression,detail=24){const scene=newScene3D();const plot=add3DPlot(scene,'implicit3d',[expression],bounds);scene.options.detail=detail;return {scene,mesh:sample3DPlot(plot,detail)};}
function interiorOpenEdges(faces){const edges=new Map(),coord=p=>p.map(v=>Math.round(v*1e7)).join(',');for(const face of faces)for(let i=0;i<3;i++){const a=coord(face[i]),b=coord(face[(i+1)%3]),key=a<b?a+'|'+b:b+'|'+a;edges.set(key,(edges.get(key)||0)+1)}let open=0;for(const [key,count] of edges)if(count===1&&key.split('|').every(p=>p.split(',').every(v=>Math.abs(Number(v))<pi*1e7-200)))open++;return open;}
for(const [name,expression] of cases)test(`Round281 ${name} is free from interior seams at detail 24`,()=>{
 const {scene,mesh}=sample(expression);
 assert.equal(mesh.limited,false);
 assert.ok(mesh.faces.length>10000);
 assert.equal(interiorOpenEdges(mesh.faces),0);
 const projected=project3DScene(scene,720,540);
 assert.equal(projected.limited,false);
 assert.equal(projected.faces.length,mesh.faces.length);
});
test('Round281 discontinuous tan field does not gain artificial faces from zero-tie candidate',()=>{
 const original=sample('tan(x)+tan(y)+tan(z)');
 assert.equal(original.mesh.limited,false);
 assert.equal(original.mesh.faces.length,25368);
 assert.ok(interiorOpenEdges(original.mesh.faces)>0,'Rejecting mathematical poles may produce intentional open edges');
});
test('Round281 nonfinite reciprocal and smooth sphere preserve existing sampling',()=>{
 assert.equal(sample('1/x+1/y+1/z').mesh.faces.length,11136);
 const sphere=sample('x^2+y^2+z^2-4');
 assert.equal(interiorOpenEdges(sphere.mesh.faces),0);
});
