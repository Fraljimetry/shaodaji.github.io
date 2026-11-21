import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {displayCoordinate} from '../src/construction_expression.mjs';

test('measurement and slider labels use seven significant digits',()=>{
 const source=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
 assert.match(source,/measurement\.value\.toPrecision\(7\)/);
 assert.doesNotMatch(source,/measurement\.value\.toPrecision\(8\)/);
 assert.equal((source.match(/item\.value\.toPrecision\(7\)/g)||[]).length,3);
 assert.match(source,/live\.value\.toPrecision\(7\)/);
 assert.doesNotMatch(source,/live\.value\.toPrecision\(8\)/);
 for(const value of [2.653164812345,48.3054556789,-4.335416158040364,0,1.2345678e-9]){
  const before=JSON.stringify({value});
  assert.equal(displayCoordinate(value),String(Number(value.toPrecision(7))));
  assert.equal(JSON.stringify({value}),before);
 }
});
