import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc,clone} from '../src/model.mjs';
import {captureObjectSelection,pasteObjectSelection} from '../src/object_clipboard.mjs';
function fixture(){const doc=newDoc(),a=append(doc,{type:'point',name:'A',xy:[0,0]}),b=append(doc,{type:'point',name:'B',xy:[3,2]}),seg=append(doc,{type:'segment',name:'s',refs:[a.id,b.id]});return {doc,a,b,seg};}
test('paste in place duplicates point anchors exactly, sequential pastes offset and preserve names',()=>{
 const {doc,seg}=fixture(),clip=captureObjectSelection(doc,[seg.id]);
 const [id1]=pasteObjectSelection(doc,clip,{offset:0});
 const one=doc.objects.find(o=>o.id===id1);
 assert.deepEqual(one.refs.map(id=>doc.objects.find(o=>o.id===id).xy),[[0,0],[3,2]]);
 const [id2]=pasteObjectSelection(doc,clip,{offset:1});
 const two=doc.objects.find(o=>o.id===id2);
 assert.deepEqual(two.refs.map(id=>doc.objects.find(o=>o.id===id).xy),[[1,1],[4,3]]);
 assert.equal(new Set(doc.objects.map(o=>o.name)).size,doc.objects.length);validateDoc(doc);
});
test('reject external clipboard references even when target already exists and roll back',()=>{
 const {doc,seg,a}=fixture(),clip=captureObjectSelection(doc,[seg.id]);
 const before=JSON.stringify(doc);
 clip.objects=clip.objects.filter(o=>o.id!==a.id);
 assert.throws(()=>pasteObjectSelection(doc,clip),/external dependency/);
 assert.equal(JSON.stringify(doc),before);
});
test('reject unknown clip roots and forward or cyclic dependencies transactionally',()=>{
 const {doc,seg}=fixture(),clip=captureObjectSelection(doc,[seg.id]);
 const before=JSON.stringify(doc),c=clone(clip);c.roots=['o9999'];
 assert.throws(()=>pasteObjectSelection(doc,c),/root/);assert.equal(JSON.stringify(doc),before);
 const unordered=clone(clip);unordered.objects.reverse();
 assert.throws(()=>pasteObjectSelection(doc,unordered),/Unordered/);assert.equal(JSON.stringify(doc),before);
});
test('capture refuses broken source references instead of silently dropping geometry',()=>{
 const {doc,seg}=fixture();doc.objects.find(o=>o.id===seg.id).refs=['o9999'];
 assert.throws(()=>captureObjectSelection(doc,[seg.id]),/Missing clipboard dependency/);
});

test('Algebra constant coordinate expressions offset without losing expression fidelity',()=>{
 const {doc,seg}=fixture();doc.objects[0].xyExpr=['0','0'];doc.objects[1].xyExpr=['3','2'];
 const clip=captureObjectSelection(doc,[seg.id]),[id]=pasteObjectSelection(doc,clip,{offset:0.5});
 const duplicate=doc.objects.find(o=>o.id===id);
 assert.deepEqual(duplicate.refs.map(ref=>doc.objects.find(o=>o.id===ref).xyExpr),[['0.5','0.5'],['3.5','2.5']]);
 validateDoc(doc);
});
test('symbolic coordinate expressions remain unchanged when copied',()=>{
 const {doc,seg}=fixture();doc.objects[0].xyExpr=['1+1','2*2'];doc.objects[0].xy=[2,4];
 const clip=captureObjectSelection(doc,[seg.id]),[id]=pasteObjectSelection(doc,clip,{offset:1});
 const duplicate=doc.objects.find(o=>o.id===id);
 assert.deepEqual(doc.objects.find(o=>o.id===duplicate.refs[0]).xyExpr,['1+1','2*2']);
});
