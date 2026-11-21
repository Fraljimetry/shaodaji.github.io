import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,validateDoc,createResolver} from '../src/model.mjs';
import {createSlider,recalculateAlgebra,evaluateAlgebra} from '../src/algebra.mjs';

test('constant and slider-backed point expressions share safe functions',()=>{
 const doc=newDoc();
 const p=command(doc,'A = (rad(180), cbrt(27))');
 assert.ok(Math.abs(p.xy[0]-Math.PI)<1e-12);
 assert.equal(p.xy[1],3);
 const q=command(doc,'B = (clamp(8, 0, 4), mod(-5, 3))');
 assert.deepEqual(q.xy,[4,1]);
 createSlider(doc,'a',{min:0,max:10,value:2});
 const r=command(doc,'C = (rad(180)*a, max(a, cbrt(27)))');
 assert.ok(Math.abs(r.xy[0]-2*Math.PI)<1e-12);
 assert.equal(r.xy[1],3);
 doc.algebra.sliders[0].value=4; recalculateAlgebra(doc);
 assert.ok(Math.abs(createResolver(doc).at(r.id)[0]-4*Math.PI)<1e-12);
 assert.equal(r.xy[1],4);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(doc))),doc);
});
test('invalid and unsupported expressions cannot leave partially created objects',()=>{
 const doc=newDoc();
 for(const bad of ['A = (rad(),1)','A = (cbrt(-1)/0,0)', 'A = (clamp(1,4,2),0)', 'A = (constructor(1),0)']){
  const prior=JSON.stringify(doc);
  assert.throws(()=>command(doc,bad),bad);
  assert.equal(JSON.stringify(doc),prior);
 }
});
test('constant-point expression accepts the same finite arithmetic as evaluator',()=>{
 const sources=['rad(90)','deg(pi/2)','cbrt(125)','clamp(12,1,10)','mod(-7,4)', 'sinh(1)','cosh(0)','tanh(0.2)','log2(32)','trunc(-2.3)','sign(-1)'];
 for(const [i,expr] of sources.entries()){
  const doc=newDoc();const p=command(doc,`P = (${expr},0)`);
  assert.ok(Math.abs(p.xy[0]-evaluateAlgebra(expr))<1e-9,`${i} ${expr}`);
 }
});
