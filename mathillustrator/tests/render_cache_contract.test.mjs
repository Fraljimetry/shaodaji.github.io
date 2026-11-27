import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeightedCache,createPlotArtifactCache,plotArtifactKey} from '../src/plot_cache.mjs';

test('weighted cache bounds even empty entries, promotes hits and accounts for replacement',()=>{
 const c=createWeightedCache({maxEntries:2,maxWeight:5,weight:v=>v.length});
 c.store('a','');c.store('b','12');assert.equal(c.lookup('a'),'');c.store('c','');
 assert.deepEqual([...c.keys()],['a','c']);assert.equal(c.lookup('b'),undefined);
 c.store('a','12345');assert.equal(c.stats().weight,5);c.store('a','1');assert.equal(c.stats().weight,1);
 c.store('d','123456');assert.equal(c.lookup('d'),undefined);c.clear();assert.equal(c.stats().weight,0);
});
test('budget warning metadata follows cached output through hits and eviction',()=>{
 const c=createPlotArtifactCache({maxEntries:2,maxCharacters:10});
 const limited=c.get('a',()=>({content:'',limited:true}));assert.ok(Object.isFrozen(limited));
 c.get('b',()=>({content:'b',limited:false}));
 assert.equal(c.get('a',()=>assert.fail('unexpected recompute')).limited,true);
 c.get('c',()=>({content:'c',limited:false}));
 assert.equal(c.get('b',()=>({content:'new',limited:true})).limited,true);
 assert.equal(c.stats().entries,2);
});
test('sampling key separates raster and screen dependencies from presentation',()=>{
 const p={type:'implicit',expr:'x+y',region:{xMin:-1,xMax:1,yMin:-1,yMax:1},resolution:64,colorMode:'range',colorRange:true};
 const params={a:1},settings={plotQuality:2,plotBudget:80000,implicitGrid:12},view={cx:0,cy:0,scale:48},size={w:800,h:600};
 const key=(o=p,pa=params,se=settings,v=view,sz=size,b=10000)=>plotArtifactKey(o,pa,se,v,sz,b);
 assert.equal(key({...p,name:'new',style:{opacity:.2}}),key());assert.equal(key(p,params,settings,{...view,cx:1}),key());
 for(const change of [{expr:'x-y'},{resolution:65},{colorMode:'sign'},{regionCondition:'x>0'},{region:{...p.region,xMax:2}},{colorRange:false}])assert.notEqual(key({...p,...change}),key());
 assert.notEqual(key(p,{a:2}),key());assert.notEqual(key(p,params,settings,view,size,9999),key());
 const curve={...p,colorRange:false};assert.notEqual(key(curve,params,settings,{...view,cx:1}),key(curve));
 assert.notEqual(key(curve,params,{...settings,plotBudget:1000}),key(curve));assert.notEqual(key(curve,params,settings,view,{...size,w:900}),key(curve));
});

test('weighted cache never retains stale replacements or loses exact weight accounting',()=>{
 const max=Number.MAX_SAFE_INTEGER;
 const c=createWeightedCache({maxEntries:4,maxWeight:max,weight:v=>v});
 c.store('a',max);c.store('b',2);
 assert.deepEqual([...c.keys()],['b']);assert.equal(c.stats().weight,2);
 c.store('b',Infinity);assert.equal(c.lookup('b'),undefined);assert.equal(c.stats().weight,0);
 c.store('c',1);c.store('c',-1);assert.equal(c.lookup('c'),undefined);
 c.store('d',1);c.store('d',max+1);assert.equal(c.lookup('d'),undefined);
});

test('weighted cache stays bounded through repeated replacements and evictions',()=>{
 const c=createWeightedCache({maxEntries:16,maxWeight:100,weight:v=>v});
 const expected=new Map();let seed=42;
 for(let i=0;i<20000;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const key=seed%31,w=(seed>>>8)%125;
  if(i%3===0){const hit=expected.get(key);assert.equal(c.lookup(key),hit);if(hit!==undefined){expected.delete(key);expected.set(key,hit);}}
  else{c.store(key,w);expected.delete(key);if(w<=100){expected.set(key,w);while(expected.size>16||[...expected.values()].reduce((a,b)=>a+b,0)>100)expected.delete(expected.keys().next().value);}}
  assert.deepEqual([...c.keys()],[...expected.keys()]);assert.equal(c.stats().weight,[...expected.values()].reduce((a,b)=>a+b,0));
 }
});
