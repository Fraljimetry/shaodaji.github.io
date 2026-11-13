/** Release gate: all static named imports must exist in the target module.
 * Regression for the Round 16 missing-export fatal startup incident. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const directory=fileURLToPath(new URL('../src/',import.meta.url));
test('every internal named import resolves to an actual exported symbol',async()=>{
 const files=(await readdir(directory)).filter(name=>name.endsWith('.mjs'));
 let checked=0;
 for(const file of files){
  const source=await readFile(path.join(directory,file),'utf8');
  const regex=/import\s*\{([^}]+)\}\s*from\s*['"](\.\/[^'"]+\.mjs)(?:\?[^'"]*)?['"]/g;
  for(const match of source.matchAll(regex)){
   const url=pathToFileURL(path.join(directory,match[2]));
   const exports=await import(url.href);
   for(const part of match[1].split(',')){
    const symbol=part.trim().split(/\s+as\s+/)[0].trim();
    assert.ok(Object.hasOwn(exports,symbol),`${file} imports missing ${symbol} from ${match[2]}`);checked++;
   }
  }
 }
 assert.ok(checked>45,`Expected substantial module import coverage; found ${checked}`);
});
