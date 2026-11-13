import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,validateDoc,createResolver,parseExpression} from '../src/model.mjs';
import {compareAndWrite,coordinateSave} from '../src/storage.mjs';

class FakeLocks {
 #previous = Promise.resolve();
 request(name, options, action) {
  assert.equal(name,'mathillustrator-save:mathillustrator-project-v1');
  assert.deepEqual(options,{mode:'exclusive'});
  const pending=this.#previous.then(action);
  this.#previous=pending.catch(()=>{});
  return pending;
 }
}

function storage(initial=null){
 let value=initial;
 return {getItem:()=>value,setItem:(_key,text)=>{value=text;},get value(){return value;}};
}

test('exclusive storage requests serialize two stale writers; second must report conflict',async()=>{
 const locks=new FakeLocks(),local=storage(),key='mathillustrator-project-v1';
 const a=coordinateSave(locks,key,()=>compareAndWrite(local,key,null,'A'));
 const b=coordinateSave(locks,key,()=>compareAndWrite(local,key,null,'B'));
 assert.deepEqual(await a,{ok:true});
 assert.deepEqual(await b,{ok:false,reason:'conflict'});
 assert.equal(local.value,'A');
});

test('queued save re-reads mutable state and does not write stale document after a load',async()=>{
 const locks=new FakeLocks(),local=storage(),key='mathillustrator-project-v1';
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const blocking=coordinateSave(locks,key,()=>gate);
 let dirty=true,doc='STALE',expected=null;
 const queued=coordinateSave(locks,key,()=>dirty?compareAndWrite(local,key,expected,doc):false);
 dirty=false;doc='NEW';expected='NEW';local.setItem(key,'NEW');release();
 await blocking;assert.equal(await queued,false);assert.equal(local.value,'NEW');
});

test('unavailable locks keep synchronous compare-and-write, with conflict detection',()=>{
 const local=storage('old'),key='mathillustrator-project-v1';
 assert.deepEqual(coordinateSave(null,key,()=>compareAndWrite(local,key,'old','first')),{ok:true});
 assert.deepEqual(coordinateSave(null,key,()=>compareAndWrite(local,key,'old','second')),{ok:false,reason:'conflict'});
 assert.equal(local.value,'first');
});

test('storage denial is explicit, not reported as a successful write',()=>{
 const broken={getItem:()=>null,setItem:()=>{throw Error('quota blocked');}};
 assert.throws(()=>compareAndWrite(broken,'k',null,'new'),/quota blocked/);
});

test('forged page-only export on infinite canvas is rejected; old valid v1 loads',()=>{
 const old=newDoc();delete old.settings.exportRegion;delete old.settings.exportScale;delete old.settings.exportGuides;
 assert.equal(validateDoc(old).settings.exportRegion,'viewport');
 const invalid=newDoc();invalid.settings.exportRegion='page';
 assert.throws(()=>validateDoc(invalid),/Page-only export requires/);
 invalid.settings.page='a4';assert.equal(validateDoc(invalid).settings.exportRegion,'page');
});

test('shared midpoint DAG remains live after input moves and validation',()=>{
 const d=newDoc(),a=addPoint(d,[0,0]),b=addPoint(d,[8,0]);
 const m=append(d,{type:'midpoint',refs:[a.id,b.id]});
 const left=append(d,{type:'midpoint',refs:[a.id,m.id]});
 const right=append(d,{type:'midpoint',refs:[b.id,m.id]});
 const end=append(d,{type:'midpoint',refs:[left.id,right.id]});
 assert.deepEqual(createResolver(validateDoc(d)).at(end.id),[4,0]);
 a.xy=[2,0];assert.deepEqual(createResolver(validateDoc(d)).at(end.id),[5,0]);
});

test('bounded arithmetic parser rejects exponential malformed input without running code',()=>{
 assert.equal(parseExpression('2^3^2')(0),512);
 for(const source of ['x**2','foo(x)','x.constructor','1/0 + evil','x + {2}']){
  assert.throws(()=>parseExpression(source),undefined,source);
 }
});
