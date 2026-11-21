import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,clone,validateDoc} from '../src/model.mjs';
import {createSlider,recalculateAlgebra} from '../src/algebra.mjs';
import {createSemanticConstruction,constructionExpression,applyConstructionExpression} from '../src/construction_expression.mjs';

test('Construction Point coordinates bind to existing slider values and remain dynamic',()=>{
 const doc=newDoc();createSlider(doc,'a',{value:2});createSlider(doc,'b',{value:3});
 const p=createSemanticConstruction(doc,'P = Point(a, 2*b + sin(a))');
 assert.deepEqual(p.xy,[2,6+Math.sin(2)]);
 assert.deepEqual(p.xyExpr,['a','2*b + sin(a)']);
 assert.equal(constructionExpression(doc,p),'(a, 2*b + sin(a))');
 doc.algebra.sliders[0].value=4;doc.algebra.sliders[1].value=5;
 recalculateAlgebra(doc);validateDoc(doc);
 assert.deepEqual(p.xy,[4,10+Math.sin(4)]);
 applyConstructionExpression(doc,p.id,'(a + 1, b)');
 assert.deepEqual(p.xyExpr,['a + 1','b']);
 recalculateAlgebra(doc);validateDoc(doc);
 assert.deepEqual(p.xy,[5,5]);
});

test('Construction transformation amount tracks a slider without storing stale numeric parameters',()=>{
 const doc=newDoc();createSlider(doc,'a',{value:2});command(doc,'O = (0, 0)');command(doc,'P = (1, 2)');
 const r=createSemanticConstruction(doc,'R = Dilate(P, O, amount=a*2)');
 assert.equal(r.amount,4);assert.equal(r.measureExpr.amount,'a*2');
 assert.match(constructionExpression(doc,r),/amount="a\*2"/);
 doc.algebra.sliders[0].value=3;recalculateAlgebra(doc);validateDoc(doc);
 assert.equal(r.amount,6);
});

test('Undefined or invalid slider formulas fail atomically',()=>{
 const doc=newDoc();createSlider(doc,'a',{value:2});command(doc,'O = (0, 0)');command(doc,'P = (1, 2)');
 for(const source of ['Bad = Point(missing, 2)','Bad = Point(a/0, 2)','Bad = Dilate(P, O, amount=missing)','Bad = Dilate(P, O, amount=0)','Bad = TriangleCenter(P, O, P, centerKind=a)']){
  const before=clone(doc);assert.throws(()=>createSemanticConstruction(doc,source),source);assert.deepEqual(doc,before);
 }
});
