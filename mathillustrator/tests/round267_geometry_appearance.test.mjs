import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,validateDoc,clone} from '../src/model.mjs';

const sample=()=>{
 const d=newDoc();command(d,'A = (0,0)');command(d,'B = (3,0)');
 command(d,'S = Segment(A,B)');command(d,'C = Circle(A,B)');
 command(d,'f(x) = sin(x)');return d;
};
test('point shapes and geometric line patterns survive JSON round-trip',()=>{
 const doc=sample();const byName=n=>doc.objects.find(o=>o.name===n);
 byName('A').style.pointShape='empty';
 byName('B').style.pointShape='cross';
 byName('S').style.linePattern='dashed';
 byName('C').style.linePattern='dotted';
 byName('f').style.linePattern='dashed';
 validateDoc(doc);
 const saved=JSON.parse(JSON.stringify(doc));validateDoc(saved);
 for(const object of doc.objects)assert.deepEqual(saved.objects.find(o=>o.id===object.id),object);
});
test('invalid point style, illegal line pattern, and wrong role fail without mutating data',()=>{
 const doc=sample();const before=clone(doc);
 const point=doc.objects.find(o=>o.name==='A');const line=doc.objects.find(o=>o.name==='S');
 point.style.pointShape='star';assert.throws(()=>validateDoc(doc),/Invalid point style/);delete point.style.pointShape;
 point.style.linePattern='dotted';assert.throws(()=>validateDoc(doc),/Invalid line style/);delete point.style.linePattern;
 line.style.pointShape='cross';assert.throws(()=>validateDoc(doc),/Invalid point style/);delete line.style.pointShape;
 line.style.linePattern='invalid';assert.throws(()=>validateDoc(doc),/Invalid line style/);delete line.style.linePattern;
 assert.deepEqual(doc,before);validateDoc(doc);
});
test('legacy geometry without new styling fields remains valid',()=>{
 const doc=sample();const legacy=JSON.parse(JSON.stringify(doc));
 assert.ok(legacy.objects.every(o=>o.style.linePattern===undefined&&o.style.pointShape===undefined));
 validateDoc(legacy);
});
