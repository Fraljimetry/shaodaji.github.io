import test from 'node:test';
import assert from 'node:assert/strict';
import {compareAndWrite,coordinateSave} from '../src/storage.mjs';

function bag(initial='original') {
 const map=new Map([['project',initial]]);
 return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),read:()=>map.get('project')};
}
test('Cut15: a stale writer cannot overwrite the storage token',()=>{
 const storage=bag('latest');
 assert.deepEqual(compareAndWrite(storage,'project','older','mine'),{ok:false,reason:'conflict'});
 assert.equal(storage.read(),'latest');
});
test('Cut15: a deferred lock reads the latest document only when granted',async()=>{
 const storage=bag('base');let release;
 const wait=new Promise(resolve=>release=resolve);
 const locks={request:async(name,options,fn)=>{assert.match(name,/mathillustrator-save:project/);assert.equal(options.mode,'exclusive');await wait;return fn();}};
 let current='draft-v1';
 const pending=coordinateSave(locks,'project',()=>compareAndWrite(storage,'project','base',current));
 current='draft-v2';release();
 assert.deepEqual(await pending,{ok:true});
 assert.equal(storage.read(),'draft-v2');
});
test('Cut15: simulated storage denial never replaces the previous snapshot',()=>{
 const storage={getItem:()=> 'safe',setItem:()=>{throw Error('quota denied')}};
 assert.throws(()=>compareAndWrite(storage,'project','safe','unsafe'),/quota denied/);
 assert.equal(storage.getItem('project'),'safe');
});
test('Cut15: no-Web-Locks fallback is explicitly a synchronous best-effort commit',()=>{
 const storage=bag('base');
 assert.deepEqual(coordinateSave(undefined,'project',()=>compareAndWrite(storage,'project','base','updated')),{ok:true});
 assert.equal(storage.read(),'updated');
});
