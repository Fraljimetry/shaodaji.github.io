import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generalCrossings,polylineCrossings,r50Shape,r50SourceShape,circleTangents,pointOnObject,triangleCenter} from '../src/geometry_round50.mjs';

const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Round 55 exports the exact geometry contract required at startup',()=>{
 for (const api of [generalCrossings,polylineCrossings,r50Shape,r50SourceShape,circleTangents,pointOnObject,triangleCenter]) {
  assert.equal(typeof api,'function');
 }
 for (const module of ['../src/app.mjs','../src/model.mjs']) {
  assert.match(read(module),/from ['"]\.\/geometry_round50\.mjs\?cut=round56-direct-only['"]/);
 }
 assert.match(read('../index.html'),/src="\.\/src\/app\.mjs\?cut=round58"/);
});
