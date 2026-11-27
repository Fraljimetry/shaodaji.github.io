import test from 'node:test';
import assert from 'node:assert/strict';
import {compileRegionCondition,inRegion,clipConditionTriangle} from '../src/region_condition.mjs';
import {newScene3D,add3DPlot,sample3DPlot,meshKey,validate3D} from '../src/plot3d.mjs';
import {sampleVectorField,sampleDomainColors} from '../src/plot_modes.mjs';

test('strict grammar, 2D/3D variables, whitespace, and numerical comparisons',()=>{
 assert.equal(inRegion(compileRegionCondition('x^2+y^2 < 4',2),1,1),true);
 assert.equal(inRegion(compileRegionCondition('x^2+y^2 < 4',2),2,0),false);
 assert.equal(inRegion(compileRegionCondition('x > -pi/2',2),-1,0),true);
 assert.equal(inRegion(compileRegionCondition('x^2+y^2+z^2 > 4',3),0,0,3),true);
 assert.equal(inRegion(compileRegionCondition('x^2+y^2+z^2 > 4',3),0,0,2),false);
 assert.equal(compileRegionCondition(''),null);
 for(const source of ['x<=1','x>=0','x<y<z','x==1','x>','x<1;alert(1)','z>0']){
  assert.throws(()=>compileRegionCondition(source,source==='z>0'?2:3),undefined,source);
 }
});

test('clipping a triangle preserves only permitted half-space and nonempty geometry',()=>{
 const predicate=compileRegionCondition('x>0');
 const original=[[-2,0,0],[2,-1,0],[2,1,0]];
 const pieces=clipConditionTriangle(original,predicate);
 assert.equal(pieces.length,2);
 for(const face of pieces)for(const v of face)assert.ok(v[0]>=-1e-12);
 assert.equal(clipConditionTriangle(original,null).length,1);
 assert.deepEqual(clipConditionTriangle([[-3,0,0],[-2,1,0],[-1,0,0]],predicate),[]);
});

test('3D surfaces respect strict region, preserve cache-key isolation, validate imported projects',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'surface3d',['0']);
 const key=meshKey(plot,18),full=sample3DPlot(plot,18);
 plot.regionCondition='x>0';validate3D(scene);
 assert.notEqual(meshKey(plot,18),key);
 const clipped=sample3DPlot(plot,18);
 assert.ok(clipped.faces.length>0&&clipped.faces.length<full.faces.length);
 for(const triangle of clipped.faces)for(const p of triangle)assert.ok(p[0]>=-1e-9);
 plot.regionCondition='x>=0';assert.throws(()=>validate3D(scene));
});

test('2D vector and color sample coordinates admit safe filtering and strict exclusion',()=>{
 const check=compileRegionCondition('x>0',2),bounds={xMin:-2,xMax:2,yMin:-2,yMax:2};
 const vectors=sampleVectorField(()=>[1,0],bounds,{density:12});
 const selected=vectors.arrows.filter(a=>inRegion(check,...a.start)&&inRegion(check,...a.end));
 assert.ok(selected.length>0&&selected.length<vectors.arrows.length);
 const colored=sampleDomainColors(()=>[1,0],bounds,{resolution:32,maxEvaluations:2000});
 assert.equal(colored.width,32);
 assert.equal(inRegion(check,0,1),false);
});

test('implicit surface world triangles are cut by the spatial condition and unfiltered geometry survives',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'implicit3d',['x*x+y*y+z*z-4']);
 const all=sample3DPlot(plot,22);assert.ok(all.faces.length>100);
 plot.regionCondition='x>0';const half=sample3DPlot(plot,22);
 assert.ok(half.faces.length>50&&half.faces.length<all.faces.length);
 for(const triangle of half.faces)for(const v of triangle)assert.ok(v[0]>=-1e-9);
 plot.regionCondition='x<0';const other=sample3DPlot(plot,22);
 assert.ok(other.faces.length>50);
 for(const triangle of other.faces)for(const v of triangle)assert.ok(v[0]<=1e-9);
});

test('finite opposite-sign region values cannot overflow edge interpolation',()=>{
 const triangle=[[-1,0,0],[1,-1,0],[1,1,0]];
 const condition=compileRegionCondition('x*exp(709.5)>0');
 assert.ok(Number.isFinite(condition(1,0,0))&&condition(1,0,0)>1e308);
 const pieces=clipConditionTriangle(triangle,condition);
 assert.equal(pieces.length,2);
 for(const point of pieces.flat())assert.ok(point[0]>=0,JSON.stringify(point));
 const boundary=pieces.flat().filter(p=>p[0]===0);
 assert.ok(boundary.some(p=>p[1]===-0.5)&&boundary.some(p=>p[1]===0.5));
 const reversed=clipConditionTriangle([...triangle].reverse(),condition);
 assert.ok(reversed.flat().every(p=>p[0]>=0));
});
