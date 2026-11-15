#!/usr/bin/env node
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {FAMILY_CASES,SCALES,DEFAULT_SEED,runProperties} from './kernel_properties.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const catalog=JSON.parse(readFileSync(resolve(root,'tests/verification/coverage_catalog.json'),'utf8'));
if(catalog.schemaVersion!==1||!Array.isArray(catalog.operations))throw new Error('Invalid coverage catalog');
const ids=new Set(),families=new Set();
for(const op of catalog.operations){
 if(ids.has(op.id)||!Number.isInteger(op.layer)||op.layer<1||op.layer>5||!existsSync(resolve(root,op.module)))throw new Error(`Bad operation: ${op.id}`);
 ids.add(op.id);
 if(!['covered','unverified'].includes(op.status))throw new Error(`Invalid status ${op.id}`);
 if(!Array.isArray(op.properties))throw new Error(`No property list for ${op.id}`);
 if(op.status==='covered' && !op.properties.length && !(op.coverageType==='chromium-seeded' && Array.isArray(op.browserTests) && op.browserTests.length) && !(op.coverageType==='measured-benchmark' && Array.isArray(op.benchmarkTests) && op.benchmarkTests.length===2))throw new Error(`Missing coverage evidence for ${op.id}`);
 if(op.status==='unverified' && (op.properties.length||op.browserTests?.length))throw new Error(`Misleading coverage status for ${op.id}`);
 for(const benchmarkTest of op.benchmarkTests||[]){if(!existsSync(resolve(root,benchmarkTest)))throw new Error(`Missing benchmark evidence ${benchmarkTest}`);}
 for(const browserTest of op.browserTests||[]){if(!existsSync(resolve(root,browserTest)))throw new Error(`Missing Chromium evidence ${browserTest}`);}
 for(const name of op.properties){if(!Object.hasOwn(FAMILY_CASES,name))throw new Error(`Unknown property ${name}`);families.add(name);}
}
if(families.size!==Object.keys(FAMILY_CASES).length)throw new Error('One or more property families unlisted');
const checks=runProperties(),failures=checks.results.reduce((s,r)=>s+r.failed,0);
const byLayer=Object.fromEntries([1,2,3,4,5].map(layer=>{
 const ops=catalog.operations.filter(op=>op.layer===layer);
 return [layer,{covered:ops.filter(op=>op.status==='covered').length,total:ops.length}];
}));
const report={round:103,seed:DEFAULT_SEED,scales:SCALES,propertyFamilies:families.size,propertyCases:checks.results.reduce((s,r)=>s+r.count,0),failed:failures,operationsCovered:catalog.operations.filter(o=>o.status==='covered').length,operationsCatalogued:catalog.operations.length,byLayer,results:checks.results};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(failures)process.exitCode=1;
