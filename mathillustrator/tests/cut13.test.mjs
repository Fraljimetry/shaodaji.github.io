import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,addPoint,command,clone,validateDoc,preserveInheritedPointSizes} from '../src/model.mjs';

test('v1 missing point radius stays stable when new-object default changes',()=>{
 const d=newDoc(),a=addPoint(d,[0,0],'A'),b=addPoint(d,[2,1],'B');
 const m=command(d,'Midpoint(A,B)');
 delete a.style.pointSize;delete m.style.pointSize;
 const old=clone(d);
 validateDoc(d);
 assert.equal(preserveInheritedPointSizes(d),2);
 d.settings.pointSize=14;
 assert.equal(a.style.pointSize,old.settings.pointSize);
 assert.equal(m.style.pointSize,old.settings.pointSize);
 assert.equal(b.style.pointSize,old.settings.pointSize);
 assert.equal(preserveInheritedPointSizes(d),0);
 assert.doesNotThrow(()=>validateDoc(d));
});

test('new projects are not modified by legacy radius migration',()=>{
 const d=newDoc();addPoint(d,[0,0],'A');const before=JSON.stringify(d);
 assert.equal(preserveInheritedPointSizes(d),0);
 assert.equal(JSON.stringify(d),before);
});
