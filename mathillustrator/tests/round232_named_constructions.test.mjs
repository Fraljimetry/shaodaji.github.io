import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,validateDoc,createResolver} from '../src/model.mjs';
import {createSlider,recalculateAlgebra} from '../src/algebra.mjs';

test('named Algebra constructors create ordinary geometry with live dependent references',()=>{
 const d=newDoc();createSlider(d,'a',{min:1,max:5,step:1,value:2});
 const A=command(d,'A=(0,0)'),B=command(d,'B=(a,0)'),C=command(d,'C=(0,a)');
 const segment=command(d,'s = Segment(A,B)');
 const triangle=command(d,'T = Triangle(A,B,C)');
 const midpoint=command(d,'M = Midpoint(A,B)');
 const fixed=command(d,'L = FixedLength(A,B,a)');
 assert.equal(segment.name,'s');assert.equal(segment.type,'segment');
 assert.equal(triangle.name,'T');assert.equal(midpoint.name,'M');assert.equal(fixed.name,'L');
 assert.deepEqual(segment.refs,[A.id,B.id]);assert.equal(d.objects.find(o=>o.id===segment.id),segment);
 assert.throws(()=>command(d,'s = Segment(A,C)'),/Name already in use/);
 assert.throws(()=>command(d,'a = Segment(A,C)'),/Name already in use/);
 validateDoc(d);d.algebra.sliders[0].value=4;recalculateAlgebra(d);validateDoc(d);
 assert.deepEqual(createResolver(d).at(B.id),[4,0]);assert.equal(fixed.length,4);
 assert.equal(JSON.parse(JSON.stringify(d)).objects.find(o=>o.id===segment.id).name,'s');
});
test('named invalid algebra constructors do not add objects',()=>{
 const d=newDoc();command(d,'A=(0,0)');const old=d.objects.length;
 assert.throws(()=>command(d,'bad = Segment(A,Missing)'));
 assert.equal(d.objects.length,old);
});
