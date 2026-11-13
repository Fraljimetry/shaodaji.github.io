import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc, append, addPoint, automaticName, command, validateDoc, clone} from '../src/model.mjs';

const point=(doc)=>addPoint(doc,[1,2]);

test('new projects use PascalCase object naming; semantic object IDs stay stable',()=>{
 const doc=newDoc();
 assert.equal(doc.settings.namingConvention,'pascal');
 assert.equal(point(doc).name,'Point 1');
 assert.equal(addPoint(doc,[3,4]).name,'Point 2');
 assert.equal(append(doc,{type:'regularPolygon',refs:['o1','o2'],sides:6}).name,'RegularPolygon 3');
 assert.equal(append(doc,{type:'arrow',refs:['o1','o2']}).name,'Vector 4');
 assert.equal(append(doc,{type:'freehand',path:[[0,0],[1,1]]}).name,'Freehand 5');
 assert.deepEqual(doc.objects.map(o=>o.id),['o1','o2','o3','o4','o5']);
 assert.deepEqual(validateDoc(doc),doc);
});

test('switching convention only changes future automatic names and persists in JSON',()=>{
 const doc=newDoc();const first=point(doc);
 doc.settings.namingConvention='camel';const second=addPoint(doc,[3,4]);
 doc.settings.namingConvention='snake';const third=append(doc,{type:'regularPolygon',refs:['o1','o2'],sides:6});
 assert.deepEqual([first.name,second.name,third.name],['Point 1','point 2','regular_polygon 3']);
 const json=JSON.stringify(doc), reloaded=validateDoc(JSON.parse(json));
 assert.equal(reloaded.settings.namingConvention,'snake');
 assert.equal(append(reloaded,{type:'arrow',refs:['o1','o2']}).name,'vector 4');
 assert.equal(first.name,'Point 1','earlier object never renamed');
});

test('legacy project without setting retains camelCase naming and all custom names',()=>{
 const legacy=newDoc();delete legacy.settings.namingConvention;
 const a=point(legacy);a.name='My custom point';
 const b=append(legacy,{type:'freehand',path:[[0,0],[1,1]]});
 assert.equal(b.name,'freehand 2');
 const loaded=validateDoc(JSON.parse(JSON.stringify(legacy)));
 assert.equal(loaded.settings.namingConvention,'camel');
 assert.equal(loaded.objects[0].name,'My custom point');
 assert.equal(append(loaded,{type:'regularPolygon',refs:['o1','o1'],sides:5}).name,'regularPolygon 3');
 assert.equal(loaded.objects[0].id,'o1');
});

test('auto-name collisions reject atomically, including legacy case variants',()=>{
 const doc=newDoc();const custom=addPoint(doc,[0,0],'Point 2');
 const before=JSON.stringify(doc);
 assert.throws(()=>point(doc),/Name already in use/);
 assert.equal(JSON.stringify(doc),before,'failed generated-name collision is atomic');
 assert.equal(custom.name,'Point 2');
 custom.name='Custom';
 assert.equal(point(doc).name,'Point 2','the same nextId is reusable after conflict clears');
 const other=newDoc();addPoint(other,[0,0],'point 2');
 const old=JSON.stringify(other);
 assert.throws(()=>point(other),/Name already in use/,'case-only collision must not cause ambiguous display names');
 assert.equal(JSON.stringify(other),old);
});

test('construction commands preserve explicit user names and downstream reference IDs',()=>{
 const doc=newDoc();command(doc,'A=(0,0)');command(doc,'B=(2,2)');
 const segment=command(doc,'Segment(A,B)');
 assert.deepEqual(doc.objects.map(o=>o.name),['A','B','Segment 3']);
 assert.deepEqual(segment.refs,['o1','o2']);
 assert.equal(validateDoc(doc).objects[2].refs[0],'o1');
});

test('invalid naming setting rejected; legacy absence is accepted only as migration',()=>{
 const doc=newDoc();point(doc);
 for(const invalid of [null,false,42,'PascalCase','',{},'__proto__']){
  const copy=clone(doc);copy.settings.namingConvention=invalid;
  assert.throws(()=>validateDoc(copy),/Invalid object naming convention/);
  assert.deepEqual(doc.objects.map(o=>o.name),['Point 1']);
 }
 const copy=clone(doc);delete copy.settings.namingConvention;
 assert.equal(validateDoc(copy).settings.namingConvention,'camel');
 assert.equal(automaticName(copy,'point'),'point 2');
});
