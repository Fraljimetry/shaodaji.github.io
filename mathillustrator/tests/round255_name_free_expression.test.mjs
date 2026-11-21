import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,append} from '../src/model.mjs';
import {constructionExpression,applyConstructionExpression} from '../src/construction_expression.mjs';

test('Properties expressions omit object names and remain editable; old input is accepted',()=>{
 const d=newDoc();
 const a=command(d,'A = (0,0)'),b=command(d,'B = (2,0)'),c=command(d,'C = Circle(A,B)');
 assert.equal(constructionExpression(d,c),'Circle(A, B)');
 c.name='D';assert.equal(constructionExpression(d,c),'Circle(A, B)');
 a.name='Alpha';assert.equal(constructionExpression(d,c),'Circle(Alpha, B)');
 applyConstructionExpression(d,c.id,'Circle(B, Alpha)');
 assert.equal(constructionExpression(d,c),'Circle(B, Alpha)');
 applyConstructionExpression(d,c.id,'D = Circle(Alpha, B)');
 assert.equal(constructionExpression(d,c),'Circle(Alpha, B)');
 assert.equal(constructionExpression(d,a),'(0, 0)');
 applyConstructionExpression(d,a.id,'(3, 4)');assert.equal(constructionExpression(d,a),'(3, 4)');
 const f=command(d,'f(x) = x^2');assert.equal(constructionExpression(d,f),'x^2');
 applyConstructionExpression(d,f.id,'x^3');assert.equal(constructionExpression(d,f),'x^3');
 applyConstructionExpression(d,f.id,'f(x) = x^4');assert.equal(constructionExpression(d,f),'x^4');
 const p=append(d,{type:'polygon',refs:[a.id,b.id,command(d,'E = (4,0)').id]});
 const edge=append(d,{type:'segment',refs:[a.id,b.id],edgeOf:p.id,edgeIndex:0});
 assert.match(constructionExpression(d,edge),/^Side\(/);
});
