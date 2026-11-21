import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generalCrossings,polylineCrossings,r50Shape,r50SourceShape,circleTangents,pointOnObject,triangleCenter} from '../src/geometry_round50.mjs';

const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('Round 55 exports the exact geometry contract required at startup',()=>{
 for (const api of [generalCrossings,polylineCrossings,r50Shape,r50SourceShape,circleTangents,pointOnObject,triangleCenter]) {
  assert.equal(typeof api,'function');
 }
 const versions=[];
 for (const module of ['../src/app.mjs','../src/model.mjs']) {
  const match=read(module).match(/from ['"]\.\/geometry_round50\.mjs\?cut=(round\d+)['"]/);
  assert.ok(match,`Missing versioned geometry import in ${module}`);
  versions.push(match[1]);
 }
 assert.equal(versions[0],versions[1],'Editor and resolver must use the same geometry module URL');
 assert.match(read('../index.html'),/src="\.\/src\/app\.mjs\?cut=(?:mi271|mi274|mi275|mi279|round(?:6[3-9]|[7-9]\d|[1-9]\d{2,}))"/);
});
