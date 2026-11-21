import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAlgebra} from '../src/algebra.mjs';
import {newDoc,command,validateDoc} from '../src/model.mjs';

test('new Algebra math helpers are finite, nested, and enforce arity',()=>{
 for(const [source,expected] of [
  ['clamp(5,0,3)',3],['clamp(-2,0,3)',0],['mod(-5,3)',1],
  ['mod(5,-3)',2],['rad(180)',Math.PI],['deg(pi)',180],
  ['sinh(0)+cosh(0)+tanh(0)',1],['cbrt(27)',3],['log2(8)',3],
  ['trunc(-1.9)',-1],['sign(-3)',-1],['asinh(0)',0],
  ['clamp(min(5,8), 0, pow(2,2))',4]
 ])assert.ok(Math.abs(evaluateAlgebra(source)-expected)<1e-11,source);
 for(const source of ['clamp(2,5,1)','clamp(1,2)','clamp(1,2,3,4)',
  'mod(1,0)','mod(1)','deg()','log2(-2)','acosh(0)','tanh(0,1)'])
  assert.throws(()=>evaluateAlgebra(source),source);
});
test('Node coordinate formulas and RegularPolygon side arithmetic retain ordinary model semantics',()=>{
 const doc=newDoc();
 command(doc,'A = (0,0)');command(doc,'B = (3,0)');
 const node=command(doc,'N = Node(rad(180)/pi, clamp(8,0,4), "N")');
 assert.deepEqual(node.xy,[1,4]);
 const polygon=command(doc,'p = RegularPolygon(A,B,2^3)');
 assert.equal(polygon.name,'p');assert.equal(polygon.sides,8);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(doc))),doc);
 const before=JSON.stringify(doc);
 for(const source of ['Q = Node(0,1, "")','Q = Node(1/0,1,"Q")',
  'RegularPolygon(A,B,2.5)','RegularPolygon(A,B,101)'])assert.throws(()=>command(doc,source),source);
 assert.equal(JSON.stringify(doc),before);
});
