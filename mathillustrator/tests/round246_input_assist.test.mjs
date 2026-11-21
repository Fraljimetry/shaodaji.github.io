import test from 'node:test';
import assert from 'node:assert/strict';
import {completionCandidates,applyCompletion,autoPair} from '../src/input_assist.mjs';
test('contextual 2D/3D modes and typing suggestions',()=>{
 assert(completionCandidates('',{kind:'plot',dimension:'3d',mode:'implicit3d'}).some(x=>x.label.includes('z^2')));
 assert(!completionCandidates('',{kind:'plot',dimension:'2d',mode:'implicit'}).some(x=>x.label.includes('z^2')));
 assert(completionCandidates('sqr',{kind:'algebra'}).some(x=>x.label.startsWith('sqrt')));
 assert(completionCandidates('Seg',{kind:'algebra'}).some(x=>x.label.startsWith('Segment')));
 assert(!completionCandidates('Seg',{kind:'plot'}).some(x=>x.label.startsWith('Segment')));
});
test('completion edits only active token and places caret inside call',()=>{
 const c=completionCandidates('A = (sqr',{kind:'algebra'})[0];
 const result=applyCompletion('A = (sqr',8,8,c);
 assert.equal(result.text,'A = (sqrt()');assert.equal(result.cursor,10);
 assert.deepEqual(autoPair('sin',3,3,'('),{text:'sin()',cursor:4});
 assert.equal(autoPair('sin',0,2,'('),null);
});

test('in-place completion preserves suffix, uses caret, and avoids duplicate calls',()=>{
 const original='A = (sqr(9), 1)';
 const pos=8;
 const candidate=completionCandidates(original,{kind:'algebra',caret:pos}).find(x=>x.label==='sqrt(…)');
 assert(candidate);
 assert.deepEqual(applyCompletion(original,pos,pos,candidate),{text:'A = (sqrt(9), 1)',cursor:9});
 const middle='sin(0)+co(2)';
 const at=9; // immediately after 'co'
 const c=completionCandidates(middle,{kind:'plot',caret:at}).find(x=>x.label==='cos(…)');
 assert(c);
 assert.equal(applyCompletion(middle,at,at,c).text,'sin(0)+cos(2)');
 assert(!completionCandidates('x+',{kind:'plot',caret:2}).length);
 assert(!completionCandidates('',{kind:'plot',dimension:'3d',mode:'unknown'}).length);
});

test('completion replaces selected suffix and respects explicit mid-text cursor',()=>{
 const original='sqrjunk + x';
 const options=completionCandidates(original,{kind:'algebra',caret:3});
 const c=options.find(x=>x.label==='sqrt(…)');
 assert(c);
 assert.deepEqual(applyCompletion(original,3,3,c),{text:'sqrt() + x',cursor:5});
 assert.deepEqual(autoPair('ab',1,1,'['),{text:'a[]b',cursor:2});
});
