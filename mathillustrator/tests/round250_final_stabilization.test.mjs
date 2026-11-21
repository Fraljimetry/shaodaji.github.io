import test from 'node:test';
import assert from 'node:assert/strict';
import {completionCandidates, argumentContext, expressionDiagnostics, applyCompletion} from '../src/input_assist.mjs';

const choices=(source,context={})=>completionCandidates(source,context).map(x=>x.insert);
test('R250: autocomplete supports the actual 2D parametric parameter, not unsupported symbols',()=>{
 assert(choices('t',{kind:'plot',dimension:'2d',mode:'parametric'}).includes('t'));
 assert(!choices('u',{kind:'plot',dimension:'2d',mode:'parametric'}).includes('u'));
 assert(choices('u',{kind:'plot',dimension:'3d',mode:'parametric3d'}).includes('u'));
});
test('R250: quoted Algebra labels are never treated as executable function tokens',()=>{
 assert.deepEqual(choices('Node(1,2,"sin',{kind:'algebra'}),[]);
 assert.equal(argumentContext('Node(1,2,"sin'),null);
 assert.equal(expressionDiagnostics('Node(1,2,"sin').severity,'hint');
 assert.equal(choices('Node(1,2,"sin"), cos',{kind:'algebra'}).includes('cos()'),true);
});
test('R250: explicit completion works after an operator, preserves position and respects parser mode',()=>{
 const candidates=completionCandidates('x+', {kind:'plot',mode:'function',force:true,caret:2});
 assert(candidates.some(x=>x.insert==='sin()'));
 assert(!candidates.some(x=>x.insert==='conj()'));
 const item=candidates.find(x=>x.insert==='sin()');
 assert.deepEqual(applyCompletion('x+',2,2,item),{text:'x+sin()',cursor:6});
 assert.equal(choices('x+',{kind:'plot',mode:'function'}).length,0);
});
