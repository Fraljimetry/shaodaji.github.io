import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,append,clone,validateDoc} from '../src/model.mjs';
import {constructionExpression,displayCoordinate} from '../src/construction_expression.mjs';

test('seven significant digit Properties formatting does not change stored coordinate values',()=>{
 const d=newDoc();
 const p=append(d,{type:'point',xy:[-4.335416158040364,-3.362500508626302]});
 const exact=clone(p.xy);
 assert.equal(displayCoordinate(p.xy[0]),'-4.335416');
 assert.equal(displayCoordinate(p.xy[1]),'-3.362501');
 assert.equal(constructionExpression(d,p),'(-4.335416, -3.362501)');
 assert.equal(constructionExpression(d,p,{fullPrecision:true}),'(-4.335416158040364, -3.362500508626302)');
 assert.deepEqual(p.xy,exact);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(d))).objects.find(o=>o.id===p.id).xy,exact);
});

test('display precision preserves symbolic formulas, numeric literals, and referenced semantics',()=>{
 const d=newDoc();
 const a=command(d,'A = (0,0)'),b=command(d,'B = (2,0)');
 const c=command(d,'C = Circle(A,B)');
 assert.equal(constructionExpression(d,c),'Circle(A, B)');
 const p=command(d,'P = (1.123456789123, 3*2)');
 assert.equal(constructionExpression(d,p),'(1.123457, 6)');
 assert.equal(constructionExpression(d,p,{fullPrecision:true}),'(1.123456789123, 6)');
 p.xyExpr=['1.123456789123','a*2'];
 assert.equal(constructionExpression(d,p),'(1.123457, a*2)');
 assert.equal(p.xyExpr[0],'1.123456789123');
 assert.equal(p.xyExpr[1],'a*2');
 const n=append(d,{type:'text',xy:[2.123456789123,4.000000123456],text:'x, y'});
 assert.equal(constructionExpression(d,n),'Text(2.123457, 4, "x, y")');
 assert.equal(constructionExpression(d,n,{fullPrecision:true}),'Text(2.123456789123, 4.000000123456, "x, y")');
 assert.equal(displayCoordinate('a*2'),'a*2');
 assert.equal(displayCoordinate('1.2e-10'),'1.2e-10');
 assert.equal(displayCoordinate(-0),'0');
});
