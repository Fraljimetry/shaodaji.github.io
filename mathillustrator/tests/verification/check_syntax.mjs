#!/usr/bin/env node
/** Syntax check every shipped source module without relying on import paths. */
import {readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
let count=0,errors=[];
for(const name of readdirSync(resolve(root,'src')).filter(n=>n.endsWith('.mjs'))){
 count++;
 const p=spawnSync(process.execPath,['--check',resolve(root,'src',name)],{encoding:'utf8'});
 if(p.status!==0)errors.push({file:name,details:(p.stderr||p.stdout||'unknown error').trim()});
}
console.log(JSON.stringify({modules:count,failed:errors.length,errors,passed:errors.length===0},null,2));
if(errors.length||count===0)process.exitCode=1;
