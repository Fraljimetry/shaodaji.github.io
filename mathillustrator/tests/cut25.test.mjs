import test from 'node:test';
import assert from 'node:assert/strict';
import {routeDiagramEdge,properPolylineCrossings} from '../src/diagram_routing.mjs';
import {optimizeGlobalArrowRoutes} from '../src/diagram_global_routing.mjs';
import {newDoc,append,validateDoc} from '../src/model.mjs';
const box={width:36,height:24};
const a=[-100,-100], b=[100,100], c=[-100,100], d=[100,-100];
const entry=(id,start,end,mode='direct')=>({id,a:start,b:end,fromBox:box,toBox:box,obstacles:[],mode});
const seed=entries=>new Map(entries.map(e=>[e.id,routeDiagramEdge(e.a,e.b,box,box,[], 'direct')]));
test('Cut25 opt-in scene-aware routing can avoid a later fixed arrow without altering it',()=>{
 const edges=[entry('first',a,b,'scene-crossings'),entry('second',c,d,'direct')],initial=seed(edges),original=JSON.stringify([...initial]);
 assert.equal(properPolylineCrossings(initial.get('first').points,[initial.get('second').points]),1);
 const result=optimizeGlobalArrowRoutes(edges,initial);
 assert.equal(properPolylineCrossings(result.get('first').points,[result.get('second').points]),0,JSON.stringify(result.get('first')));
 assert.deepEqual(result.get('second'),initial.get('second'));
 assert.equal(JSON.stringify([...initial]),original,'input routes mutated');
 assert.deepEqual(optimizeGlobalArrowRoutes(edges,initial),result,'layout must be deterministic');
});
test('Cut25 disabled global mode leaves historical routes untouched',()=>{
 const edges=[entry('first',a,b,'avoid-crossings'),entry('second',c,d,'direct')];
 const initial=seed(edges);assert.deepEqual(optimizeGlobalArrowRoutes(edges,initial),initial);
});
test('Cut25 49 visible arrows trigger bounded visible warning, no geometry deletion',()=>{
 const edges=Array.from({length:49},(_,i)=>entry('e'+i,[i*2,0],[i*2,70],i===0?'scene-crossings':'direct'));
 const initial=seed(edges),out=optimizeGlobalArrowRoutes(edges,initial);
 assert.equal(out.get('e0').status,'capacity');
 assert.deepEqual(out.get('e0').points,initial.get('e0').points);
 assert.equal(out.size,49);
});
test('Cut25 opt-in mode persists within JSON v1 but is morphism-only',()=>{
 const doc=newDoc(),n1=append(doc,{type:'node',xy:[0,0],text:'a'}),n2=append(doc,{type:'node',xy:[2,2],text:'b'});
 const arrow=append(doc,{type:'morphism',refs:[n1.id,n2.id],routing:'scene-crossings',text:'f'});
 assert.equal(validateDoc(doc).objects.at(-1).routing,'scene-crossings');
 n1.routing='scene-crossings';assert.throws(()=>validateDoc(doc),/Invalid morphism routing mode/);
 delete n1.routing;arrow.routing='other';assert.throws(()=>validateDoc(doc),/Invalid morphism routing mode/);
});
test('Cut25 stale prior routes and invalid geometry fail safe with visible capacity',()=>{
 const edges=[entry('first',a,b,'scene-crossings'),entry('second',c,d,'direct')],initial=seed(edges);
 const invalid=edges.map(e=>({...e}));invalid[0].obstacles=[{left:NaN,right:0,top:0,bottom:1}];
 const out=optimizeGlobalArrowRoutes(invalid,initial);
 assert.equal(out.get('first').status,'capacity');
});

test('Cut25 a historical overlapping semantic arrow does not disable usable routing',()=>{
 const edges=[entry('first',a,b,'scene-crossings'),entry('second',c,d,'direct'),entry('old',[0,0],[0,0],'direct')];
 const initial=seed(edges);initial.set('old',{status:'overlap',points:[]});
 const out=optimizeGlobalArrowRoutes(edges,initial);
 assert.equal(out.get('old').status,'overlap');
 assert.equal(properPolylineCrossings(out.get('first').points,[out.get('second').points]),0);
});
test('Cut25 visual-conflict detection counts collinear overlaps and T-junctions, not mere shared endpoints',async()=>{
 const {polylineVisualConflicts}=await import('../src/diagram_routing.mjs');
 assert.equal(polylineVisualConflicts([[0,0],[100,0]],[[[30,0],[90,0]]]),1);
 assert.equal(polylineVisualConflicts([[0,0],[100,0]],[[[50,-30],[50,0]]]),1);
 assert.equal(polylineVisualConflicts([[0,0],[100,0]],[[[100,0],[200,0]]]),0);
 assert.equal(polylineVisualConflicts([[0,0],[100,0]],[[[0,0],[0,100]]]),0);
});

test('Cut25 scene-aware mode resolves a duplicate collinear edge or marks it unresolved',()=>{
 const edges=[entry('first',a,b,'scene-crossings'),entry('second',a,b,'direct')];
 const initial=seed(edges),out=optimizeGlobalArrowRoutes(edges,initial);
 assert.deepEqual(out.get('second'),initial.get('second'));
 const {status}=out.get('first');
 assert.ok(['routed','crossing','capacity'].includes(status),status);
 if(status==='routed')assert.notDeepEqual(out.get('first').points,out.get('second').points);
});
