import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,command,append,validateDoc,clone} from '../src/model.mjs';

function scene(){
 const doc=newDoc();
 for(const cmd of ['A=(0,0)','B=(4,0)','C=(0,3)','O=Circle(A,B)','P=Polygon(A,B,C)','K=ClosedSpline(A,B,C)','E=Bezier(A,B,C,A)'])command(doc,cmd);
 return doc;
}
test('closed curve filling preserves old document defaults and round-trips',()=>{
 const doc=scene(),o=n=>doc.objects.find(x=>x.name===n);
 assert.equal(o('O').style.fillEnabled,undefined);
 assert.equal(o('P').style.fillEnabled,undefined);
 o('O').style.fillEnabled=true;
 o('K').style.fillEnabled=true;
 o('E').closed=true;
 o('E').style.fillEnabled=true;
 o('O').style.linePattern='dashed';
 assert.doesNotThrow(()=>validateDoc(doc));
 const saved=JSON.parse(JSON.stringify(doc));
 assert.deepEqual(validateDoc(saved),saved);
 for(const name of ['O','K','E'])assert.deepEqual(saved.objects.find(x=>x.name===name),o(name));
 const before=clone(doc);o('O').style.fillEnabled='true';
 assert.throws(()=>validateDoc(doc),/fill enabled/i);
 o('O').style.fillEnabled=true;assert.deepEqual(doc,before);
});
test('open objects retain no fill state unless explicitly styled',()=>{
 const doc=scene();const before=clone(doc);validateDoc(doc);
 assert.ok(doc.objects.every(o=>o.style.fillEnabled===undefined));
 assert.deepEqual(doc,before);
});
