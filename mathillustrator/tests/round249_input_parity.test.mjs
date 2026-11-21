import test from 'node:test';
import assert from 'node:assert/strict';
import {completionCandidates,argumentContext,expressionDiagnostics} from '../src/input_assist.mjs';
const names=(expr,context)=>completionCandidates(expr,context).map(x=>x.insert);
test('R249: offer only context-valid mathematical functions and variables',()=>{
 assert(names('asi',{kind:'algebra'}).includes('asinh()'));
 assert(!names('sec',{kind:'algebra'}).includes('sec()'));
 assert(names('sec',{kind:'plot',mode:'function'}).includes('sec()'));
 assert(!names('rad',{kind:'plot',mode:'function'}).length);
 assert(names('con',{kind:'plot',mode:'domainColoring'}).includes('conj()'));
 assert(!names('con',{kind:'plot',mode:'surface3d'}).includes('conj()'));
 assert(names('i',{kind:'plot',mode:'domain3d'}).includes('i'));
 assert(!names('i',{kind:'plot',mode:'surface3d'}).includes('i'));
 assert(names('z',{kind:'plot',mode:'implicit3d'}).includes('z'));
 assert(!names('z',{kind:'plot',mode:'function'}).includes('z'));
});
test('R249: nested array commas and quoted labels do not corrupt parameter hints',()=>{
 assert.deepEqual(argumentContext('Segment([1, 2], '),{name:'Segment',index:1,args:['point A','point B']});
 assert.deepEqual(argumentContext('Node(1, 2, "a,b"'),{name:'Node',index:2,args:['x','y','label?']});
 assert.equal(expressionDiagnostics('Node(1,2,"a)b")'),null);
 assert.equal(expressionDiagnostics('Node(1,2,"hello').severity,'hint');
});
