/** Round 81 audit: intentionally failing assertions document source-reproduced defects.
 * Run separately, NEVER include in the green suite until corresponding fixes land.
 * These tests do not change source files and may be promoted individually.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {transformPoint,parabolaPoints,hyperbolaPoints,projectToCurve,alongCurve,generalCrossings} from '../src/geometry_round50.mjs';
import {parseComplexExpression,sampleDomainColors} from '../src/plot_modes.mjs';
import {newScene3D,add3DPlot,sample3DPlot,validate3D} from '../src/plot3d.mjs';
import {focalEllipse} from '../src/model.mjs';
import {r50SourceShape} from '../src/geometry_round50.mjs';

const approx=(actual,expected,tol=1e-10)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ~= ${expected}`);

test('R81-01 inversion: finite near-center point must have finite image when representable',()=>{
 const p=transformPoint([1e-10,0],'invert',[0,0],1e-5);
 assert.ok(p,'finite inversion image dropped');approx(p[0],1,1e-8);
});
test('R81-02 inversion: a tiny positive inversion radius must be accepted',()=>{
 const p=transformPoint([2e-10,0],'invert',[0,0],1e-10);
 assert.ok(p);approx(p[0],5e-11,1e-20);
});
test('R81-03 parabola: tiny but distinct focus/directrix must construct',()=>{
 const path=parabolaPoints([0,1e-10],{a:[0,0],d:[1,0]});
 assert.ok(path.length>3);
});
test('R81-04 hyperbola: scale-independent valid foci and branch point',()=>{
 const path=hyperbolaPoints([[-5e-10,0],[5e-10,0],[6e-10,1e-10]]);
 assert.ok(path.length>3);
});
test('R81-05 hyperbola: small positive semimajor axis must not vanish',()=>{
 const path=hyperbolaPoints([[-10,0],[10,0],[1e-10,1]]);
 assert.ok(path.length>3);
});
test('R81-06 constrained geometry: tiny nondegenerate path must project',()=>{
 const p=projectToCurve([5e-11,1e-11],[[0,0],[1e-10,0]]);
 assert.ok(p);approx(p.position[0],5e-11,1e-20);
});
test('R81-07 constrained geometry: tiny nondegenerate path must interpolate',()=>{
 const p=alongCurve([[0,0],[1e-10,0]],.5);
 assert.ok(p);approx(p[0],5e-11,1e-20);
});
test('R81-08 general intersection: point 5e-7 off a spline is NOT on it',()=>{
 const point={id:'p',type:'point'},spline={id:'s',type:'spline'};
 const resolver={at(id){return id==='p'?[.5,5e-7]:null},line(){return null},circle(){return null},points(o){return o.type==='spline'?[[0,0],[1,0]]:[]}};
 assert.deepEqual(generalCrossings(point,spline,resolver),[]);
});
test('R81-09 general intersection: point 5e-11 outside a unit circle is NOT on it',()=>{
 const point={id:'p',type:'point'},circle={id:'c',type:'circle'};
 const resolver={at(id){return id==='p'?[1+5e-11,0]:null},line(){return null},circle(o){return o.type==='circle'?{center:[0,0],radius:1}:null},points(){return []}};
 assert.deepEqual(generalCrossings(point,circle,resolver),[]);
});
test('R81-10 3D domain: argument height must retain negative phase regions',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'domain3d',['z']);
 plot.heightMode='argument';validate3D(scene);
 const mesh=sample3DPlot(plot,8);
 const z=mesh.faces.flat().map(vertex=>vertex[2]);
 assert.ok(z.some(value=>value<-.1),'all negative phase z values were clipped');
});
test('R81-11 3D solid domain color must not silently render phase-dependent rainbow',()=>{
 const scene=newScene3D(),plot=add3DPlot(scene,'domain3d',['z']);
 plot.colorMode='solid';validate3D(scene);
 const mesh=sample3DPlot(plot,8),colors=new Set(mesh.faces.map(face=>face.color).filter(Boolean));
 assert.ok(colors.size<=1,`solid mode emitted ${colors.size} colors`);
});
test('R81-12 complex exponent: zero to exponent zero must use algebraic constant-one convention',()=>{
 assert.deepEqual(parseComplexExpression('z^0')(0,0),[1,0]);
});
test('R81-13 domain coloring: limited result must have safe bounded bitmap dimensions',()=>{
 const result=sampleDomainColors((x,y)=>[x,y],{xMin:0,xMax:1e-300,yMin:0,yMax:1},{resolution:32});
 assert.ok(Number.isSafeInteger(result.height)&&result.height<=1024,`unsafe bitmap height: ${result.height}`);
});

test('R81-14 ellipses: tiny valid three-point focal ellipse must not disappear',()=>{
 const foci=[[-1e-10,0],[1e-10,0],[0,2e-10]];
 assert.ok(focalEllipse(foci));
});
test('R81-15 legacy ellipses: tiny 2-corner ellipse is a curve, not a diagonal',()=>{
 const ellipse={id:'e',type:'ellipse'},resolver={line:()=>null,circle:()=>null,at:()=>null,points:()=>[[-1e-8,-1e-8],[1e-8,1e-8]]};
 assert.ok(r50SourceShape(ellipse,resolver,64).length>20);
});
test('R81-16 reflection: tiny nonzero line direction must be a valid mirror',()=>{
 const p=transformPoint([2e-10,1e-10],'reflect',[0,0],0,[1e-10,0]);
 assert.ok(p);approx(p[0],2e-10,1e-20);approx(p[1],-1e-10,1e-20);
});
