import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAlgebra,createSlider,algebraPoint,recalculateAlgebra} from '../src/algebra.mjs';
import {newDoc,append,createResolver,validateDoc} from '../src/model.mjs';

test('slider arithmetic, functions and malicious expressions remain finite and isolated',()=>{
 assert.ok(Math.abs(evaluateAlgebra('2*cos(pi/3)+phi')-(1+(1+Math.sqrt(5))/2))<1e-12);
 assert.equal(evaluateAlgebra('2^3^2'),512);
 for(const source of ['window.location','constructor(1)','process.exit()','1/0','sqrt(-1)','unknown','1;alert(1)','sin()','pow(1)','1e999'])assert.throws(()=>evaluateAlgebra(source,{}),source);
});
test('slider updates all dependent geometry without changing references or document schema',()=>{
 const doc=newDoc();createSlider(doc,'a',{min:1,max:10,step:.5,value:2,xy:[1,2]});
 const A=algebraPoint(doc,'A','a*cos(0)','a*sin(pi/2)',(d,xy,name)=>append(d,{type:'point',xy,name}));
 const B=append(doc,{type:'point',name:'B',xy:[0,0]});
 const segment=append(doc,{type:'segment',refs:[A.id,B.id]});
 assert.deepEqual(createResolver(doc).at(A.id),[2,2]);
 doc.algebra.sliders[0].value=4;recalculateAlgebra(doc);
 assert.deepEqual(createResolver(doc).at(A.id),[4,4]);
 assert.deepEqual(segment.refs,[A.id,B.id]);
 assert.deepEqual(validateDoc(JSON.parse(JSON.stringify(doc))),doc);
});
test('unknown parameters and damaged JSON are rejected, old documents remain readable',()=>{
 const doc=newDoc();assert.deepEqual(validateDoc(doc),doc);
 createSlider(doc,'r',{min:0,max:5,step:.25,value:2,visible:false});
 assert.throws(()=>createSlider(doc,'r'),/already in use/);
 const p=algebraPoint(doc,'P','r','1',(d,xy,name)=>append(d,{type:'point',xy,name}));
 doc.algebra.sliders[0].value=4;assert.throws(()=>validateDoc(doc),/Stale expression/);
 recalculateAlgebra(doc);assert.equal(validateDoc(doc).objects.find(o=>o.id===p.id).xy[0],4);
 const bad=JSON.parse(JSON.stringify(doc));bad.algebra.sliders[0].step=0;assert.throws(()=>validateDoc(bad),/Invalid slider/);
 bad.algebra.sliders[0].step=1;bad.objects[0].xyExpr=['unknown','1'];assert.throws(()=>validateDoc(bad),/Undefined parameter/);
});
