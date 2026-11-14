import test from 'node:test';
import assert from 'node:assert/strict';
import {toggleIds,windowSelection,commonValue,compatibleObjects} from '../src/selection.mjs';
test('Ctrl/Shift selection toggles without modifying existing ids',()=>{
 const original=new Set(['o1','o2']);const plus=toggleIds(original,'o3');
 assert.deepEqual([...plus],['o1','o2','o3']);
 assert.deepEqual([...toggleIds(plus,'o2')],['o1','o3']);
 assert.deepEqual([...original],['o1','o2']);
 assert.deepEqual([...toggleIds(plus,null)],[...plus]);
});
test('window and crossing selections differ and malformed bounds fail closed',()=>{
 const bounds=[['a',{left:10,top:10,right:20,bottom:20}],['b',{left:25,top:25,right:65,bottom:65}],['c',{left:NaN,top:10,right:11,bottom:12}],['d',null]];
 assert.deepEqual(windowSelection(bounds,[0,0],[40,40]),['a']);
 assert.deepEqual(windowSelection(bounds,[40,40],[0,0]),['a','b']);
 assert.deepEqual(windowSelection(bounds,[0,0],[2,60]),[]);
 assert.deepEqual(windowSelection(bounds,[0,0],[40,2]),[]);
});
test('bulk styles respect locked objects and fill/point categories',()=>{
 const objects=[{id:'a',type:'point',style:{stroke:'#fff',width:2}},{id:'b',type:'rectangle',style:{stroke:'#fff',width:2,fill:'#000'}},{id:'c',type:'node',locked:true,style:{stroke:'#000',fill:'#aaa'}}];
 assert.deepEqual(compatibleObjects(objects,'stroke').map(o=>o.id),['a','b']);
 assert.deepEqual(compatibleObjects(objects,'fill').map(o=>o.id),['b']);
 assert.deepEqual(compatibleObjects(objects,'pointSize').map(o=>o.id),['a']);
 assert.equal(commonValue(objects.slice(0,2),'stroke'),'#fff');
 assert.equal(commonValue(objects,'stroke'),null);
});
