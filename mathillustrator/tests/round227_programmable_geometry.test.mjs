import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,createResolver,validateDoc} from '../src/model.mjs';
import {createSlider,recalculateAlgebra} from '../src/algebra.mjs';

test('2D algebra constructions share the legacy model and live slider references',()=>{
 const doc=newDoc();createSlider(doc,'a',{min:.5,max:5,step:.5,value:2});
 command(doc,'A = (0, 0)');command(doc,'B = (2, 0)');
 const segment=command(doc,'Segment(A,B)');
 const length=command(doc,'FixedLength(A,B,a)');
 const angle=command(doc,'FixedAngle(A,B,pi/a)');
 const rotate=command(doc,'Rotate(B,A,a/2)');
 const dilate=command(doc,'Dilate(B,A,a)');
 assert.equal(segment.type,'segment');assert.equal(length.length,2);
 assert.equal(angle.angle,Math.PI/2);assert.equal(rotate.amount,1);assert.equal(dilate.amount,2);
 const C=command(doc,'C = (a, a)');assert.deepEqual(createResolver(doc).at(C.id),[2,2]);
 validateDoc(doc);
 doc.algebra.sliders[0].value=4;recalculateAlgebra(doc);validateDoc(doc);
 assert.equal(length.length,4);assert.equal(angle.angle,Math.PI/4);
 assert.equal(rotate.amount,2);assert.equal(dilate.amount,4);
 const restored=JSON.parse(JSON.stringify(doc));validateDoc(restored);
 assert.deepEqual(restored.objects.find(o=>o.id===length.id).measureExpr,{length:'a'});
});
test('malformed, stale, and invalid programmable measurements reject without silently normalizing',()=>{
 const doc=newDoc();createSlider(doc,'a',{min:0,max:5,step:.5,value:1});
 command(doc,'A = (0, 0)');command(doc,'B = (1, 0)');
 for(const bad of ['FixedLength(A,B,0)','FixedLength(A,B,missing)','FixedAngle(A,B,7)','Dilate(B,A,0)','Rotate(B,A,process.exit())','Rotate(A,Unknown,a)'])assert.throws(()=>command(JSON.parse(JSON.stringify(doc)),bad),bad);
 const length=command(doc,'FixedLength(A,B,a)');
 const altered=JSON.parse(JSON.stringify(doc));altered.objects.find(o=>o.id===length.id).length=4;
 assert.throws(()=>validateDoc(altered),/stale measurement/);
 doc.algebra.sliders[0].value=0;recalculateAlgebra(doc);
 assert.throws(()=>validateDoc(doc),/Invalid fixed length|measurement/);
});
test('2D constructors share live point references and existing primitive validity rules',()=>{
 const d=newDoc();createSlider(d,'s',{min:1,max:4,step:.5,value:2});
 const A=command(d,'A=(0,0)'),B=command(d,'B=(s,0)'),C=command(d,'C=(0,s)'),D=command(d,'D=(s,s)');
 const entries=['Vector(A,B)','Ray(A,B)','PerpendicularBisector(A,B)','Circle(A,B)',
 'CircleThrough3(A,B,C)','Triangle(A,B,C)','Quadrilateral(A,B,D,C)',
 'Spline(A,B,D,C)','ClosedSpline(A,B,D,C)','CircularArc(A,B,C)',
 'Hyperbola(A,B,C)','Polyline(A,B,C)','Bezier(A,B,D,C)'];
 for(const text of entries){const result=command(d,text);assert.ok(result?.id,text);}
 assert.equal(d.objects.find(o=>o.type==='spline'&&o.closed)?.refs.length,4);
 assert.equal(d.objects.filter(o=>o.edgeOf!==undefined).length,7);
 validateDoc(d);
 d.algebra.sliders[0].value=3;recalculateAlgebra(d);validateDoc(d);
 assert.deepEqual(createResolver(d).at(B.id),[3,0]);
 assert.deepEqual(createResolver(d).at(C.id),[0,3]);
 for(const text of ['CircleThrough3(A,B,B)','ClosedSpline(A,B,B)','Triangle(A,B,B)','Ray(A,A)']){
  assert.throws(()=>command(JSON.parse(JSON.stringify(d)),text),text);
 }
});
