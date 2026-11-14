import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
test('Round 54 deploy uses one unique version throughout its real import graph',()=>{
 const html=readFileSync(resolve(root,'index.html'),'utf8');
 assert.match(html,/src="\.\/src\/app\.mjs\?cut=round54"/);
 const src=resolve(root,'src');
 let imports=0;
 for(const name of readdirSync(src).filter(n=>n.endsWith('.mjs'))){
  const content=readFileSync(resolve(src,name),'utf8');
  for(const m of content.matchAll(/\b(?:from\s*|import\s*\(\s*)['"](\.[^'"]+\.mjs(?:\?[^'"]*)?)['"]/g)){
   const [pathname,query]=m[1].split('?');
   assert.equal(query,'cut=round54',`${name} imports ${m[1]} using stale module URL`);
   assert.ok(existsSync(resolve(src,pathname)),`${name} imports missing ${pathname}`);
   imports++;
  }
 }
 assert.ok(imports>=30,`Expected complete graph, found ${imports} imports`);
 assert.match(html,/mathillustrator-startup-error/);
});
