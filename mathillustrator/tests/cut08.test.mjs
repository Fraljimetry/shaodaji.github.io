import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc, addPoint, append, clone, validateDoc, guardAnchorMove, roundSnap, createResolver} from '../src/model.mjs';

function scene(){const d=newDoc(),a=addPoint(d,[0,0],'A'),b=addPoint(d,[2,0],'B');return {d,a,b};}

test('extreme snap interval must not overflow normal coordinates',()=>{
 const d=newDoc();d.settings.snapStep=1e-320;
 assert.throws(()=>validateDoc(d),/snap interval/i);
 assert.throws(()=>roundSnap(5,{snap:true,snapStep:1e-320}),/snap interval/i);
});
test('names and labels reject XML 1.0 illegal code points without silent substitution',()=>{
 for(const invalid of ['Bad\u0000Name','Lone\ud800Surrogate','Bad\u000bControl']){
  const d=newDoc();addPoint(d,[1,2],invalid);assert.throws(()=>validateDoc(d),/XML|character/i);
  const textdoc=newDoc();append(textdoc,{type:'text',xy:[0,0],text:invalid});assert.throws(()=>validateDoc(textdoc),/XML|character/i);
 }
 const valid=newDoc();append(valid,{type:'text',xy:[0,0],text:'α & β ∫ 😀'});assert.doesNotThrow(()=>validateDoc(valid));
});
test('anchor motion may not create a newly collapsed segment or circle',()=>{
 const {d,a,b}=scene();append(d,{type:'segment',refs:[a.id,b.id]});const old=clone(d);b.xy=[0,0];
 assert.throws(()=>guardAnchorMove(old,d,b.id),/collapse/i);
 b.xy=[1,0];assert.doesNotThrow(()=>guardAnchorMove(old,d,b.id));
 const more=scene();append(more.d,{type:'circle',refs:[more.a.id,more.b.id]});const before=clone(more.d);more.b.xy=[0,0];assert.throws(()=>guardAnchorMove(before,more.d,more.b.id),/collapse/i);
});
test('movement rejects degenerate rectangle and coalescing morphism endpoints',()=>{
 const {d,a,b}=scene();b.xy=[2,3];append(d,{type:'rectangle',refs:[a.id,b.id]});const old=clone(d);b.xy=[0,3];assert.throws(()=>guardAnchorMove(old,d,b.id),/collapse/i);
 const nodes=newDoc();const n=append(nodes,{type:'node',xy:[0,0],text:'A'}),m=append(nodes,{type:'node',xy:[1,1],text:'B'});append(nodes,{type:'morphism',refs:[n.id,m.id],text:'f',bend:0});const earlier=clone(nodes);m.xy=[0,0];assert.throws(()=>guardAnchorMove(earlier,nodes,m.id),/collapse/i);
});
test('legacy degenerate shapes remain importable, movement unrelated to them stays permitted',()=>{
 const {d,a,b}=scene();b.xy=[0,0];append(d,{type:'segment',refs:[a.id,b.id]});const c=addPoint(d,[4,4],'C');const old=clone(validateDoc(d));c.xy=[5,5];assert.doesNotThrow(()=>guardAnchorMove(old,d,c.id));
 const degenerateOld=clone(d);b.xy=[0,0];assert.doesNotThrow(()=>guardAnchorMove(degenerateOld,d,b.id));
});
test('diamond midpoint dependencies still resolve when an anchor is moved',()=>{
 const {d,a,b}=scene();const m1=append(d,{type:'midpoint',refs:[a.id,b.id]});const m2=append(d,{type:'midpoint',refs:[m1.id,b.id]});append(d,{type:'segment',refs:[m1.id,m2.id]});const old=clone(d);b.xy=[4,2];assert.doesNotThrow(()=>guardAnchorMove(old,d,b.id));assert.deepEqual(createResolver(d).at(m1.id),[2,1]);
});
