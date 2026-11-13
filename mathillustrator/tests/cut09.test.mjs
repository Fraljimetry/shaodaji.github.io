import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,append,createResolver} from '../src/model.mjs';
import {tikzGeometryIssue,tikzPoint,TIKZ_COORD_LIMIT} from '../src/export_fidelity.mjs';

test('Cut09: ordinary TikZ geometry remains representable',()=>{
 const d=newDoc();const a=addPoint(d,[0,0],'A'),b=addPoint(d,[3,4],'B');append(d,{type:'segment',refs:[a.id,b.id]});
 assert.equal(tikzGeometryIssue(d),null);
 assert.equal(tikzPoint([3,4]),'(3.00000,4.00000)');
});
test('Cut09: a mathematically valid short segment is not silently collapsed by TikZ rounding',()=>{
 const d=newDoc();const a=addPoint(d,[0,0],'A'),b=addPoint(d,[0.000001,0],'B');append(d,{type:'segment',refs:[a.id,b.id]});
 assert.match(tikzGeometryIssue(d),/collapse/);
});
test('Cut09: hidden unsupported numeric objects do not block TikZ',()=>{
 const d=newDoc();addPoint(d,[TIKZ_COORD_LIMIT+1,0],'Huge').hidden=true;
 assert.equal(tikzGeometryIssue(d),null);
});
test('Cut09: reject out-of-range coordinate, including large diagram nodes',()=>{
 const d=newDoc();addPoint(d,[TIKZ_COORD_LIMIT+1,0],'Huge');
 assert.match(tikzGeometryIssue(d),/range/);
});
test('Cut09: preserve visible normal node and regular polygon constructs',()=>{
 const d=newDoc();const a=addPoint(d,[2,3],'A'),b=addPoint(d,[3,3],'B');append(d,{type:'regularPolygon',refs:[a.id,b.id],sides:6});
 assert.equal(tikzGeometryIssue(d),null);
});
test('Cut09: freehand path with quantized duplicate vertices must be rejected',()=>{
 const d=newDoc();append(d,{type:'freehand',path:[[0,0],[0.000001,0],[1,1]]});
 assert.match(tikzGeometryIssue(d),/collapse/);
});

test('Cut09: skinny rectangle and ellipse cannot collapse one axis while preserving the other',()=>{
 for(const type of ['rectangle','ellipse']){
  const d=newDoc();const a=addPoint(d,[0,0],'A'),b=addPoint(d,[0.000001,10],'B');append(d,{type,refs:[a.id,b.id]});
  assert.match(tikzGeometryIssue(d),/thin/);
 }
});
test('Cut09: zero-opacity oversized geometry is not a visible TeX obstruction',()=>{
 const d=newDoc();const o=addPoint(d,[900,0],'Huge');o.style.opacity=0;
 assert.equal(tikzGeometryIssue(d),null);
});

test('Cut09: negative zero printed by toFixed must not permit a zero-size TeX edge',()=>{
 const d=newDoc();const a=addPoint(d,[0,0],'A'),b=addPoint(d,[-0.000001,0],'B');append(d,{type:'segment',refs:[a.id,b.id]});
 assert.match(tikzGeometryIssue(d),/collapse/);
});
