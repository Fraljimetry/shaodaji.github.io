import test from 'node:test';
import assert from 'node:assert/strict';
import {newDoc,validateDoc} from '../src/model.mjs';

test('Cut18: fresh document uses opaque image exports by default',()=>{
 const d=newDoc();
 assert.equal(d.settings.exportTransparent,false);
 assert.equal(validateDoc(d).settings.exportTransparent,false);
});
test('Cut18: older v1 JSON without exportTransparent migrates in memory without altering source',()=>{
 const old=newDoc();delete old.settings.exportTransparent;
 const result=validateDoc(old);
 assert.equal(result.settings.exportTransparent,false);
 assert.equal(Object.hasOwn(old.settings,'exportTransparent'),false);
});
test('Cut18: transparency is only a strict boolean, never truthy coercion',()=>{
 for(const value of ['true',1,null,[],{}]){
  const d=newDoc();d.settings.exportTransparent=value;
  assert.throws(()=>validateDoc(d),/transparen/i);
 }
 for(const value of [true,false]){
  const d=newDoc();d.settings.exportTransparent=value;
  assert.equal(validateDoc(d).settings.exportTransparent,value);
 }
});
