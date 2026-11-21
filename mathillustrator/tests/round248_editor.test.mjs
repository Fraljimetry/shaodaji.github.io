import test from 'node:test';
import assert from 'node:assert/strict';
import {argumentContext,expressionDiagnostics,completionCandidates,applyCompletion,autoPair} from '../src/input_assist.mjs';

test('nested signature contexts count only top-level arguments',()=>{
 assert.deepEqual(argumentContext('A = (max(2,3), Slider(0, 10, min(0.1, 2), '),{name:'Slider',index:3,args:['minimum','maximum','step?','value?','speed?','mode?']});
 assert.equal(argumentContext('sin(atan2(1, 2),').name,'sin');
 assert.equal(argumentContext('sin(atan2(1, ').name,'atan2');
 assert.equal(argumentContext('foo(1, 2)'),null);
});
test('lexical diagnostics do not reject incomplete input or legitimate commas',()=>{
 assert.deepEqual(expressionDiagnostics('sqrt(2'),{severity:'hint',message:'Complete the closing bracket'});
 assert.equal(expressionDiagnostics('max(2, min(3, 5))'),null);
 assert.deepEqual(expressionDiagnostics('a+b)'),{severity:'error',message:'Mismatched closing bracket',position:3});
 assert.equal(expressionDiagnostics('sin([2])'),null);
 assert.equal(expressionDiagnostics('()[]'),null);
});
test('caret edits, paired parentheses, and 3D context remain consistent',()=>{
 const source='max(1, sqr(9))';const caret=10;
 const entry=completionCandidates(source,{kind:'algebra',caret}).find(x=>x.label==='sqrt(…)');
 assert(entry);
 assert.equal(applyCompletion(source,caret,caret,entry).text,'max(1, sqrt(9))');
 assert.deepEqual(autoPair('sin',3,3,'('),{text:'sin()',cursor:4});
 assert(completionCandidates('',{kind:'plot',dimension:'3d',mode:'implicit3d'}).some(x=>x.label.includes('z^2')));
});
