import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translated,translatedGeneratedPlotName} from '../src/i18n.mjs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
const keys=JSON.parse(readFileSync(new URL('./round201_translation_keys.json',import.meta.url),'utf8'));
test('Round 201: each reviewed recovery, error and interaction string has a Chinese translation and English roundtrip',()=>{
 for(const key of keys){assert.notEqual(translated(key,'zh'),key,`untranslated: ${key}`);assert.equal(translated(key,'en'),key);}
});
test('Round 201: all current tool instructions are localized, not just menu labels',()=>{
 const block=app.match(/const toolInstructions=\{([\s\S]*?)\};/);
 assert.ok(block,'tool instructions should remain auditable');
 const strings=[...block[1].matchAll(/:\s*'([^']*(?:\\'[^']*)*)'/g)].map(m=>m[1]);
 assert.ok(strings.length>=35,`expected tool instruction coverage, found ${strings.length}`);
 for(const english of strings)assert.notEqual(translated(english,'zh'),english,`untranslated tool hint: ${english}`);
});
test('Round 201: status variants and user content remain stable when switching language',()=>{
 for(const message of ['Grid snapping temporarily enabled for diagram editing.','Grid snapping restored to your saved setting.','Undo','Save coordination failed · download JSON']){
  assert.notEqual(translated(message,'zh'),message);
  assert.equal(translated(message,'en'),message);
 }
 for(const value of ['sin(x)',String.raw`\\alpha`, 'Student-created Surface 5','x^2+y^2=1'])assert.equal(translated(value,'zh'),value);
 assert.equal(translatedGeneratedPlotName('Surface 5','surface3d','zh'),'曲面 5');
 assert.equal(translatedGeneratedPlotName('Student-created Surface 5','surface3d','zh'),'Student-created Surface 5');
});
