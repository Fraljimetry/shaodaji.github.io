#!/usr/bin/env node
/** Scoped coverage catalog + execution evidence, with no file-existence-as-pass shortcut. */
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {FAMILY_CASES,SCALES,DEFAULT_SEED,runProperties} from './kernel_properties.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const catalog=JSON.parse(readFileSync(resolve(root,'tests/verification/coverage_catalog.json'),'utf8'));
const args=process.argv.slice(2);
const catalogOnly=args.includes('--catalog-only');
const evidenceArg=args.find(a=>a.startsWith('--evidence-file='));
if(catalogOnly&&evidenceArg)throw Error('Use --catalog-only or --evidence-file, not both');
if(catalog.schemaVersion!==1||!Array.isArray(catalog.operations)||catalog.operations.length!==28)throw Error('Invalid scoped coverage catalog');
const ids=new Set(),families=new Set();
for(const op of catalog.operations){
 if(!op.id||ids.has(op.id)||!Number.isInteger(op.layer)||op.layer<1||op.layer>5||!existsSync(resolve(root,op.module)))throw Error(`Bad operation: ${op.id}`);
 ids.add(op.id);
 if(!['covered','unverified'].includes(op.status)||!Array.isArray(op.properties))throw Error(`Invalid status/properties for ${op.id}`);
 const hasBrowser=Array.isArray(op.browserTests)&&op.browserTests.length>0;
 const hasBench=Array.isArray(op.benchmarkTests)&&op.benchmarkTests.length>0;
 if(op.status==='covered'&&!op.properties.length&&!hasBrowser&&!hasBench)throw Error(`Missing evidence declaration for ${op.id}`);
 if(op.status==='unverified'&&(op.properties.length||hasBrowser||hasBench))throw Error(`Misleading unverified status for ${op.id}`);
 if(hasBrowser&&op.coverageType!=='chromium-seeded')throw Error(`Bad browser coverage type: ${op.id}`);
 if(hasBench&&op.coverageType!=='measured-benchmark')throw Error(`Bad benchmark coverage type: ${op.id}`);
 for(const path of [...(op.browserTests||[]),...(op.benchmarkTests||[])])if(!existsSync(resolve(root,path)))throw Error(`Missing declared test ${path}`);
 for(const name of op.properties){if(!Object.hasOwn(FAMILY_CASES,name))throw Error(`Unknown property ${name}`);families.add(name);}
}
if(families.size!==Object.keys(FAMILY_CASES).length)throw Error('One or more property families unlisted');
let evidence=null;
if(evidenceArg){
 evidence=JSON.parse(readFileSync(resolve(root,evidenceArg.slice('--evidence-file='.length)),'utf8'));
 if(evidence.schemaVersion!==1||!Array.isArray(evidence.checks))throw Error('Invalid execution evidence');
}
// Require the exact executed file, not an arbitrary pathname ending in the
// declared suffix (e.g. /unrelated/tests/browser_smoke.py).
const pathExecuted=(path)=>evidence?.checks.some(c=>c.status==='PASS' && c.returnCode===0 &&
 Array.isArray(c.command) && c.command.some(arg=>typeof arg==='string' && resolve(root,arg)===resolve(root,path)));
const propertiesExecuted=Boolean(evidence?.checks.some(c=>c.name==='math-properties'&&c.status==='PASS'&&c.returnCode===0));
let propertyReport=null;
if(!catalogOnly&&!evidence){
 const checks=runProperties();
 propertyReport={seed:DEFAULT_SEED,scales:SCALES,propertyCases:checks.results.reduce((s,r)=>s+r.count,0),failed:checks.results.reduce((s,r)=>s+r.failed,0),results:checks.results};
}
const opResults=catalog.operations.map(op=>{
 const missing=[];
 if(op.status==='unverified')missing.push('no declared coverage');
 if(op.properties.length&&!propertiesExecuted&&!propertyReport?.results?.length)missing.push('no executed property evidence');
 for(const p of op.browserTests||[])if(!pathExecuted(p))missing.push(`not executed: ${p}`);
 for(const p of op.benchmarkTests||[])if(!pathExecuted(p))missing.push(`not executed: ${p}`);
 if(propertyReport?.failed)missing.push('mathematical property failure');
 return {id:op.id,layer:op.layer,catalogStatus:op.status,verified:missing.length===0,missing};
});
const verified=opResults.filter(op=>op.verified).length;
const report={
 catalogRound:catalog.round,scope:'28 scoped operation families; not an exhaustive application audit',
 catalogued:catalog.operations.length,declaredCovered:catalog.operations.filter(o=>o.status==='covered').length,
 executedVerified:verified,propertyFamilies:families.size,mode:catalogOnly?'catalog-only':evidence?'execution-evidence':'properties-only',
 propertyReport,operations:opResults,complete:verified===catalog.operations.length,
};
console.log(JSON.stringify(report,null,2));
if(!catalogOnly && !report.complete)process.exitCode=2;
if(propertyReport?.failed)process.exitCode=1;
