import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentHistory,commitDocumentChange} from '../src/document_history.mjs';
const parse=JSON.parse;
test('paired history restores document and trash through repeated undo/redo without aliases',()=>{
 const h=createDocumentHistory(),trash=[{name:'old'}];h.record('1',trash);trash[0].name='new';h.record('2',trash);
 const a=h.undo('3',[],parse);assert.deepEqual(a,{document:2,trash:[{name:'new'}]});
 const b=h.undo('2',a.trash,parse);assert.deepEqual(b,{document:1,trash:[{name:'old'}]});
 const c=h.redo('1',b.trash,parse);assert.deepEqual(c,a);c.trash[0].name='changed';
 assert.deepEqual(h.redo('2',c.trash,parse),{document:3,trash:[]});assert.equal(h.canRedo,false);
});
test('failed restoration leaves both history stacks intact; branch clears redo',()=>{
 const h=createDocumentHistory();h.record('1',[]);assert.throws(()=>h.undo('2',[],()=>{throw Error('invalid');}),/invalid/);assert.equal(h.canUndo,true);assert.equal(h.canRedo,false);
 assert.equal(h.undo('2',[],parse).document,1);assert.equal(h.canRedo,true);h.record('1',[]);assert.equal(h.canRedo,false);h.clear();assert.equal(h.canUndo,false);
});
test('history limits preserve paired entries and retain one oversized snapshot',()=>{
 const h=createDocumentHistory({maxEntries:2,maxBytes:6});h.record('1',[1]);h.record('2',[2]);assert.equal(h.record('3333',[3]),true);assert.deepEqual(h.undo('4',[],parse),{document:3333,trash:[3]});assert.equal(h.canUndo,false);
});
test('shared commit skips absent and unchanged boundaries',()=>{
 const commits=[];for(const before of [null,undefined,'2'])assert.equal(commitDocumentChange(before,'2',x=>commits.push(x)),false);
 assert.equal(commitDocumentChange('1','2',x=>commits.push(x)),true);assert.deepEqual(commits,['1']);
});

test('history budget includes serialized trash and bounds both undo and redo stacks',()=>{
 const h=createDocumentHistory({maxBytes:40});
 h.record('1',['123456789']);assert.equal(h.record('2',['123456789']),true);
 assert.deepEqual(h.undo('3',[],parse),{document:2,trash:['123456789']});assert.equal(h.canUndo,false);
 assert.equal(h.redo('2',[],parse).document,3);h.clear();
 h.record('1',[]);h.record('2',[]);h.undo('3',['x'.repeat(100)],parse);
 assert.equal(h.canUndo,false);assert.equal(h.canRedo,true);
 assert.deepEqual(h.redo('2',[],parse),{document:3,trash:['x'.repeat(100)]});
 h.clear();h.record('4',[]);assert.equal(h.record('5',[]),false);
});
