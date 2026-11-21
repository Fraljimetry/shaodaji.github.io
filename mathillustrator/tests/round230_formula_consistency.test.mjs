import test from 'node:test';
import assert from 'node:assert/strict';
import {splitAlgebraArguments,evaluateAlgebra,createSlider,recalculateAlgebra} from '../src/algebra.mjs';
import {newDoc,command,validateDoc,createResolver} from '../src/model.mjs';

test('nested commas and parentheses split correctly without ambiguity',()=>{
 assert.deepEqual(splitAlgebraArguments('min(a, 2), max(sin(a), 3)'),['min(a, 2)','max(sin(a), 3)']);
 for(const bad of ['min(a,2), (3','min(a,2)),3','(((((((((((((((((((((((((((((((((1)'])assert.throws(()=>splitAlgebraArguments(bad));
 assert.equal(evaluateAlgebra('min(4,2)+max(1,3)'),5);
});
test('named points with nested functions use the same command grammar as on-canvas algebra',()=>{
 const doc=newDoc();createSlider(doc,'a',{min:0,max:10,value:4});
 const a=command(doc,'A = (min(a, 2), max(3, a))');
 assert.deepEqual(a.xy,[2,4]);assert.deepEqual(a.xyExpr,['min(a, 2)','max(3, a)']);
 doc.algebra.sliders[0].value=1;recalculateAlgebra(doc);
 assert.deepEqual(createResolver(doc).at(a.id),[1,3]);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(doc))),doc);
});
test('failed coordinate syntax preserves model when command is executed transactionally',()=>{
 const doc=newDoc();const before=JSON.stringify(doc);
 for(const bad of ['B = (min(2,3), 4','B = (1, max(2,3),4)','B = (sin(), 3)']){
  assert.throws(()=>command(doc,bad));assert.equal(JSON.stringify(doc),before);
 }
});
test('formula function matrix and boundary checks remain deterministic',()=>{
 const samples=[
  ['sin(pi/2)',1],['cos(0)',1],['tan(0)',0],['asin(1)',Math.PI/2],['acos(1)',0],
  ['atan(1)',Math.PI/4],['sqrt(81)',9],['abs(-7)',7],['exp(0)',1],['ln(e)',1],
  ['log10(100)',2],['floor(2.9)',2],['ceil(2.1)',3],['round(2.6)',3],
  ['min(2,4,1)',1],['max(2,4,1)',4],['pow(2,3)',8],['atan2(1,1)',Math.PI/4],
  ['hypot(3,4)',5],['phi',(1+Math.sqrt(5))/2],['2^3^2',512],['-2^2',-4],
  ['2^-2',0.25],['1e-3',0.001],['PI',Math.PI],['π',Math.PI]
 ];
 for(const [source,expected] of samples)assert.ok(Math.abs(evaluateAlgebra(source)-expected)<1e-10,source);
 const invalid=['','1/0','log(-1)','sqrt(-1)','sin(1,2)','min(1)','pow(1,2,3)',
  'unknown(1)','a+1','1e999','1;2','1[0]','constructor','2+','1,2'];
 for(const source of invalid)assert.throws(()=>evaluateAlgebra(source),source);
});
