import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,parseExpression,validateDoc,clone,functionSliderParameters} from '../src/model.mjs';
import {createSlider} from '../src/algebra.mjs';
import {applyConstructionExpression,constructionExpression} from '../src/construction_expression.mjs';

test('2D function uses existing slider b with live values',()=>{
 const doc=newDoc();createSlider(doc,'b',{min:0,max:20,value:2});
 const curve=command(doc,'f(x) = sin(b*x)');
 assert.equal(curve.expr,'sin(b*x)');
 assert.ok(Math.abs(parseExpression(curve.expr,functionSliderParameters(doc))(0.5)-Math.sin(1))<1e-12);
 doc.algebra.sliders[0].value=3;validateDoc(doc);
 assert.ok(Math.abs(parseExpression(curve.expr,functionSliderParameters(doc))(0.5)-Math.sin(1.5))<1e-12);
 assert.equal(constructionExpression(doc,curve),'sin(b*x)');
 applyConstructionExpression(doc,curve.id,'cos(b*x)+b');validateDoc(doc);
 assert.equal(curve.expr,'cos(b*x)+b');
});

test('function uses several case-sensitive sliders and retains implicit x multiplication',()=>{
 const doc=newDoc();createSlider(doc,'b',{value:2});createSlider(doc,'Amp',{value:3});
 const curve=command(doc,'g(x) = Amp*sin(b*x)+2x');
 const fn=parseExpression(curve.expr,functionSliderParameters(doc));
 assert.ok(Math.abs(fn(0.5)-(3*Math.sin(1)+1))<1e-12);
 assert.throws(()=>parseExpression('sin(B*x)',functionSliderParameters(doc)));
});

test('missing slider and invalid function changes are atomic',()=>{
 const doc=newDoc();createSlider(doc,'b',{value:2});const curve=command(doc,'f(x) = sin(b*x)');
 const before=clone(doc);
 assert.throws(()=>applyConstructionExpression(doc,curve.id,'sin(missing*x)'));
 assert.deepEqual(doc,before);
 doc.algebra.sliders=[];
 assert.throws(()=>validateDoc(doc),/Unknown symbol/);
});

test('existing free x functions still work and x remains graph coordinate',()=>{
 assert.equal(parseExpression('2x+sin(x)')(1),2+Math.sin(1));
 assert.equal(parseExpression('x^2',{x:99,b:7})(2),4);
});
