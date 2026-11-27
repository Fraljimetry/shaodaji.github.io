import test from 'node:test';
import assert from 'node:assert/strict';
import {createDependencyGraph,sliderDependents,effectivelyLocked,lockedObjectIds,usesSlider} from '../src/dependency_graph.mjs';
const objects=[{id:'a',type:'point',xyExpr:['k+1','0']},{id:'b',type:'point'},{id:'p',refs:['a','b']},{id:'e',refs:['a','b'],edgeOf:'p'},{id:'q',refs:['e','b']}];
test('ownership is structural but not a geometric edge',()=>{
 const g=createDependencyGraph(objects);
 assert.deepEqual([...g.descendants(['p'])],['p','e','q']);
 assert.deepEqual(g.dependencyOrder(['q']),['a','b','p','e','q']);
 assert.deepEqual([...createDependencyGraph(objects,{ownership:false}).descendants(['p'])],['p']);
 assert.deepEqual([...g.ancestors(['e'])],['e','a','b','p']);
});
test('iterative traversal detects cycles and missing dependencies, allows explicit external ids',()=>{
 assert.throws(()=>createDependencyGraph([{id:'a',refs:['b']},{id:'b',refs:['a']}]).dependencyOrder(['a']),/Cyclic/);
 const g=createDependencyGraph([{id:'a',refs:['axis']}]);
 assert.throws(()=>g.dependencyOrder(['a']),/Missing/);
 assert.deepEqual(g.dependencyOrder(['a'],{external:id=>id==='axis'}),['a']);
 const chain=Array.from({length:10000},(_,i)=>({id:String(i),refs:i?[String(i-1)]:[]}));
 const deep=createDependencyGraph(chain);assert.equal(deep.dependencyOrder(['9999']).length,10000);assert.equal(deep.descendants(['0']).size,10000);
});
test('slider dependencies and inherited locks agree without matching identifier substrings',()=>{
 const doc={objects:[...objects,{id:'unrelated',type:'function',expr:'kk+k2'}],algebra:{sliders:[{name:'k',locked:true}]}};
 assert.equal(usesSlider(doc.objects.at(-1),'k'),false);
 assert.deepEqual([...sliderDependents(doc,'k')],['a','p','e','q']);
 const locked=lockedObjectIds(doc);for(const o of doc.objects)assert.equal(effectivelyLocked(doc,o.id),locked.has(o.id));
 doc.algebra.sliders[0].locked=false;assert.equal(lockedObjectIds(doc).size,0);
});
test('external locked roots are inherited by reference, without becoming document objects',()=>{
 const doc={objects:[{id:'a',refs:['axis-x']},{id:'b',refs:['a']},{id:'c'}]};
 assert.equal(effectivelyLocked(doc,'b',['axis-x']),true);
 assert.equal(effectivelyLocked(doc,'axis-x',['axis-x']),true);
 assert.equal(effectivelyLocked(doc,'c',['axis-x']),false);
 assert.deepEqual([...lockedObjectIds(doc,['axis-x'])],['axis-x','a','b']);
});
