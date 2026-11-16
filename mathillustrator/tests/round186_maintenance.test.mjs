import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlotCache} from '../src/plot_cache.mjs';
import {readFileSync} from 'node:fs';

test('plot cache rejects invalid budgets before touching its eviction path',()=>{
 for(const invalid of [-1,-0.5,Number.NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){
  assert.throws(()=>createPlotCache({maxEntries:invalid}),RangeError);
  assert.throws(()=>createPlotCache({maxCharacters:invalid}),RangeError);
 }
});
test('zero budgets are valid, compute without retaining data or crashing',()=>{
 for(const settings of [{maxEntries:0},{maxCharacters:0}]){
  const cache=createPlotCache(settings);let calls=0;
  for(let i=0;i<3;i++)assert.equal(cache.get('same',()=>{calls++;return 'M 0 0';}),'M 0 0');
  assert.equal(calls,3);
  assert.deepEqual(cache.stats(),{entries:0,characters:0,hits:0,misses:3});
 }
});
test('tutorial test fixture is standalone and app Help remains available',()=>{
 const source=readFileSync(new URL('./round183_tutorial_navigation.test.mjs',import.meta.url),'utf8');
 assert.match(source,/existsSync\(toolsPath\)/);
 const editor=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(editor,/id="help"/);
});
