import test from 'node:test';
import assert from 'node:assert/strict';
import {translated} from '../src/i18n.mjs';

test('Round 177: empty object and search states translate in both directions',()=>{
 for(const key of ['No objects','No matches']){
  assert.notEqual(translated(key,'zh'),key);
  assert.equal(translated(key,'en'),key);
 }
});

test('Round 177: dynamic construction input accessibility labels translate reversibly',()=>{
 for(const key of ['Function or construction command','3D first component','3D second component','Second component']){
  assert.notEqual(translated(key,'zh'),key,`missing: ${key}`);
  assert.equal(translated(key,'en'),key);
 }
});
