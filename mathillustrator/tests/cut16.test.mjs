import test from 'node:test';
import assert from 'node:assert/strict';
import {compareAndWrite,coordinateSave} from '../src/storage.mjs';

function storage(value=null){let current=value,writes=0;return {getItem:()=>current,setItem:(_key,payload)=>{current=payload;writes++;},get value(){return current;},get writes(){return writes;}};}

test('Cut16: identical snapshot from another writer is an idempotent successful synchronization',()=>{
 const local=storage('SAME');
 const result=compareAndWrite(local,'project','OLD','SAME');
 assert.deepEqual(result,{ok:true,alreadyCurrent:true});
 assert.equal(local.value,'SAME');
 assert.equal(local.writes,0,'idempotence must not generate a redundant storage event');
});

test('Cut16: a genuinely divergent project remains a conflict',()=>{
 const local=storage('OTHER');
 assert.deepEqual(compareAndWrite(local,'project','OLD','MINE'),{ok:false,reason:'conflict'});
 assert.equal(local.value,'OTHER');
 assert.equal(local.writes,0);
});

test('Cut16: identical content survives two queued Web Locks writers without false conflict',async()=>{
 const local=storage(null);
 let tail=Promise.resolve();
 const locks={request:(_name,_opts,fn)=>{const work=tail.then(fn);tail=work.catch(()=>{});return work;}};
 const a=coordinateSave(locks,'project',()=>compareAndWrite(local,'project',null,'SAME'));
 const b=coordinateSave(locks,'project',()=>compareAndWrite(local,'project',null,'SAME'));
 assert.deepEqual(await a,{ok:true});
 assert.deepEqual(await b,{ok:true,alreadyCurrent:true});
 assert.equal(local.writes,1);
});
