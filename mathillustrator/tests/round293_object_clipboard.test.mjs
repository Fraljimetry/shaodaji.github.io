import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,appendPolygonEdges,validateDoc,clone} from '../src/model.mjs';
import {captureObjectSelection,pasteObjectSelection} from '../src/object_clipboard.mjs';

function fixture(){const doc=newDoc();const a=append(doc,{type:'point',xy:[0,0],name:'A'}),b=append(doc,{type:'point',xy:[4,0],name:'B'}),c=append(doc,{type:'point',xy:[1,3],name:'C'});const segment=append(doc,{type:'segment',refs:[a.id,b.id],name:'AB'});return {doc,a,b,c,segment};}
test('copy of segment creates independently moveable anchors and unique names',()=>{
 const {doc,a,b,segment}=fixture();const clip=captureObjectSelection(doc,[segment.id]);
 assert.deepEqual(clip.roots,[segment.id]);assert.equal(clip.objects.length,3);
 const [id]=pasteObjectSelection(doc,clip);const duplicate=doc.objects.find(o=>o.id===id);
 assert.notEqual(id,segment.id);assert.equal(duplicate.type,'segment');
 assert.notDeepEqual(duplicate.refs,segment.refs);
 assert.deepEqual(duplicate.refs.map(id=>doc.objects.find(o=>o.id===id).xy),[[.5,.5],[4.5,.5]]);
 assert.equal(doc.objects.find(o=>o.id===a.id).xy[0],0);
 assert.equal(new Set(doc.objects.map(o=>o.name)).size,doc.objects.length);
 validateDoc(doc);
});
test('multiple selected objects preserve shared parents and derived segments',()=>{
 const {doc,a,b,c,segment}=fixture();const poly=append(doc,{type:'polygon',refs:[a.id,b.id,c.id],name:'ABC'});appendPolygonEdges(doc,poly.id);
 const edge=doc.objects.find(o=>o.edgeOf===poly.id);const clip=captureObjectSelection(doc,[segment.id,poly.id,edge.id]);
 const ids=pasteObjectSelection(doc,clip);assert.equal(ids.length,3);
 const newSeg=doc.objects.find(o=>o.id===ids[0]),newPoly=doc.objects.find(o=>o.id===ids[1]),newEdge=doc.objects.find(o=>o.id===ids[2]);
 assert.deepEqual(newSeg.refs,newPoly.refs.slice(0,2));assert.equal(newEdge.edgeOf,newPoly.id);
 assert.equal(newEdge.refs[0],newPoly.refs[0]);validateDoc(doc);
});
test('copy text node and freehand geometry, preserving original style',()=>{
 const {doc}=fixture();const text=append(doc,{type:'text',xy:[1,2],text:'Label',fontSize:18,style:{stroke:'#123456'}});
 const stroke=append(doc,{type:'freehand',path:[[0,0],[1,2]],rawPath:[[0,0],[1,2]],closed:false});
 const clip=captureObjectSelection(doc,[text.id,stroke.id]);const pasted=pasteObjectSelection(doc,clip,{offset:1});
 const [t,s]=pasted.map(id=>doc.objects.find(o=>o.id===id));
 assert.deepEqual(t.xy,[2,3]);assert.equal(t.style.stroke,'#123456');assert.deepEqual(s.path,[[1,1],[2,3]]);assert.deepEqual(s.rawPath,s.path);validateDoc(doc);
});
test('atomic failure preserves document including ID counter',()=>{
 const {doc,segment}=fixture(),clip=captureObjectSelection(doc,[segment.id]);
 const before=JSON.stringify(doc);clip.objects[1].refs=['missing'];
 assert.throws(()=>pasteObjectSelection(doc,clip));assert.equal(JSON.stringify(doc),before);
 assert.throws(()=>pasteObjectSelection(doc,clip,{offset:Infinity}));assert.equal(JSON.stringify(doc),before);
});
test('clipboard is frozen snapshot independent of subsequent original edits',()=>{
 const {doc,segment,a}=fixture(),clip=captureObjectSelection(doc,[segment.id]);
 doc.objects.find(o=>o.id===a.id).xy=[100,100];const ids=pasteObjectSelection(doc,clip);assert.deepEqual(doc.objects.find(o=>o.id===doc.objects.find(o=>o.id===ids[0]).refs[0]).xy,[.5,.5]);
});
