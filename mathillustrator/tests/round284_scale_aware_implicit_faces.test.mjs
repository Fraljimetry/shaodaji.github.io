import test from 'node:test';
import assert from 'node:assert/strict';
import {newScene3D,add3DPlot,sample3DPlot} from '../src/plot3d.mjs';
const pi=Math.PI;
function mesh(expr,detail,range=pi){
 const b={xMin:-range,xMax:range,yMin:-range,yMax:range,zMin:-range,zMax:range};
 const plot=add3DPlot(newScene3D(),'implicit3d',[expr],b);
 return {sample:sample3DPlot(plot,detail),b};
}
function topology(faces,b){
 const scale=1e7,counts=new Map(),key=p=>p.map(v=>Math.round(v*scale)).join(',');
 for(const tri of faces)for(let i=0;i<3;i++){
  const a=key(tri[i]),c=key(tri[(i+1)%3]),e=a<c?a+'|'+c:c+'|'+a;
  counts.set(e,(counts.get(e)||0)+1);
 }
 let interior=0,nonmanifold=0;
 for(const [edge,count] of counts){
  if(count>2){nonmanifold++;continue;}
  if(count!==1)continue;
  const points=edge.split('|').map(v=>v.split(',').map(Number).map(t=>t/scale));
  if(points.every(p=>p.every((v,i)=>v>b[['xMin','yMin','zMin'][i]]+1e-5&&v<b[['xMax','yMax','zMax'][i]]-1e-5)))interior++;
 }
 return {interior,nonmanifold};
}
for(const [name,expr,detail,range] of [
 ['near-level Schwarz-P','cos(x)+cos(y)+cos(z)=0.000001',12,pi],
 ['near-level Schwarz-P','cos(x)+cos(y)+cos(z)=0.000001',24,pi],
 ['near-level Schwarz-P','cos(x)+cos(y)+cos(z)=0.000001',48,pi],
 ['shifted periodic','cos(x+0.3)+cos(y-0.2)+cos(z+0.4)',24,pi],
 ['shifted periodic','cos(x+0.3)+cos(y-0.2)+cos(z+0.4)',80,pi],
 ['oscillatory envelope','sin(5*x)*cos(7*y)*sin(3*z)+0.2*(x*x+y*y+z*z)=0.3',48,2],
 ['exponential graph','exp(-x*x-y*y)-z',24,3],
 ['logarithmic graph','log(x*x+y*y)-z',80,2]
 ]) test(`Round284 ${name} detail ${detail} preserves interior facets`,()=>{
  const {sample,b}=mesh(expr,detail,range);
  assert.equal(sample.limited,false);
  assert.ok(sample.faces.length>1000);
  assert.equal(topology(sample.faces,b).interior,0);
  assert.ok(sample.faces.every(face=>face.every(v=>v.every(Number.isFinite))));
 });
test('Round284 invalid/pole level sets still fail closed',()=>{
 const a=mesh('1/(x-0.2)=0',24,2).sample;
 const b=mesh('1/x+1/y+1/z',24,2).sample;
 const c=mesh('tan(x)+tan(y)+tan(z)',24,pi).sample;
 assert.equal(a.faces.length,0);
 assert.equal(b.faces.length,11136);
 assert.equal(c.faces.length,25368);
 assert.ok(topology(b.faces,{xMin:-2,xMax:2,yMin:-2,yMax:2,zMin:-2,zMax:2}).interior>0);
});
