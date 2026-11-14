import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,command,validateDoc,createResolver} from '../src/model.mjs';

test('MI-RECT-071: rectangle command creates live two-anchor rectangle',()=>{
 const doc=newDoc();addPoint(doc,[0,0],'A');addPoint(doc,[3,2],'B');
 const rect=command(doc,'Rectangle(A,B)');
 assert.equal(rect.type,'rectangle'); assert.equal(rect.refs.length,2);
 doc.objects.find(x=>x.name==='B').xy=[5,4];
 assert.deepEqual(createResolver(doc).points(rect),[[0,0],[5,4]]);
 assert.equal(validateDoc(doc).objects.at(-1).type,'rectangle');
});
test('MI-RECT-072: rectangle with collapsed anchor is rejected without mutation',()=>{
 const doc=newDoc();addPoint(doc,[1,1],'A');addPoint(doc,[1,1],'B');const old=JSON.stringify(doc);
 assert.throws(()=>command(doc,'Rectangle(A,B)'),/Rectangle requires/);
 assert.equal(JSON.stringify(doc),old);
});
test('MI-RECT-073: historical polygon rectangles remain valid',()=>{
 const doc=newDoc();for(const [name,xy] of [['A',[0,0]],['B',[2,0]],['C',[2,1]],['D',[0,1]]])addPoint(doc,xy,name);
 const polygon=command(doc,'Polygon(A,B,C,D)');assert.equal(validateDoc(doc).objects.find(o=>o.id===polygon.id).type,'polygon');assert.equal(doc.objects.filter(o=>o.edgeOf===polygon.id).length,4);
});
