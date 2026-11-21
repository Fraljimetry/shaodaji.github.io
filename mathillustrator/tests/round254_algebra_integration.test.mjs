import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,clone,validateDoc,command} from '../src/model.mjs';
import {splitAlgebraArguments} from '../src/algebra.mjs';
import {constructionExpression,applyConstructionExpression} from '../src/construction_expression.mjs';

test('semantic arguments preserve quoted commas, parentheses, and escaped quotes',()=>{
 assert.deepEqual(splitAlgebraArguments('1, 2, "hello, (world) \\"quoted\\"", option="a,b"'),['1','2','"hello, (world) \\"quoted\\""','option="a,b"']);
 for(const invalid of ['1, "unterminated','1, (2, 3','1, 2)'])assert.throws(()=>splitAlgebraArguments(invalid));
});
test('Text and Node definitions round-trip with punctuation and escaping',()=>{
 const doc=newDoc();
 for(const type of ['text','node']){
  const object=append(doc,{type,xy:[1,2],text:'hello, (world) "quoted" \\ path'});
  const before=clone(object),expression=constructionExpression(doc,object);
  applyConstructionExpression(doc,object.id,expression);
  assert.deepEqual(object,before);
  const updated=expression.replace('hello,','updated,');
  applyConstructionExpression(doc,object.id,updated);
  assert.equal(object.text,'updated, (world) "quoted" \\ path');
 }
 validateDoc(doc);
});
test('option strings with comma and parentheses remain parseable',()=>{
 const doc=newDoc();const a=append(doc,{type:'node',name:'A',xy:[0,0],text:'a'}),b=append(doc,{type:'node',name:'B',xy:[1,1],text:'b'});
 const m=append(doc,{type:'morphism',refs:[a.id,b.id],text:'f(x, y), "q"'});
 const before=clone(m),expr=constructionExpression(doc,m);
 applyConstructionExpression(doc,m.id,expr);
 assert.deepEqual(m,before);
});
