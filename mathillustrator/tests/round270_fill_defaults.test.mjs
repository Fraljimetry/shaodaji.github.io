import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,append,validateDoc,DEFAULT_FILL_TYPES,defaultFillForType} from '../src/model.mjs';

test('new fill defaults apply only to subsequently created objects of selected type',()=>{
 const doc=newDoc();
 const a=append(doc,{type:'point',xy:[0,0]});
 const b=append(doc,{type:'point',xy:[2,0]});
 const before=append(doc,{type:'circle',refs:[a.id,b.id]});
 assert.equal(before.style.fillEnabled,undefined);
 assert.equal(defaultFillForType(doc.settings,'circle'),false);
 doc.settings.fillByType.circle=true;
 const after=append(doc,{type:'circle',refs:[a.id,b.id]});
 assert.equal(before.style.fillEnabled,undefined);
 assert.equal(after.style.fillEnabled,true);
 assert.equal(append(doc,{type:'segment',refs:[a.id,b.id]}).style.fillEnabled,undefined);
 assert.equal(append(doc,{type:'ellipse',refs:[a.id,b.id]}).style.fillEnabled,undefined);
 assert.equal(validateDoc(doc).objects.length,6);
});

test('fill defaults survive JSON and reject unsupported type flags',()=>{
 const doc=newDoc(); doc.settings.fillByType={spline:true,polygon:false};
 assert.equal(defaultFillForType(doc.settings,'spline'),true);
 assert.equal(defaultFillForType(doc.settings,'polygon'),false);
 assert.equal(defaultFillForType(doc.settings,'rectangle'),true);
 const restored=validateDoc(JSON.parse(JSON.stringify(doc)));
 assert.deepEqual(restored.settings.fillByType,doc.settings.fillByType);
 restored.settings.fillByType.segment=true;
 assert.throws(()=>validateDoc(restored),/fill types/);
});
