import test from 'node:test';
import assert from 'node:assert/strict';
import {autoPair,skipClosingBracket,deleteBracketPair} from '../src/input_assist.mjs';

test('literal brackets inside Algebra quoted labels are not auto-paired',()=>{
 for(const key of ['(','[']){
  const source='Node(0,0,"hello")',caret=source.indexOf('hello')+2;
  assert.equal(autoPair(source,caret,caret,key),null);
  assert.equal(autoPair('Node(0,0,\'hello\')',10,10,key),null);
 }
});
test('escaped quotes do not end a quoted label for auto-pairing',()=>{
 const source='Node(0,0,"a\\\"b")',caret=source.indexOf('b');
 assert.equal(autoPair(source,caret,caret,'('),null);
});
test('ordinary expressions retain bracket auto-pairing',()=>{
 assert.deepEqual(autoPair('sin',3,3,'('),{text:'sin()',cursor:4});
 assert.deepEqual(autoPair('x+y',1,1,'['),{text:'x[]+y',cursor:2});
 assert.equal(autoPair('ab',0,2,'('),null);
});

test('closing brackets inside labels are not skipped as expression delimiters',()=>{
 const text='Node(0,0,"a)b]c")';
 assert.equal(skipClosingBracket(text,text.indexOf(')'),')'),false);
 assert.equal(skipClosingBracket(text,text.indexOf(']'),']'),false);
 assert.equal(skipClosingBracket('sin()',4,')'),true);
 assert.equal(skipClosingBracket('x[0]',3,']'),true);
 const escaped='Node(0,0,"a\\\"b)c")';
 assert.equal(skipClosingBracket(escaped,escaped.indexOf(')'),')'),false);
});
test('backspace preserves literal adjacent brackets inside quoted labels',()=>{
 const quoted='Node(0,0,"a()b")',at=quoted.indexOf('()')+1;
 assert.equal(deleteBracketPair(quoted,at),null);
 const square='Text(0,0,"[]")';
 assert.equal(deleteBracketPair(square,square.indexOf('[]')+1),null);
 assert.deepEqual(deleteBracketPair('sin()',4),{text:'sin',cursor:3});
 assert.deepEqual(deleteBracketPair('x[]',2),{text:'x',cursor:1});
});
