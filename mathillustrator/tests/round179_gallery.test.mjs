import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDoc,position} from '../src/model.mjs';
import {parse3D} from '../src/plot3d.mjs';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../examples');
const names=['golden-ratio','spirograph','phase-portraits','gyroid','enneper','circle-inversion'];
const load=name=>validateDoc(JSON.parse(fs.readFileSync(path.join(dir,`gallery-${name}.json`),'utf8')));
test('six linked tutorial gallery projects are native, valid and editable',()=>{
 const guide=fs.readFileSync(path.resolve(dir,'../tutorial.html'),'utf8');
 for(const name of names){
  const d=load(name);
  assert.ok(guide.includes(`href="./?example=${name}"`));
  assert.ok(d.objects.length+d.scene3d.plots.length>0);
  assert.equal(d.format,'mathillustrator-project');
  assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(d))),d);
 }
});
test('golden project contains non-overlapping Fibonacci squares and logarithmic spiral',()=>{
 const d=load('golden-ratio');
 const squares=d.objects.filter(o=>o.type==='polygon').slice(1);
 assert.deepEqual(squares.map(o=>{const pts=o.refs.map(id=>position(d,id));return Math.round(Math.abs(pts[1][0]-pts[0][0]));}),[5,3,2,1,1]);
 assert.equal(d.objects.find(o=>o.name==='Golden logarithmic spiral').xExpr.includes('phi'),true);
});
test('phase portraits contain four different bounded linear fields',()=>{
 const d=load('phase-portraits');assert.equal(d.objects.length,4);
 for(const field of d.objects){assert.equal(field.type,'vectorField');assert.ok(field.normalized);assert.ok(field.region.xMin<field.region.xMax)}
});
test('3D presets evaluate to finite points away from singularities',()=>{
 for(const name of ['gyroid','enneper']){const d=load(name),p=d.scene3d.plots[0],f=parse3D(p);const v=name==='gyroid'?f(.2,.3,.4):f(.2,.3);assert.ok(Array.isArray(v)||Number.isFinite(v));if(Array.isArray(v))assert.ok(v.every(Number.isFinite));}
});
test('inverted points satisfy radial inversion invariant',()=>{
 const d=load('circle-inversion'),radius=2.5;
 for(const p of d.objects.filter(o=>o.type==='transformCopy')){
  const q=position(d,p.refs[0]),r=position(d,p.id);
  const dot=q[0]*r[0]+q[1]*r[1];assert.ok(Math.abs(dot-radius**2)<1e-8,p.name);
  assert.ok(Math.abs(q[0]*r[1]-q[1]*r[0])<1e-8,p.name);
 }
});
