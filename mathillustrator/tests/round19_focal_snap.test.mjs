import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,command,validateDoc,clone,focalEllipse,createResolver,checkNewGeometry,guardAnchorMove} from '../src/model.mjs';
import {worldBounds,nearestFreehandAttachment} from '../src/geometry.mjs';
import {tikzGeometryIssue} from '../src/export_fidelity.mjs';

const almost=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);
const focalDoc=(f1=[-2,0],f2=[2,0],third=[0,3])=>{
 const d=newDoc(),r=[f1,f2,third].map(p=>addPoint(d,p).id);
 const o=append(d,{type:'ellipse',refs:r});
 return {d,o};
};

test('Round19 focal ellipse uses two foci and a point; rotated case is geometrically correct',()=>{
 const f=focalEllipse([[-2,0],[2,0],[0,3]]);
 almost(f.cx,0);almost(f.cy,0);almost(f.rx,Math.sqrt(13));almost(f.ry,3);almost(f.angle,0);
 const e=focalEllipse([[0,-2],[0,2],[3,0]]);
 almost(e.rx,Math.sqrt(13));almost(e.ry,3);almost(e.angle,Math.PI/2);
 assert.equal(focalEllipse([[-2,0],[2,0],[0,0]]),null);
 assert.equal(focalEllipse([[-2,0],[2,0],[2,0]]),null);
 assert.equal(focalEllipse([[0,0],[0,0],[3,1]])?.ry,Math.hypot(3,1));
 assert.equal(focalEllipse([[0,0],[0,0],[0,0]]),null);
 assert.equal(focalEllipse([[Infinity,0],[1,0],[0,1]]),null);
 assert.equal(focalEllipse([[-2,0],[2,0]]),null);
});
test('Round19 focal and historical ellipse objects coexist in v1 with stable IDs',()=>{
 const {d,o}=focalDoc(),original=clone(d);
 assert.deepEqual(validateDoc(d).objects.at(-1),o);
 const historical=append(d,{type:'ellipse',refs:o.refs.slice(0,2)});
 assert.deepEqual(validateDoc(d).objects.at(-1),historical);
 assert.equal(original.objects.at(-1).refs.length,3);
 const legacy=newDoc();for(const [n,p] of [['A',[0,0]],['B',[1,2]],['C',[0,3]]])addPoint(legacy,p,n);
 assert.equal(command(legacy,'Ellipse(A,B)').refs.length,2);
 assert.equal(command(legacy,'Ellipse(A,B,C)').refs.length,3);
 assert.deepEqual(validateDoc(legacy).objects.map(o=>o.id),legacy.objects.map(o=>o.id));
 assert.throws(()=>command(legacy,'Ellipse(A,B,C,A)'),/number of point/);
});
test('Round19 focal ellipse rejects degenerate new geometry and blocked anchor moves',()=>{
 assert.throws(()=>checkNewGeometry('ellipse',[[-2,0],[2,0],[0,0]]),/foci/);
 const {d,o}=focalDoc();const before=clone(d);
 d.objects.find(p=>p.id===o.refs[2]).xy=[0,0];
 assert.throws(()=>guardAnchorMove(before,d,o.refs[2]),/collapse/);
 assert.equal(validateDoc(before).objects.length,4);
});
test('Round19 full bounds, object attraction, and TikZ preflight for rotated ellipse',()=>{
 const {d,o}=focalDoc([0,-2],[0,2],[3,0]);
 const bounds=worldBounds(d,createResolver(d));
 almost(bounds.minX,-3);almost(bounds.maxX,3);
 almost(bounds.minY,-Math.sqrt(13));almost(bounds.maxY,Math.sqrt(13));
 const a=nearestFreehandAttachment([3.1,0],d.objects.filter(o=>o.type==='ellipse'),createResolver(d),48);
 assert.equal(a.id,o.id);almost(a.world[0],3,0.01);almost(a.world[1],0,0.01);
 assert.equal(tikzGeometryIssue(d),null);
 const small=focalDoc([0,0],[0,0],[1e-8,0]);
 assert.match(tikzGeometryIssue(small.d),/rounding/);
});
test('Round19 snapping preferences default true, legacy upgrade, and malformed values fail closed',()=>{
 const d=newDoc();assert.equal(d.settings.snapObjects,true);
 d.settings.snapObjects=false;assert.equal(validateDoc(d).settings.snapObjects,false);
 const v=clone(d);delete v.settings.snapObjects;assert.equal(validateDoc(v).settings.snapObjects,true);
 const bad=clone(d);bad.settings.snapObjects='false';assert.throws(()=>validateDoc(bad),/object snapping/);
});
