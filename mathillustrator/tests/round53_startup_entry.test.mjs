import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('published HTML imports the updated entry module rather than an old cached revision',()=>{
 assert.match(html, /src="\.\/src\/app\.mjs\?cut=round56-direct-only"/);
 assert.doesNotMatch(html, /src="\.\/src\/app\.mjs\?cut=round51u/);
 assert.match(app, /function initialise\(\)/);
 assert.match(app, /populateTools\(\);setupSettings\(\);setupInterface\(\)/);
});
