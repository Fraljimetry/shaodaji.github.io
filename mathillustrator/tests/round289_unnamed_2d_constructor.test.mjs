import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,validateDoc,createResolver} from '../src/model.mjs';
import {constructionExpression,createSemanticConstruction} from '../src/construction_expression.mjs';
import {createSlider,recalculateAlgebra} from '../src/algebra.mjs';

for(const convention of ['pascal','camel','snake']){
 test(`lowercase unnamed 2D constructors get independent names and stable refs (${convention})`,()=>{
  const d=newDoc();d.settings.namingConvention=convention;
  const a=command(d,'a=(0,0)'),b=command(d,'b=(4,0)'),c=command(d,'c=(0,3)');
  const first=command(d,'segment(a,b)'),second=command(d,'Segment(a,b)');
  const circle=command(d,'circle(a,b)'),midpoint=command(d,'midpoint(a,b)');
  const named=command(d,'s = Segment(b,c)');
  assert.equal(first.type,'segment');assert.equal(second.type,'segment');
  assert.notEqual(first.id,second.id);assert.notEqual(first.name,second.name);
  assert.equal(first.name,`${convention==='pascal'?'Segment':'segment'} 4`);
  assert.equal(second.name,`${convention==='pascal'?'Segment':'segment'} 5`);
  assert.deepEqual(first.refs,[a.id,b.id]);assert.deepEqual(second.refs,[a.id,b.id]);
  assert.deepEqual(circle.refs,[a.id,b.id]);assert.deepEqual(midpoint.refs,[a.id,b.id]);
  assert.equal(named.name,'s');assert.equal(named.type,'segment');
  assert.equal(constructionExpression(d,first),'Segment(a, b)');
  b.xy=[6,0];assert.deepEqual(first.refs.map(id=>createResolver(d).at(id)),[[0,0],[6,0]]);
  validateDoc(d);const saved=JSON.parse(JSON.stringify(d));validateDoc(saved);
  assert.deepEqual(saved.objects.find(o=>o.id===first.id).refs,[a.id,b.id]);
 });
}
test('unnamed and named commands coexist with sliders, semantic constructors, and failed submissions',()=>{
 const d=newDoc();createSlider(d,'t',{min:0,max:5,step:1,value:2});
 const a=command(d,'a=(t,0)'),b=command(d,'b=(0,0)'),c=command(d,'c=(0,2)');
 const seg=command(d,'segment(a,b)'),l=command(d,'L = Line(b,c)');
 const center=createSemanticConstruction(d,'TriangleCenter(a,b,c,centerKind="centroid")');
 assert.ok(seg.name);assert.equal(l.name,'L');assert.ok(center.name);
 const before=JSON.stringify(d);
 for(const invalid of ['segment(a,unknown)','segment(a,a)','L = Segment(a,b)','segment(a)','notacommand(a,b)']){
  const copy=JSON.parse(JSON.stringify(d));assert.throws(()=>command(copy,invalid),invalid);
  assert.equal(JSON.stringify(copy),before,`partial document mutation: ${invalid}`);
 }
 d.algebra.sliders[0].value=3;recalculateAlgebra(d);validateDoc(d);
 assert.deepEqual(createResolver(d).at(a.id),[3,0]);
 assert.deepEqual(createResolver(d).at(center.id),[1,2/3]);
 assert.deepEqual(seg.refs,[a.id,b.id]);
});
