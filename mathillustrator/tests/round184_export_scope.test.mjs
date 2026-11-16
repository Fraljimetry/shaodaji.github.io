import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('export menu offers exactly the six maintained formats, no legacy placeholders',()=>{
 const block=app.match(/function setupExport\(\)\{[\s\S]*?const opts=(\[[^;]+);/);
 assert.ok(block,'export options are defined inside setupExport');
 const formats=[...block[1].matchAll(/\['([^']+)','([^']+)',/g)].map(m=>m[2]);
 assert.deepEqual(formats,['svg','png','jpeg','webp','tikzcd','json']);
 for(const old of ['TikZ / PGF','PDF','Asymptote','GIF / video']) assert.ok(!block[1].includes(`['${old}'`),old);
});
