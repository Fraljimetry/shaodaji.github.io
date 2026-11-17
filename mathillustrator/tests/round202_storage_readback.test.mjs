import test from 'node:test';
import assert from 'node:assert/strict';
import {compareAndWrite,coordinateSave} from '../src/storage.mjs';

test('Round 202: an acknowledged but discarded write must not report success',()=>{
 let stored='previous';
 const storage={getItem:()=>stored,setItem:()=>undefined};
 assert.throws(()=>compareAndWrite(storage,'project','previous','new project'),/did not retain/);
 assert.equal(stored,'previous');
});
test('Round 202: a successful verified write advances project contents',()=>{
 const bag=new Map([['project','before']]);
 const storage={getItem:key=>bag.get(key)??null,setItem:(key,payload)=>bag.set(key,payload)};
 assert.deepEqual(compareAndWrite(storage,'project','before','after'),{ok:true});
 assert.equal(bag.get('project'),'after');
});
test('Round 202: a delayed writer never overwrites a newer value',async()=>{
 let current='base';
 const storage={getItem:()=>current,setItem:(_,v)=>{current=v;}};
 let release;
 const gate=new Promise(resolve=>{release=resolve});
 const locks={request:async(_name,_options,fn)=>{await gate;return fn();}};
 const pending=coordinateSave(locks,'project',()=>compareAndWrite(storage,'project','base','obsolete'));
 current='newer';release();
 assert.deepEqual(await pending,{ok:false,reason:'conflict'});
 assert.equal(current,'newer');
});
test('Round 202: a repeated identical payload synchronizes stale writers without rewriting',()=>{
 let calls=0;const storage={getItem:()=> 'same',setItem:()=>{calls++;}};
 assert.deepEqual(compareAndWrite(storage,'project','old','same'),{ok:true,alreadyCurrent:true});
 assert.equal(calls,0);
});
